import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as { id: string };
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }
    if (user.isBlocked) {
      res.status(403).json({ success: false, message: "Account blocked" });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};
