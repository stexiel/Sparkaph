import { Request, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { Response } from "./authMiddleware";

const prisma = new PrismaClient();

export interface ApiTokenRequest extends Request {
  apiToken?: any;
  appId?: string;
  body: any;
  params: any;
  query: any;
}

export const authenticateApiToken = async (
  req: ApiTokenRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "API token required" });
      return;
    }

    // Find API token in database
    const apiToken = await (prisma as any).apiToken.findUnique({
      where: { token },
      include: {
        app: true,
      },
    });

    if (!apiToken) {
      res.status(403).json({ message: "Invalid API token" });
      return;
    }

    // Update last used timestamp
    await (prisma as any).apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsed: new Date() },
    });

    req.apiToken = apiToken;
    req.appId = apiToken.appId;
    next();
  } catch (error) {
    console.error("API token authentication error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
