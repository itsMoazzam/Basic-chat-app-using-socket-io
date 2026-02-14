import { Router } from "express";
import { auth } from "../middleware/auth";
import { listChats, getOrCreateChat, getMessages } from "../controllers/chatController";

const router = Router();
router.use(auth);
router.get("/", listChats);
router.post("/", getOrCreateChat);
router.get("/:chatId/messages", getMessages);
export default router;
