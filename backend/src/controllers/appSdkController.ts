import { Response } from "../middleware/authMiddleware";
import { AuthRequest } from "../middleware/authMiddleware";
import prisma from "../utils/prisma";

// Get user-specific data for app
export const getUserData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { key } = req.query;
    const appId = req.apiToken?.appId;

    if (!userId || !appId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!key || typeof key !== "string") {
      res.status(400).json({ message: "Key is required" });
      return;
    }

    const data = await prisma.appData.findFirst({
      where: {
        appId,
        userId,
        key,
      },
    });

    res.json({
      key,
      value: data?.value || null,
    });
  } catch (error) {
    console.error("Error getting user data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Set user-specific data for app
export const setUserData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { key, value } = req.body;
    const appId = req.apiToken?.appId;

    if (!userId || !appId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!key || typeof key !== "string") {
      res.status(400).json({ message: "Key is required" });
      return;
    }

    // Check if data exists
    const existingData = await prisma.appData.findFirst({
      where: {
        appId,
        userId,
        key,
      },
    });

    if (existingData) {
      // Update existing
      await prisma.appData.update({
        where: { id: existingData.id },
        data: { value },
      });
    } else {
      // Create new
      await prisma.appData.create({
        data: {
          appId,
          userId,
          key,
          value,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error setting user data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all keys for user
export const getUserDataKeys = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const appId = req.apiToken?.appId;

    if (!userId || !appId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const data = await prisma.appData.findMany({
      where: {
        appId,
        userId,
      },
      select: {
        key: true,
      },
    });

    res.json(data.map((d: any) => d.key));
  } catch (error) {
    console.error("Error getting user data keys:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user data
export const deleteUserData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { key } = req.query;
    const appId = req.apiToken?.appId;

    if (!userId || !appId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!key || typeof key !== "string") {
      res.status(400).json({ message: "Key is required" });
      return;
    }

    await prisma.appData.deleteMany({
      where: {
        appId,
        userId,
        key,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting user data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get current user info (for SDK)
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({ message: "Server error" });
  }
};
