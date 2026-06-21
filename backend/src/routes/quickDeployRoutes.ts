import { Router } from "express";
import {
  quickDeploy,
  deployFromGitHub,
  instantDeploy,
} from "../controllers/quickDeployController";
import { authenticateToken } from "../middleware/authMiddleware";
import { generalRateLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

router.use(authenticateToken);
router.use(generalRateLimiter);

// Quick deploy from URL
router.post("/url", quickDeploy);

// Deploy from GitHub
router.post("/github", deployFromGitHub);

// Instant deploy from HTML
router.post("/instant", instantDeploy);

export default router;
