import { Router } from "express";
import {
  createApp,
  getApps,
  getApp,
  updateApp,
  deleteApp,
  searchApps,
  getAppByHandle,
  joinAppChat,
  checkHandleAvailability,
} from "../controllers/appController";
import { authenticateToken } from "../middleware/authMiddleware";
import { generalRateLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

// Protected routes
router.use(authenticateToken);
router.use(generalRateLimiter);

// Search apps (must be before /:id route)
router.get("/search", searchApps);
router.get("/check-handle", checkHandleAvailability);

// CRUD operations for apps
router.post("/", createApp);
router.get("/", getApps);
router.post("/:id/join", joinAppChat);
router.get("/:id", getApp);
router.put("/:id", updateApp);
router.delete("/:id", deleteApp);

// Public route to get app by handle (no auth required)
export const publicAppRouter = Router();
publicAppRouter.get("/:handle", getAppByHandle);

export default router;
