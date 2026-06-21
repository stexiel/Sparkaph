import prisma from "../utils/prisma";
import { AuthRequest, Response } from "../middleware/authMiddleware";
import crypto from "crypto";
import { notifyAppCreated } from "../utils/notifications";
import logger from "../utils/logger";

export const createApp = async (req: AuthRequest, res: Response) => {
  try {
    const { name, handle, description, type } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Check if user is developer
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isDeveloper) {
      res.status(403).json({ message: "Developer mode required" });
      return;
    }

    // Check if handle is unique (both apps and usernames)
    const existingApp = await prisma.app.findUnique({
      where: { handle },
    });
    if (existingApp) {
      res.status(400).json({ message: "Handle already taken by an app" });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: handle },
    });
    if (existingUser) {
      res.status(400).json({ message: "Handle already taken by a username" });
      return;
    }

    const app = await prisma.app.create({
      data: {
        name,
        handle,
        description,
        type: type || "HOSTED",
        status: "PUBLISHED",
        isPublic: true,
        userId,
      },
    });

    // Create a chat for the app (like Telegram Mini Apps)
    const chat = await prisma.chat.create({
      data: {
        name: app.name,
        isGroup: false,
        appId: app.id,
      },
    });

    // Add user as chat member
    await prisma.chatMember.create({
      data: {
        chatId: chat.id,
        userId: userId,
        role: "ADMIN",
      },
    });

    // Create initial deployment (waiting for ZIP upload) for HOSTED sites
    if (type === "HOSTED") {
      await prisma.deployment.create({
        data: {
          appId: app.id,
          version: 1,
          status: "PENDING",
          url: null,
        },
      });
    }

    // Auto-create API token for EXTERNAL apps
    if (type === "EXTERNAL") {
      const token = crypto.randomBytes(32).toString('hex');
      await prisma.apiToken.create({
        data: {
          token,
          name: `${name} Token`,
          appId: app.id,
          userId,
          scopes: ["read", "write"],
        },
      });
    }

    // Fetch app with tokens for response
    const appWithTokens = await prisma.app.findUnique({
      where: { id: app.id },
      include: {
        apiTokens: true,
        deployments: true,
      },
    });

    // Send notification about app creation
    try {
      await notifyAppCreated(userId, app.name, app.handle);
    } catch (notifError) {
      logger.warn({ error: notifError }, "Failed to send app creation notification");
    }

    res.status(201).json(appWithTokens);
  } catch (error) {
    logger.error({ error, body: req.body }, "Error creating app");
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
};

export const getApps = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const apps = await prisma.app.findMany({
      where: { userId },
      include: {
        deployments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        apiTokens: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json(apps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getApp = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const app = await prisma.app.findFirst({
      where: { id, userId },
      include: {
        deployments: {
          orderBy: { createdAt: "desc" },
        },
        apiTokens: true,
      },
    });

    if (!app) {
      res.status(404).json({ message: "App not found" });
      return;
    }

    res.json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateApp = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status, isPublic, type, userId: newUserId, url, webhookUrl } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Get current app to check type change and ownership
    const currentApp = await prisma.app.findFirst({
      where: { id },
    });

    if (!currentApp) {
      res.status(404).json({ message: "App not found" });
      return;
    }

    // Only the current owner or admin can change the user
    if (currentApp.userId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }
    }

    // If changing user, verify the new user exists and is a developer
    if (newUserId && newUserId !== currentApp.userId) {
      const newUser = await prisma.user.findUnique({ where: { id: newUserId } });
      if (!newUser) {
        res.status(400).json({ message: "New user not found" });
        return;
      }
      if (!newUser.isDeveloper) {
        res.status(400).json({ message: "New user must be a developer" });
        return;
      }
    }

    // If changing from HOSTED to EXTERNAL, create API token
    if (type === "EXTERNAL" && currentApp.type !== "EXTERNAL") {
      const token = crypto.randomBytes(32).toString('hex');
      await prisma.apiToken.create({
        data: {
          token,
          name: `${currentApp.name} Token`,
          appId: id,
          userId: newUserId || userId,
          scopes: ["read", "write"],
        },
      });
    }

    // If changing from EXTERNAL to HOSTED, remove API tokens
    if (type === "HOSTED" && currentApp.type === "EXTERNAL") {
      await prisma.apiToken.deleteMany({
        where: { appId: id },
      });
    }

    const updateData: any = { name, description, status, isPublic, type };
    if (newUserId) {
      updateData.userId = newUserId;
    }
    if (url !== undefined) {
      updateData.url = url;
    }
    if (webhookUrl !== undefined) {
      updateData.webhookUrl = webhookUrl;
    }

    const app = await prisma.app.update({
      where: { id },
      data: updateData,
    });

    const updatedApp = await prisma.app.findFirst({ 
      where: { id },
      include: {
        deployments: {
          orderBy: { createdAt: "desc" },
        },
        apiTokens: true,
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
    res.json(updatedApp);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteApp = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Check if app exists and belongs to user
    const app = await prisma.app.findFirst({
      where: { id, userId },
    });

    if (!app) {
      res.status(404).json({ message: "App not found" });
      return;
    }

    // Delete related data first (in correct order due to foreign keys)
    // 1. Delete messages in app chats
    const appChats = await prisma.chat.findMany({ where: { appId: id } });
    for (const chat of appChats) {
      await prisma.message.deleteMany({ where: { chatId: chat.id } });
      await prisma.chatMember.deleteMany({ where: { chatId: chat.id } });
    }

    // 2. Delete app chats
    await prisma.chat.deleteMany({ where: { appId: id } });

    // 3. Delete deployments and tokens
    await prisma.deployment.deleteMany({ where: { appId: id } });
    await prisma.apiToken.deleteMany({ where: { appId: id } });

    // 4. Finally delete the app
    await prisma.app.delete({ where: { id } });

    res.json({ message: "App deleted successfully" });
  } catch (error) {
    console.error("Error deleting app:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const searchApps = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      res.status(400).json({ message: "Search query is required" });
      return;
    }

    logger.info({ query }, "Searching apps");

    let apps;
    
    try {
      // Try case-insensitive search first
      apps = await prisma.app.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { handle: { contains: query, mode: "insensitive" } },
            { 
              AND: [
                { description: { not: null } },
                { description: { contains: query, mode: "insensitive" } }
              ]
            },
          ],
          status: "PUBLISHED",
          isPublic: true,
        },
        include: {
          user: {
            select: { username: true, avatar: true },
          },
        },
        take: 20,
      });
    } catch (dbError) {
      // Fallback to case-sensitive search if insensitive mode fails
      logger.warn({ error: dbError, query }, "Case-insensitive search failed, using case-sensitive fallback");
      apps = await prisma.app.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { handle: { contains: query } },
            { 
              AND: [
                { description: { not: null } },
                { description: { contains: query } }
              ]
            },
          ],
          status: "PUBLISHED",
          isPublic: true,
        },
        include: {
          user: {
            select: { username: true, avatar: true },
          },
        },
        take: 20,
      });
    }

    logger.info({ count: apps.length, query }, "Apps found");
    res.json(apps);
  } catch (error) {
    logger.error({ error, query: req.query.query }, "Error in searchApps");
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
};

