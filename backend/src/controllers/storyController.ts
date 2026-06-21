import { Response } from "../middleware/authMiddleware";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/authMiddleware";

export const createStory = async (req: AuthRequest, res: Response) => {
  try {
    const { mediaUrl, type, caption } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Stories expire after 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await prisma.story.create({
      data: {
        userId,
        mediaUrl,
        type: type || "IMAGE",
        caption,
        expiresAt,
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    res.status(201).json(story);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Get stories from friends
    const friends = await prisma.friend.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    const friendIds = friends.map((f: any) =>
      f.senderId === userId ? f.receiverId : f.senderId,
    );

    // Get stories that haven't expired
    const stories = await prisma.story.findMany({
      where: {
        userId: { in: friendIds },
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
        viewers: {
          select: { userId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add viewed status
    const storiesWithViewed = stories.map((story: any) => ({
      ...story,
      viewed: story.viewers.some((v: any) => v.userId === userId),
      viewCount: story.viewers.length,
    }));

    res.json(storiesWithViewed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const viewStory = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Check if already viewed
    const existing = await prisma.storyViewer.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
    });

    if (existing) {
      res.json({ message: "Already viewed" });
      return;
    }

    await prisma.storyViewer.create({
      data: {
        storyId,
        userId,
      },
    });

    res.json({ message: "Story viewed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyStories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const stories = await prisma.story.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      include: {
        viewers: {
          select: { userId: true, viewedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(stories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteStory = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const story = await prisma.story.deleteMany({
      where: {
        id: storyId,
        userId,
      },
    });

    if (story.count === 0) {
      res.status(404).json({ message: "Story not found" });
      return;
    }

    res.json({ message: "Story deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserStories = async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    const stories = await prisma.story.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(stories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
