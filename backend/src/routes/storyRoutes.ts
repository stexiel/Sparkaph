import { Router } from "express";
import {
  createStory,
  getStories,
  viewStory,
  getMyStories,
  deleteStory,
  getUserStories,
} from "../controllers/storyController";
import { authenticateToken } from "../middleware/authMiddleware";
import { uploadRateLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

// Protected routes
router.use(authenticateToken);
router.use(uploadRateLimiter);

router.post("/", createStory);
router.get("/", getStories);
router.post("/:storyId/view", viewStory);
router.get("/my", getMyStories);
router.delete("/:storyId", deleteStory);

// Public route to get user stories
export const publicStoryRouter = Router();
publicStoryRouter.get("/user/:userId", getUserStories);

export default router;
