import { Request, Response } from "express";
import User, { IUser } from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-change-in-production";

function tokenFor(user: IUser): string {
  return jwt.sign(
    { id: user._id.toString() },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      res.status(400).json({ success: false, message: "Name, email and password required" });
      return;
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(400).json({ success: false, message: "Email already registered" });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role: "user",
    });
    const token = tokenFor(user);
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      res.status(400).json({ success: false, message: "Email and password required" });
      return;
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }
    if (user.isBlocked) {
      res.status(403).json({ success: false, message: "Account blocked" });
      return;
    }
    const ok = await bcrypt.compare(password, user.password || "");
    if (!ok) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }
    user.lastSeen = new Date();
    await user.save();
    const token = tokenFor(user);
    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authenticated" });
    return;
  }
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
    },
  });
};
