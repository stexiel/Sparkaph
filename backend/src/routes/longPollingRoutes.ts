import { Router } from "express";
import { getUpdates, sendUpdateToApp } from "../controllers/longPollingController";
import { authenticateApiToken } from "../middleware/apiTokenMiddleware";

const router = Router();

// Long polling endpoint (like Telegram getUpdates)
router.get("/getUpdates", authenticateApiToken, getUpdates);

// Internal endpoint to send updates to apps
router.post("/sendUpdate", sendUpdateToApp);

export default router;
