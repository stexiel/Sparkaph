import { Router } from "express";
import {
  getUserData,
  setUserData,
  getUserDataKeys,
  deleteUserData,
  getCurrentUser,
} from "../controllers/appSdkController";
import { authenticateApiToken } from "../middleware/apiTokenMiddleware";

const router = Router();

// All SDK routes require API token authentication
router.use(authenticateApiToken);

// User data endpoints (user-specific)
router.get("/data", getUserData);
router.post("/data", setUserData);
router.get("/data/keys", getUserDataKeys);
router.delete("/data", deleteUserData);

// User info
router.get("/user/me", getCurrentUser);

export default router;
