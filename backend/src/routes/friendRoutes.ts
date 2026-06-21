import { Router } from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendRequests,
  getFriends,
  getFriendStatus,
} from "../controllers/friendController";
import { authenticateToken } from "../middleware/authMiddleware";
import { generalRateLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

router.use(authenticateToken);
router.use(generalRateLimiter);

// Friend requests
router.post("/request", sendFriendRequest);
router.get("/requests", getFriendRequests);
router.put("/request/:requestId/accept", acceptFriendRequest);
router.put("/request/:requestId/reject", rejectFriendRequest);

// Friends
router.get("/", getFriends);
router.delete("/:friendId", removeFriend);
router.get("/status/:userId", getFriendStatus);

export default router;
