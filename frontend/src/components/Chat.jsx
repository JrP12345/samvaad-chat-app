import React, { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import socket from "../utils/socket";
import "./chat.css";
import { Bars } from "react-loader-spinner";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [privateChatUser, setPrivateChatUser] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState("");
  const [groupName, setGroupName] = useState("");
  const [isInGroupChat, setIsInGroupChat] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState({});
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const getRoomName = (user1, user2) => {
    return [user1, user2].sort().join("-");
  };
  // Use useRef to store the timeout value persistently across renders
  const typingTimeoutRef = useRef(null);

  const handleTyping = (e) => {
    setMessage(e.target.value);

    // Emit "typing" event when the user is typing
    socket.emit("typing", { username });

    // Clear the previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set a new timeout for 3 seconds after the last keypress
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { username });
    }, 3000);
  };

  useEffect(() => {
    // Listen for "typing" events from other users
    socket.on("typing", (data) => {
      if (data.username !== username) {
        setTypingUser(data.username);
        setIsTyping(true); // Set typing state to true
      }
    });

    // Listen for "stopTyping" events
    socket.on("stopTyping", (data) => {
      if (data.username === typingUser) {
        setIsTyping(false); // Set typing state to false
        setTypingUser(null); // Clear the typing user
      }
    });

    return () => {
      // Clean up the event listeners when the component unmounts
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [typingUser, username, socket]);
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const response = await fetch(
          "https://samvaad-chat-app.onrender.com/auth/userInfo",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUsername(data.username);
          socket.emit("set-username", data.username);
        } else {
          console.error("Failed to fetch user info");
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };
    fetchUsername();

    const fetchGroups = async () => {
      try {
        const response = await fetch(
          "https://samvaad-chat-app.onrender.com/auth/groups",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setGroups(data);
        } else {
          console.error("Failed to fetch groups");
        }
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };

    fetchGroups();

    const handleMessageReceive = (msg) => {
      const currentRoom = isInGroupChat
        ? `group-${selectedGroup?.groupName}`
        : getRoomName(username, privateChatUser);

      if (msg.room === currentRoom) {
        setMessages((prev) => [...prev, msg]);
      } else if (msg.user !== username) {
        setUnreadMessages((prev) => ({
          ...prev,
          [msg.room]: prev[msg.room] ? prev[msg.room] + 1 : 1,
        }));
      }
    };

    const handleChatHistory = (history) => {
      const formattedHistory = history.map((msg) => ({
        ...msg,
        user: msg.sender,
      }));

      setMessages(formattedHistory);
    };

    const handleGroupListUpdate = (groups) => {
      setGroups(groups);
    };

    socket.on("receive-message", handleMessageReceive);
    socket.on("chat-history", handleChatHistory);
    socket.on("update-group-list", handleGroupListUpdate);

    const fetchAllUsers = async () => {
      try {
        const response = await fetch(
          "https://samvaad-chat-app.onrender.com/auth/users",
          {
            method: "GET",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAllUsers(data.users);
        } else {
          console.error("Failed to fetch users");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchAllUsers();

    return () => {
      socket.off("receive-message", handleMessageReceive);
      socket.off("chat-history", handleChatHistory);
      socket.off("update-group-list", handleGroupListUpdate);
    };
  }, [username, privateChatUser, selectedGroup, isInGroupChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    const room = isInGroupChat
      ? `group-${selectedGroup.groupName}`
      : getRoomName(username, privateChatUser);

    if (message.trim()) {
      const msgData = {
        message,
        user: username,
        room,
        timestamp: new Date().toISOString(),
        ...(isInGroupChat && { groupName: selectedGroup.groupName }),
      };

      const sendEvent = isInGroupChat ? "send-group-message" : "send-message";
      socket.emit(sendEvent, msgData, (error) => {
        if (error) {
          toast.error("Error sending message: " + error);
        }
      });

      setMessage("");

      // Emit "stopTyping" immediately when the message is sent
      socket.emit("stopTyping", { username });

      // Clear the typing state
      setIsTyping(false);
      setTypingUser(null);

      // Clear the timeout to prevent delayed "stopTyping" from running
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } else {
      toast.warn("Please enter a message.");
    }
  };

  const filteredUsers = allUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) &&
      user.username !== username
  );

  const createGroup = (e) => {
    e.preventDefault();
    if (groupName.trim()) {
      const members = [username];
      if (privateChatUser) {
        members.push(privateChatUser);
      }
      socket.emit("create-group", groupName, members);
      setGroupName("");
      setIsInGroupChat(true);
      setSelectedGroup({ groupName, members });
      toast.success("Group created!");
    } else {
      toast.warn("Please enter a group name.");
    }
  };

  const joinGroup = async (group) => {
    setLoading(true); // Start loading
    try {
      setSelectedGroup(group);
      setIsInGroupChat(true);
      setPrivateChatUser("");
      socket.emit("join-group", group.groupName);
      setMessages([]);
      setCurrentGroup(group.groupName);
      setUnreadMessages((prev) => ({
        ...prev,
        [`group-${group.groupName}`]: 0,
      }));
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error("Failed to join group");
    } finally {
      setLoading(false); // End loading in finally block
    }
  };

  const joinPrivateChat = async (user) => {
    setLoading(true); // Start loading
    try {
      setPrivateChatUser(user.username);
      setIsInGroupChat(false);
      setSelectedGroup(null);
      socket.emit("join-room", [username, user.username]);
      setMessages([]);
      setUnreadMessages((prev) => ({
        ...prev,
        [getRoomName(username, user.username)]: 0,
      }));
    } catch (error) {
      console.error("Error joining private chat:", error);
      toast.error("Failed to join private chat");
    } finally {
      setLoading(false); // End loading in finally block
    }
  };

  return (
    <div className="flex  bg-black">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Sidebar */}
      <div className="w-1/4 p-6 bg-opacity-90 bg-[#1a1a1a] rounded-lg shadow-2xl overflow-y-auto sidebar">
        {/* Group Creation */}
        <form onSubmit={createGroup} className="mb-6">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            className="p-2 w-full rounded-lg shadow-lg mb-2 text-black"
          />
          <button
            type="submit"
            className="w-full p-2 bg-white text-black rounded-lg hover:bg-gray-300 transition duration-300 ease-in-out"
          >
            Create Group
          </button>
        </form>

        {/* User Search */}
        <input
          type="text"
          value={userSearchQuery}
          onChange={(e) => setUserSearchQuery(e.target.value)}
          placeholder="🔍 Search users..."
          className="mb-4 p-3 w-full border border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-black transition duration-300 ease-in-out shadow-lg"
        />

        {/* Users List */}
        <h2 className="text-3xl font-semibold text-white mb-2 text-center">
          Users
        </h2>
        <ul className="space-y-2 mb-4">
          {filteredUsers.map((user, index) => {
            const room = getRoomName(username, user.username);
            return (
              <li
                key={index}
                className="relative p-3 bg-gray-800 rounded-lg cursor-pointer text-white hover:bg-gray-700 transition duration-300 ease-in-out"
                onClick={() => joinPrivateChat(user)}
              >
                {user.username}
                {unreadMessages[room] > 0 && (
                  <span className="notification-circle">
                    {unreadMessages[room]}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {/* Groups List */}
        <h2 className="text-3xl font-semibold text-white mb-2 text-center">
          Rooms
        </h2>
        <ul className="space-y-2">
          {groups.map((group) => {
            const groupRoom = `group-${group.groupName}`;
            return (
              <li
                key={group.groupName}
                className="relative p-3 bg-gray-800 rounded-lg cursor-pointer text-white hover:bg-gray-700 transition duration-300 ease-in-out"
                onClick={() => joinGroup(group)}
              >
                {group.groupName}
                {unreadMessages[groupRoom] > 0 && (
                  <span className="notification-circle">
                    {unreadMessages[groupRoom]}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Chat Window */}
      <div className="w-3/4 p-6 flex flex-col bg-opacity-90 bg-[#1a1a1a] rounded-lg shadow-2xl  chat-window">
        <div className="text-white text-4xl font-extrabold mb-6 text-center">
          {privateChatUser || currentGroup}
        </div>
        <div className="flex-1 overflow-y-auto mb-4 p-2">
          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-center items-center mb-2">
              <Bars
                height="40"
                width="40"
                color="blue"
                ariaLabel="bars-loading"
                wrapperStyle={{}}
                wrapperClass=""
                visible={true}
              />
            </div>
          )}

          {/* Check if there are no messages for private or group chat */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white text-center">
              {/* Display messages based on the chat type */}
              {!privateChatUser && !currentGroup ? (
                <>
                  <h2 className="text-xl font-semibold">Welcome to Samvaad!</h2>
                  <p className="mt-2">
                    Start a conversation by selecting a group or sending a
                    message.
                  </p>
                </>
              ) : !privateChatUser && currentGroup ? (
                <>
                  <h2 className="text-xl font-semibold">No Messages Yet!</h2>
                  <p className="mt-2">
                    Be the first to send a message in this group.
                  </p>
                </>
              ) : privateChatUser ? (
                <>
                  <h2 className="text-xl font-semibold">
                    Start a Private Chat!
                  </h2>
                  <p className="mt-2">
                    Send a message to your friend to get started.
                  </p>
                </>
              ) : null}
            </div>
          ) : (
            messages.map((msg, index) => {
              const formattedTime = new Date(msg.timestamp).toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );

              return (
                <div
                  key={index}
                  className={`my-2 ${
                    msg.user === username ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg text-white inline-block relative ${
                      msg.user === username
                        ? "bg-green-500 rounded-br-none"
                        : "bg-blue-500 rounded-bl-none"
                    }`}
                    style={{
                      maxWidth: "75%", // Limit the max width of the bubble
                      position: "relative", // Position for the timestamp
                      borderTopLeftRadius:
                        msg.user === username ? "12px" : "0px", // Rounded on top left for user
                      borderTopRightRadius:
                        msg.user === username ? "0px" : "12px", // Rounded on top right for others
                      borderBottomLeftRadius: "12px", // Rounding at the bottom left
                      borderBottomRightRadius: "12px",
                    }}
                  >
                    {/* Display the sender's username only for group chats */}
                    {!privateChatUser && (
                      <span className="font-bold text-xs">
                        {msg.user === username ? "You" : msg.user}
                      </span>
                    )}
                    <span className="block break-words">
                      {msg.message}{" "}
                      <span className="text-xs text-gray-300 ml-3 mt-2">
                        {formattedTime}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
          {isTyping && (
            <div className="flex items-center mb-2">
              <div className="dot animate-ping h-2 w-2 bg-blue-500 rounded-full mr-1"></div>
              <div className="dot animate-ping h-2 w-2 bg-blue-500 rounded-full mr-1"></div>
              <div className="dot animate-ping h-2 w-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-400">{typingUser} is typing...</span>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="flex">
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            placeholder="Type your message here..."
            className="p-3 w-full border border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-black transition duration-300 ease-in-out shadow-lg"
          />
          <button
            type="submit"
            className="ml-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
