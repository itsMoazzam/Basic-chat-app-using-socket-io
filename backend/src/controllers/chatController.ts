import { Request, Response } from "express";
import Chat from "../models/Chat";
import Message from "../models/Message";
import User from "../models/User";

export const listChats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const chats = await Chat.find({ participants: userId })
      .populate("participants", "name email avatar")
      .sort({ lastMessageTime: -1 })
      .lean();
    const list = chats.map((c: any) => {
      const other = c.participants.find((p: any) => p._id.toString() !== userId.toString());
      return {
        _id: c._id,
        other: other ? { id: other._id, name: other.name, email: other.email, avatar: other.avatar } : null,
        lastMessage: c.lastMessage,
        lastMessageTime: c.lastMessageTime,
      };
    });
    res.json({ success: true, chats: list });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to load chats" });
  }
};

export const getOrCreateChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { participantId } = req.body;
    if (!participantId) {
      res.status(400).json({ success: false, message: "participantId required" });
      return;
    }
    const participant = await User.findById(participantId);
    if (!participant) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    let chat = await Chat.findOne({
      participants: { $all: [userId, participantId] },
    }).populate("participants", "name email avatar");
    if (!chat) {
      const created = await Chat.create({
        participants: [userId, participantId],
        participantEmails: [req.user!.email, participant.email],
      });
      chat = await Chat.findById(created._id).populate("participants", "name email avatar");
    }
    if (!chat) {
      res.status(500).json({ success: false, message: "Failed to create chat" });
      return;
    }
    const other = (chat as any).participants.find((p: any) => p._id.toString() !== userId.toString());
    res.json({
      success: true,
      chat: {
        _id: chat._id,
        other: other ? { id: other._id, name: other.name, email: other.email, avatar: other.avatar } : null,
        lastMessage: chat.lastMessage,
        lastMessageTime: chat.lastMessageTime,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to get or create chat" });
  }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { chatId } = req.params;
    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) {
      res.status(404).json({ success: false, message: "Chat not found" });
      return;
    }
    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: 1 })
      .lean();
    res.json({ success: true, messages });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to load messages" });
  }
};

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const users = await User.find({ _id: { $ne: userId }, isBlocked: false })
      .select("name email avatar")
      .lean();
    res.json({ success: true, users });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to load users" });
  }
};
