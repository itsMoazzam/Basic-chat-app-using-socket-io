import { Server } from "socket.io";
import Message from "../models/Message";
import Chat from "../models/Chat";

const onlineUsers = new Map<string, string>();

export const initializeSocket = (io: Server): void => {
  io.on("connection", (socket) => {
    socket.on("user-online", (userId: string) => {
      onlineUsers.set(userId, socket.id);
      socket.join(userId);
      io.emit("user-status", { userId, status: "online", onlineUsers: Array.from(onlineUsers.keys()) });
    });

    socket.on("user-offline", (userId: string) => {
      onlineUsers.delete(userId);
      socket.leave(userId);
      io.emit("user-status", { userId, status: "offline", onlineUsers: Array.from(onlineUsers.keys()) });
    });

    socket.on("join-chat", (chatId: string) => {
      socket.join(chatId);
    });

    socket.on("leave-chat", (chatId: string) => {
      socket.leave(chatId);
    });

    socket.on("send-message", async (data: {
      chatId: string;
      senderId: string;
      senderName: string;
      senderEmail: string;
      content: string;
    }) => {
      try {
        const { chatId, senderId, senderName, senderEmail, content } = data;
        const message = await Message.create({
          chat: chatId,
          sender: senderId,
          senderName,
          senderEmail,
          content,
          isRead: false,
        });
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: content.substring(0, 100),
          lastMessageTime: new Date(),
          lastMessageSender: senderId,
        });
        io.to(chatId).emit("receive-message", {
          id: message._id,
          chatId,
          sender: senderId,
          senderName,
          content,
          isRead: false,
          createdAt: message.createdAt,
        });
      } catch (err) {
        socket.emit("message-error", { message: "Failed to send message" });
      }
    });

    socket.on("typing", (data: { chatId: string; userId: string; senderName: string }) => {
      socket.broadcast.to(data.chatId).emit("user-typing", { userId: data.userId, senderName: data.senderName, isTyping: true });
    });

    socket.on("stop-typing", (data: { chatId: string; userId: string }) => {
      socket.broadcast.to(data.chatId).emit("user-typing", { userId: data.userId, isTyping: false });
    });

    socket.on("mark-read", async (data: { messageId: string; chatId: string }) => {
      try {
        await Message.findByIdAndUpdate(data.messageId, { isRead: true, readAt: new Date() });
        io.to(data.chatId).emit("message-read", { messageId: data.messageId, readAt: new Date() });
      } catch {}
    });

    socket.on("disconnect", () => {
      for (const [userId, sid] of onlineUsers.entries()) {
        if (sid === socket.id) {
          onlineUsers.delete(userId);
          io.emit("user-status", { userId, status: "offline", onlineUsers: Array.from(onlineUsers.keys()) });
          break;
        }
      }
    });
  });
};

export { onlineUsers };
