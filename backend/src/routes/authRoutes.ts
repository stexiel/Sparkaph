import { Router } from "express";
import { register, login, checkUsername } from "../controllers/authController";
import { authRateLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

router.get("/check-username", checkUsername);
router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);

export default router;
