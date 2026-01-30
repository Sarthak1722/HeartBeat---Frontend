import { io } from "socket.io-client";

const URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const socket = io(URL, {
  autoConnect: false,
});

socket.on("connect", () => {
  console.log("✅ connected to backend:", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ disconnected from backend");
});

export default socket;
