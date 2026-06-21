import { Router } from "express";
import {
  createToken,
  getTokens,
  deleteToken,
} from "../controllers/apiTokenController";
import { authenticateToken } from "../middleware/authMiddleware";
import { generalRateLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

router.use(authenticateToken);
router.use(generalRateLimiter);

router.post("/", createToken);
router.get("/", getTokens);
router.delete("/:id", deleteToken);

export default router;
