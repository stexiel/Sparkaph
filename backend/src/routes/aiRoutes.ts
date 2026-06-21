import { Router } from "express";
import { chatWithAI, generateZip, downloadZip, generateAndDeploy } from "../controllers/aiController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/chat", chatWithAI);
router.post("/generate-zip", generateZip);
router.get("/download/:fileName", downloadZip);
router.post("/generate-and-deploy", authenticateToken, generateAndDeploy);

export default router;
