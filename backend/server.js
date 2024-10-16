import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./database/connectDB.js";
import authRoutes from "./routes/auth.js";
import cookieParser from "cookie-parser";
import { Message } from "./models/message.js";
import { Group } from "./models/group.js";
// Load environment variables from .env file
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

connectDB();

// Middleware
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Adjust as needed
    credentials: true,
  })
);

app.use(express.json());

app.use("/auth", authRoutes);
// Handle Socket.IO connections
let activeUsers = [];

io.on("connection", (socket) => {
  // console.log("A user connected:", socket.id);

  // Listen for username and add to active users
  socket.on("set-username", (username) => {
    activeUsers.push({ id: socket.id, username });
    io.emit("update-user-list", activeUsers); // Update user list
  });

  // Helper function to standardize room names
  const getRoomName = (user1, user2) => {
    return [user1, user2].sort().join("-"); // Sort usernames alphabetically
  };

  // Listen for join-room event
  socket.on("join-room", async (users) => {
    const room = getRoomName(users[0], users[1]);
    socket.join(room);

    // Fetch chat history from the database
    const chatHistory = await Message.find({ room }).sort({ timestamp: 1 });

    // Send chat history to the user who joined the room
    socket.emit("chat-history", chatHistory);
  });

  // Listen for send-message event
  socket.on("send-message", async (data, callback) => {
    try {
      // console.log("Message received on server:", data);
      const message = new Message({
        sender: data.user,
        room: data.room,
        message: data.message,
        timestamp: new Date(),
      });
      // Save the message in the database
      await message.save();

      // Emit the saved message to the room
      io.to(data.room).emit("receive-message", data);

      callback(null); // Acknowledge message was processed successfully
    } catch (error) {
      callback("Error saving message to the database: " + error.message);
    }
  });

  // Listen for group creation
  socket.on("create-group", async (groupName, members) => {
    try {
      const newGroup = new Group({ groupName, members });
      await newGroup.save(); // Save the group to the database

      // Add all group members to the group room
      members.forEach((member) => {
        const groupRoom = `group-${groupName}`;
        const userSocket = activeUsers.find((user) => user.username === member);
        if (userSocket) {
          io.to(userSocket.id).socketsJoin(groupRoom); // Add each user to the group room
        }
      });

      const groups = await Group.find(); // Retrieve all groups from the database
      io.emit("update-group-list", groups); // Broadcast updated groups list
    } catch (error) {
      console.error("Error creating group:", error);
      socket.emit("error", "Could not create group: " + error.message);
    }
  });
  socket.on("typing", (data) => {
    socket.broadcast.emit("typing", data); // Emit the typing event to all other clients
  });

  socket.on("stopTyping", (data) => {
    socket.broadcast.emit("stopTyping", data); // Emit the stop typing event to all other clients
  });
  // Listen for joining a group room
  socket.on("join-group", async (groupName) => {
    try {
      const group = await Group.findOne({ groupName });
      if (!group) {
        return socket.emit("error", "Group not found");
      }

      const groupRoom = `group-${groupName}`;
      socket.join(groupRoom);
      socket.emit("joined-group", groupName);

      // Send group chat history (if available)
      const chatHistory = await Message.find({ room: groupRoom }).sort({
        timestamp: 1,
      });
      socket.emit("chat-history", chatHistory);
    } catch (error) {
      console.error("Error joining group:", error);
      socket.emit("error", "Could not join group: " + error.message);
    }
  });
  // Listen for sending a group message
  socket.on("send-group-message", async (data, callback) => {
    try {
      const groupRoom = `group-${data.groupName}`;
      const message = new Message({
        sender: data.user,
        room: groupRoom,
        message: data.message,
        timestamp: new Date(),
      });

      await message.save();

      io.to(groupRoom).emit("receive-message", data);
      callback(null);
    } catch (error) {
      callback("Error saving message to the database: " + error.message);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    // console.log("User disconnected:", socket.id);
    activeUsers = activeUsers.filter((user) => user.id !== socket.id);
    io.emit("update-user-list", activeUsers); // Update user list
  });
});

// Start the server
httpServer.listen(process.env.PORT || 4000, () => {
  console.log("Server is Running On Port", process.env.PORT);
});
