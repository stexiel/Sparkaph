import { Router } from "express";
import { upload } from "../middleware/uploadMiddleware";
import { authenticateToken } from "../middleware/authMiddleware";
import { uploadRateLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

router.post(
  "/",
  authenticateToken,
  uploadRateLimiter,
  upload.single("file"),
  (req: any, res) => {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    // Generate appropriate URL based on storage type
    let fileUrl: string;
    if (process.env.AWS_S3_BUCKET && req.file.location) {
      // S3 URL
      fileUrl = req.file.location;
    } else {
      // Local storage URL - return relative path for frontend to handle
      fileUrl = `/uploads/${req.file.filename}`;
    }

    res.json({ url: fileUrl });
  },
);

export default router;
