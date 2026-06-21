import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/authMiddleware";
import crypto from "crypto";

export const createToken = async (req: AuthRequest, res: Response) => {
  try {
    const { name, appId, scopes } = req.body;
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

    // Verify app ownership if appId is provided
    if (appId) {
      const app = await prisma.app.findFirst({
        where: { id: appId, userId },
      });
      if (!app) {
        res.status(404).json({ message: "App not found" });
        return;
      }
    }

    // Generate secure token
    const token = `sparkaph_${crypto.randomBytes(32).toString("hex")}`;

    const apiToken = await prisma.apiToken.create({
      data: {
        name,
        token,
        appId,
        userId,
        scopes: scopes || ["read", "write"],
      },
    });

    res.status(201).json(apiToken);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTokens = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const tokens = await prisma.apiToken.findMany({
      where: { userId },
      include: {
        app: {
          select: { name: true, handle: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(tokens);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteToken = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const token = await prisma.apiToken.deleteMany({
      where: { id, userId },
    });

    if (token.count === 0) {
      res.status(404).json({ message: "Token not found" });
      return;
    }

    res.json({ message: "Token deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyToken = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.replace("Bearer ", "");
    const apiToken = await prisma.apiToken.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, username: true },
        },
        app: true,
      },
    });

    if (!apiToken) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    // Check if token is expired
    if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
      res.status(401).json({ message: "Token expired" });
      return;
    }

    // Update last used
    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsed: new Date() },
    });

    req.apiToken = apiToken;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
