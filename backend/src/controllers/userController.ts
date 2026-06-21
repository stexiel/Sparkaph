import prisma from "../utils/prisma";
import { AuthRequest, Response } from "../middleware/authMiddleware";
import { updateProfileSchema, searchUsersSchema } from "../utils/validation";
import { getCache, setCache, deleteCache } from "../utils/redis";
import logger from "../utils/logger";

export const getDevelopers = async (req: AuthRequest, res: Response) => {
  try {
    const developers = await prisma.user.findMany({
      where: {
        isDeveloper: true,
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
      },
    });
    res.json(developers);
  } catch (error) {
    console.error("Error fetching developers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = searchUsersSchema.parse(req.query);
    const { query } = validatedData;
    const userId = req.user?.userId;

    // Check cache first
    const cacheKey = `search:${query}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    if (!query || typeof query !== "string") {
      res.status(400).json({ message: "Search query is required" });
      return;
    }

    logger.info({ query }, "Searching users");

    let users;

    try {
      // Try case-insensitive search first
      users = await prisma.user.findMany({
        where: {
          username: {
            contains: query,
            mode: "insensitive",
          },
          NOT: {
            id: userId,
          },
        },
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
          relationshipStatus: true,
          isOnline: true,
          lastSeen: true,
          isDeveloper: true,
        },
        take: 10,
      });
    } catch (dbError) {
      // Fallback to case-sensitive search if insensitive mode fails
      logger.warn({ error: dbError, query }, "Case-insensitive user search failed, using case-sensitive fallback");
      users = await prisma.user.findMany({
        where: {
          username: {
            contains: query,
          },
          NOT: {
            id: userId,
          },
        },
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
          relationshipStatus: true,
          isOnline: true,
          lastSeen: true,
          isDeveloper: true,
        },
        take: 10,
      });
    }

    logger.info({ count: users.length, query }, "Users found");

    // Cache for 5 minutes
    await setCache(cacheKey, users, 300);
    res.json(users);
  } catch (error) {
    logger.error({ error, query: req.query.query }, "Error searching users");
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
};

export const checkUsernameAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.query;
    const userId = req.user?.userId;

    if (!username || typeof username !== "string") {
      res.status(400).json({ message: "Username is required" });
      return;
    }

    // Check if username is used by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        NOT: {
          id: userId,
        },
      },
    });

    // Check if username is used by an app handle
    const existingApp = await prisma.app.findUnique({
      where: { handle: username },
    });

    const isAvailable = !existingUser && !existingApp;
    
    res.json({ 
      available: isAvailable,
      reason: !isAvailable ? (existingUser ? "Username already taken" : "Username already used by an app handle") : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPublicProfile = async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findFirst({
      where: { username: userId },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        relationshipStatus: true,
        isOnline: true,
        lastSeen: true,
        isDeveloper: true,
        createdAt: true,
        apps: {
          where: { status: "PUBLISHED", isPublic: true },
          select: {
            id: true,
            name: true,
            handle: true,
            description: true,
            views: true,
          },
          take: 10,
        },
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Check cache first
    const cacheKey = `profile:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        bio: true,
        relationshipStatus: true,
        isOnline: true,
        lastSeen: true,
        notificationsEnabled: true,
        createdAt: true,
      },
    });

    // Cache for 10 minutes
    await setCache(cacheKey, user, 600);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const userId = req.user?.userId;

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, isDeveloper: true },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        siteAvatar: true,
        bio: true,
        relationshipStatus: true,
        isOnline: true,
        lastSeen: true,
        notificationsEnabled: true,
        isDeveloper: true,
      },
    });

    // Invalidate cache
    await deleteCache(`profile:${userId}`);

    res.json(user);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res
        .status(400)
        .json({ message: "Invalid input data", errors: error.errors });
      return;
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const toggleDeveloperMode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isDeveloper: !user.isDeveloper },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        siteAvatar: true,
        bio: true,
        relationshipStatus: true,
        isOnline: true,
        lastSeen: true,
        notificationsEnabled: true,
        isDeveloper: true,
      },
    });

    // Invalidate cache
    await deleteCache(`profile:${userId}`);

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
