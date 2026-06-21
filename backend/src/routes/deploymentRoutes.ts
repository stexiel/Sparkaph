import { Router } from "express";
import {
  uploadZip,
  getDeployments,
  pollDeploymentStatus,
} from "../controllers/deploymentController";
import { authenticateToken } from "../middleware/authMiddleware";
import { uploadRateLimiter } from "../middleware/rateLimitMiddleware";
import { uploadZipFile } from "../middleware/uploadMiddleware";

const router = Router();

router.use(authenticateToken);
router.use(uploadRateLimiter);

router.get("/:appId", getDeployments);
router.get("/:appId/poll", pollDeploymentStatus);
router.post("/:appId/upload", uploadZipFile.single("file"), uploadZip);

export default router;
