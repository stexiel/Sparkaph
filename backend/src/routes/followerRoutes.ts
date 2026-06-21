import { Router } from "express";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
  getUserFollowers,
  getUserFollowing,
} from "../controllers/followerController";
import { authenticateToken } from "../middleware/authMiddleware";
import { generalRateLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

router.use(authenticateToken);
router.use(generalRateLimiter);

router.post("/follow", followUser);
router.delete("/unfollow/:userId", unfollowUser);
router.get("/followers", getFollowers);
router.get("/following", getFollowing);
router.get("/status/:userId", checkFollowStatus);
router.get("/user/:userId/followers", getUserFollowers);
router.get("/user/:userId/following", getUserFollowing);

export default router;
