import { Response } from "../middleware/authMiddleware";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/authMiddleware";
import { notifyNewFollower } from "../utils/notifications";

export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;
    const followerId = req.user?.userId;

    if (!followerId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (followerId === userId) {
      res.status(400).json({ message: "Cannot follow yourself" });
      return;
    }

    // Check if already following
    const existing = await prisma.follower.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    if (existing) {
      res.status(400).json({ message: "Already following" });
      return;
    }

    const follower = await prisma.follower.create({
      data: {
        followerId,
        followingId: userId,
      },
      include: {
        following: {
          select: { id: true, username: true, avatar: true },
        },
        follower: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    // Update follower/following counts
    await prisma.user.update({
      where: { id: userId },
      data: { followersCount: { increment: 1 } },
    });
    await prisma.user.update({
      where: { id: followerId },
      data: { followingCount: { increment: 1 } },
    });

    // Send notification to the user being followed
    await notifyNewFollower(followerId, userId);

    // Check if mutual follow exists (both users follow each other)
    const mutualFollow = await prisma.follower.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: followerId,
        },
      },
    });

    // If mutual follow exists, create friend relationship automatically
    if (mutualFollow) {
      // Check if friend relationship already exists
      const existingFriend = await prisma.friend.findFirst({
        where: {
          OR: [
            { senderId: followerId, receiverId: userId },
            { senderId: userId, receiverId: followerId },
          ],
        },
      });

      if (!existingFriend) {
        // Create friend relationship
        await prisma.friend.create({
          data: {
            senderId: followerId,
            receiverId: userId,
            status: "ACCEPTED",
          },
        });

        // Create notification about becoming friends
        await prisma.notification.create({
          data: {
            userId: userId,
            type: "FRIEND",
            title: "Новый друг",
            message: `Вы и ${follower.follower.username} теперь друзья!`,
            fromUserId: followerId,
          },
        });

        await prisma.notification.create({
          data: {
            userId: followerId,
            type: "FRIEND",
            title: "Новый друг",
            message: `Вы и ${follower.following.username} теперь друзья!`,
            fromUserId: userId,
          },
        });
      }
    } else {
      // Create notification for the followed user (only if not mutual)
      await prisma.notification.create({
        data: {
          userId: userId,
          type: "FOLLOW",
          title: "Новый подписчик",
          message: `${follower.follower.username} подписался на вас`,
          fromUserId: followerId,
        },
      });
    }

    res.status(201).json(follower);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const unfollowUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.user?.userId;

    if (!followerId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const follower = await prisma.follower.deleteMany({
      where: {
        followerId,
        followingId: userId,
      },
    });

    if (follower.count === 0) {
      res.status(404).json({ message: "Not following this user" });
      return;
    }

    // Update follower/following counts
    await prisma.user.update({
      where: { id: userId },
      data: { followersCount: { decrement: 1 } },
    });
    await prisma.user.update({
      where: { id: followerId },
      data: { followingCount: { decrement: 1 } },
    });

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFollowers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const followers = await prisma.follower.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
            isOnline: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(followers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFollowing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const following = await prisma.follower.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
            isOnline: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(following);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkFollowStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const follower = await prisma.follower.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    });

    res.json({ isFollowing: !!follower });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserFollowers = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const followers = await prisma.follower.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
            isOnline: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(followers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserFollowing = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const following = await prisma.follower.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
            isOnline: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(following);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
