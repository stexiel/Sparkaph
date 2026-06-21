import { Response } from "../middleware/authMiddleware";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/authMiddleware";

export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;
    const blockerId = req.user?.userId;

    if (!blockerId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (blockerId === userId) {
      res.status(400).json({ message: "Cannot block yourself" });
      return;
    }

    // Check if already blocked
    const existing = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId: userId,
        },
      },
    });

    if (existing) {
      res.status(400).json({ message: "Already blocked" });
      return;
    }

    const block = await prisma.block.create({
      data: {
        blockerId,
        blockedId: userId,
      },
      include: {
        blocked: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    res.status(201).json(block);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const unblockUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const blockerId = req.user?.userId;

    if (!blockerId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const block = await prisma.block.deleteMany({
      where: {
        blockerId,
        blockedId: userId,
      },
    });

    if (block.count === 0) {
      res.status(404).json({ message: "Not blocking this user" });
      return;
    }

    res.json({ message: "Unblocked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getBlockedUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const blocked = await prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: { id: true, username: true, avatar: true, bio: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(blocked);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkBlockStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const block = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: currentUserId,
          blockedId: userId,
        },
      },
    });

    res.json({ isBlocked: !!block });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
