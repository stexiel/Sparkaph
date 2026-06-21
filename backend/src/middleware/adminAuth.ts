import { NextFunction } from "express";
import prisma from "../utils/prisma";
import { AuthRequest, Response } from "./authMiddleware";

export const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isAdmin) {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
