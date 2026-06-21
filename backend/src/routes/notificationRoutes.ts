import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} from "../controllers/notificationController";
import { authenticateToken } from "../middleware/authMiddleware";
import { generalRateLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

router.use(authenticateToken);
router.use(generalRateLimiter);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/:notificationId/read", markAsRead);
router.put("/mark-all-read", markAllAsRead);
router.delete("/:notificationId", deleteNotification);

export default router;
