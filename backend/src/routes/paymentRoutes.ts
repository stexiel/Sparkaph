import { Router } from 'express';
import {
  createPayment,
  getPaymentStatus,
  getDeveloperBalance,
  requestWithdrawal,
  boostyWebhook,
  confirmPayment,
} from '../controllers/paymentController';
import { authenticateAppToken } from '../middleware/appAuthMiddleware';
import { authenticateToken } from '../middleware/authMiddleware';
import { generalRateLimiter } from '../middleware/rateLimitMiddleware';

const router = Router();

// App SDK routes (require app token)
router.post('/create', authenticateAppToken, generalRateLimiter, createPayment);
router.get('/:paymentId/status', authenticateAppToken, getPaymentStatus);

// Developer routes (require user auth)
router.get('/balance', authenticateToken, getDeveloperBalance);
router.post('/withdraw', authenticateToken, requestWithdrawal);

// Webhook from Boosty (no auth - verified by signature)
router.post('/webhook/boosty', boostyWebhook);

// Manual confirmation (for testing)
router.post('/:paymentId/confirm', authenticateToken, confirmPayment);

export default router;
