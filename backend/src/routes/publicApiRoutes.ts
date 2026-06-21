import { Router } from "express";
import {
  generateUserToken,
  verifyUserToken,
  getUser,
  sendMessage,
  saveData,
  getData,
  deleteData,
  createPayment,
  getPaymentStatus,
} from "../controllers/publicApiController";
import { authenticateApiToken } from "../middleware/apiTokenMiddleware";
import { generalRateLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

// All routes require API token authentication
router.use(authenticateApiToken);
router.use(generalRateLimiter);

// User token management
router.post("/auth/generate-token", generateUserToken);
router.post("/auth/verify-token", verifyUserToken);

// User operations
router.get("/users/:userId", getUser);

// Messaging
router.post("/messages/send", sendMessage);

// Storage
router.post("/storage/save", saveData);
router.post("/storage/get", getData);
router.post("/storage/delete", deleteData);

// Payments
router.post("/payments/create", createPayment);
router.get("/payments/:paymentId", getPaymentStatus);

export default router;
