import { Router } from "express";
import { auth } from "../middleware/auth";
import { listUsers } from "../controllers/chatController";

const router = Router();
router.use(auth);
router.get("/", listUsers);
export default router;
