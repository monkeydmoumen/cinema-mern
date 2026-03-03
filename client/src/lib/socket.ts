// src/lib/socket.ts
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:4000";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket"], // cleaner in production
});