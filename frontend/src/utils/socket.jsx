import { io } from "socket.io-client";
const socket = io("https://samvaad-chat-app.onrender.com"); // Backend server URL
export default socket;
