import { Router } from "express";
import { serveHostedApp, getAppMetadata } from "../controllers/hostedAppController";

const router = Router({ mergeParams: true });

// Get app metadata (for SEO)
router.get("/metadata", getAppMetadata);

// Serve app files (catch-all)
router.use(serveHostedApp);

export default router;
