import { Router } from "express";
import {
  createChat,
  getChats,
  deleteChat,
} from "../controllers/chatController";
import {
  sendMessage,
  getMessages,
  markMessagesAsRead,
  deleteMessage,
} from "../controllers/messageController";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  messageRateLimiter,
  generalRateLimiter,
} from "../middleware/rateLimitMiddleware";

const router = Router();

router.use(authenticateToken);
router.use(generalRateLimiter);

router.post("/", createChat);
router.get("/", getChats);
router.delete("/:id", deleteChat);
router.post("/message", messageRateLimiter, sendMessage);
router.get("/:chatId/messages", getMessages);
router.post("/:chatId/read", markMessagesAsRead);
router.delete("/message/:messageId", deleteMessage);

export default router;
