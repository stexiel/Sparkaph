import { Router } from "express";
import {
  createGroup,
  getGroups,
  addGroupMember,
  removeGroupMember,
  updateGroup,
  searchPublicGroups,
  getPublicGroupByHandle,
  joinPublicGroup,
} from "../controllers/groupController";
import { authenticateToken } from "../middleware/authMiddleware";
import { generalRateLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

router.use(authenticateToken);
router.use(generalRateLimiter);

router.post("/", createGroup);
router.get("/", getGroups);
router.post("/member", addGroupMember);
router.delete("/member", removeGroupMember);
router.put("/", updateGroup);
router.get("/search", searchPublicGroups);
router.get("/public/:handle", getPublicGroupByHandle);
router.post("/join", joinPublicGroup);

export default router;
