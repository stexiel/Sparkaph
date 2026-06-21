import { Router } from "express";
import {
  getWallet,
  getTransactions,
  purchaseSparks,
  checkPurchaseStatus,
  payForApp,
  checkAppOwnership,
} from "../controllers/walletController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.get("/", getWallet);
router.get("/transactions", getTransactions);
router.post("/purchase", purchaseSparks);
router.get("/purchase/:purchaseId", checkPurchaseStatus);
router.post("/pay-app", payForApp);
router.get("/owns/:appId", checkAppOwnership);

export default router;
