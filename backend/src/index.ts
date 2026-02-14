import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/database";
import { initializeSocket } from "./config/socket";
import authRoutes from "./routes/authRoutes";
import chatRoutes from "./routes/chatRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true },
});

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/users", userRoutes);

app.get("/api/health", (_, res) => res.json({ success: true }));

initializeSocket(io);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║  Chat server running on port ${PORT}   ║
║  Frontend: ${process.env.FRONTEND_URL || "http://localhost:3000"}
║  MongoDB: connected
╚════════════════════════════════════════╝`);
  });
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

export { app, httpServer, io };
