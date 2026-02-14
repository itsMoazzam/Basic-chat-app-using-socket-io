import { io, Socket } from "socket.io-client";

const socketURL = import.meta.env.VITE_SOCKET_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:5000");

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;
  socket = io(socketURL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
  });
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
