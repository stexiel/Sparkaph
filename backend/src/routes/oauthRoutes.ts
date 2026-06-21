import { Router } from "express";
import { githubOAuth, googleOAuth } from "../controllers/oauthController";

const router = Router();

router.post("/github/callback", githubOAuth);
router.post("/google/callback", googleOAuth);

export default router;
