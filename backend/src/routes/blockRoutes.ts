import { Router } from "express";
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  checkBlockStatus,
} from "../controllers/blockController";
import { authenticateToken } from "../middleware/authMiddleware";
import { generalRateLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

router.use(authenticateToken);
router.use(generalRateLimiter);

router.post("/block", blockUser);
router.delete("/unblock/:userId", unblockUser);
router.get("/blocked", getBlockedUsers);
router.get("/status/:userId", checkBlockStatus);

export default router;