export const checkHandleAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { handle } = req.query;

    if (!handle || typeof handle !== "string") {
      res.status(400).json({ message: "Handle is required" });
      return;
    }

    // Validate handle: only English letters, numbers, and hyphens
    const handleRegex = /^[a-zA-Z0-9-]+$/;
    if (!handleRegex.test(handle)) {
      res.json({ 
        available: false,
        reason: "Handle can only contain English letters, numbers, and hyphens"
      });
      return;
    }

    // Handle must be between 3 and 30 characters
    if (handle.length < 3 || handle.length > 30) {
      res.json({ 
        available: false,
        reason: "Handle must be between 3 and 30 characters"
      });
      return;
    }

    // Handle cannot start or end with hyphen
    if (handle.startsWith('-') || handle.endsWith('-')) {
      res.json({ 
        available: false,
        reason: "Handle cannot start or end with a hyphen"
      });
      return;
    }

    // Check if handle is used by an app
    const existingApp = await prisma.app.findUnique({
      where: { handle },
    });

    // Check if handle is used by a username
    const existingUser = await prisma.user.findUnique({
      where: { username: handle },
    });

    const isAvailable = !existingApp && !existingUser;
    
    res.json({ 
      available: isAvailable,
      reason: !isAvailable ? (existingApp ? "Handle already used by an app" : "Handle already used by a username") : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const joinAppChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Find app
    const app = await prisma.app.findUnique({
      where: { id },
      include: {
        user: {
          select: { username: true, avatar: true },
        },
      },
    });

    if (!app) {
      res.status(404).json({ message: "App not found" });
      return;
    }

    // Find app chat
    const chat = await prisma.chat.findFirst({
      where: { appId: id },
    });

    if (!chat) {
      res.status(404).json({ message: "App chat not found" });
      return;
    }

    // Check if user is already a member
    const existingMember = await prisma.chatMember.findFirst({
      where: {
        chatId: chat.id,
        userId,
      },
    });

    if (!existingMember) {
      // Add user to chat
      await prisma.chatMember.create({
        data: {
          chatId: chat.id,
          userId,
          role: "MEMBER",
        },
      });
    }

    // Return chat with full details
    const fullChat = await prisma.chat.findUnique({
      where: { id: chat.id },
      include: {
        chatMembers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        app: {
          select: {
            id: true,
            name: true,
            handle: true,
            description: true,
            icon: true,
            type: true,
            status: true,
            user: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    res.json(fullChat);
  } catch (error) {
    console.error("Error joining app chat:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAppByHandle = async (req: any, res: any) => {
  try {
    const { handle } = req.params;

    const app = await prisma.app.findUnique({
      where: { handle },
      include: {
        user: {
          select: { username: true, avatar: true },
        },
        deployments: {
          where: { status: "DEPLOYED" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!app) {
      res.status(404).json({ message: "App not found" });
      return;
    }

    // Increment view count
    await prisma.app.update({
      where: { id: app.id },
      data: { views: { increment: 1 } },
    });

    res.json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
