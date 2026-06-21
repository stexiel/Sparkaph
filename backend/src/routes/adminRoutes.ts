import { Router } from "express";
import { getStats, createAdmin, getAdmins, updateDailyStats } from "../controllers/adminController";
import { authenticateToken } from "../middleware/authMiddleware";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

// All admin routes require authentication
router.use(authenticateToken);

// Get statistics (admin only)
router.get("/stats", adminAuth, getStats);

// Create admin account (admin only)
router.post("/create-admin", adminAuth, createAdmin);

// Get all admin accounts (admin only)
router.get("/admins", adminAuth, getAdmins);

// Update daily stats (for cron job - no admin check needed)
router.post("/update-stats", updateDailyStats);

export default router;
