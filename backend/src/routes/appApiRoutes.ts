import { Router } from 'express';
import {
  getCurrentUser,
  sendMessage,
  getUserById,
  saveAppData,
  getAppData,
  deleteAppData,
} from '../controllers/appApiController';
import { authenticateAppToken } from '../middleware/appAuthMiddleware';
import { generalRateLimiter } from '../middleware/rateLimitMiddleware';

const router = Router();

// All routes require app token authentication
router.use(authenticateAppToken);
router.use(generalRateLimiter);

// User endpoints
router.get('/user', getCurrentUser); // Get current user from token
router.get('/users/:userId', getUserById); // Get any user by ID

// Messaging endpoints
router.post('/messages', sendMessage); // Send message to user

// Storage endpoints (key-value storage for app data)
router.post('/storage', saveAppData); // Save data
router.get('/storage/:key', getAppData); // Get data by key
router.delete('/storage/:key', deleteAppData); // Delete data

export default router;
