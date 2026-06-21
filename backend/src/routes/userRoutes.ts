import { Router } from "express";
import {
  searchUsers,
  getProfile,
  updateProfile,
  toggleDeveloperMode,
  getPublicProfile,
  checkUsernameAvailability,
  getDevelopers,
} from "../controllers/userController";
import { authenticateToken } from "../middleware/authMiddleware";
import { generalRateLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

router.use(authenticateToken);
router.use(generalRateLimiter);

router.get("/search", searchUsers);
router.get("/developers", getDevelopers);
router.get("/check-username", checkUsernameAvailability);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post("/toggle-developer", toggleDeveloperMode);

// Public route for viewing other profiles (no auth required)
export const publicUserRouter = Router();
publicUserRouter.get("/:userId", getPublicProfile);

export default router;
