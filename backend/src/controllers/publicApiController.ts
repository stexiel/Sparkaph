import { Response } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { ApiTokenRequest } from "../middleware/apiTokenMiddleware";

const prisma = new PrismaClient();

// Generate temporary user token
export const generateUserToken = async (req: ApiTokenRequest, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ message: "userId is required" });
      return;
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Generate temporary JWT token (expires in 1 hour)
    const userToken = jwt.sign(
      {
        userId: user.id,
        appId: req.appId,
        type: "user_token",
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.json({
      userToken,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Generate user token error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify user token
export const verifyUserToken = async (req: ApiTokenRequest, res: Response) => {
  try {
    const { userToken } = req.body;

    if (!userToken) {
      res.status(400).json({ message: "userToken is required" });
      return;
    }

    const decoded = jwt.verify(
      userToken,
      process.env.JWT_SECRET as string
    ) as any;

    if (decoded.type !== "user_token") {
      res.status(403).json({ message: "Invalid token type" });
      return;
    }

    res.json({
      valid: true,
      userId: decoded.userId,
      appId: decoded.appId,
    });
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Get user info
export const getUser = async (req: ApiTokenRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { userToken } = req.body;

    // Verify user token if provided
    if (userToken) {
      try {
        const decoded = jwt.verify(
          userToken,
          process.env.JWT_SECRET as string
        ) as any;

        if (decoded.type !== "user_token") {
          res.status(403).json({ message: "Invalid token type" });
          return;
        }
      } catch (error) {
        res.status(403).json({ message: "Invalid user token" });
        return;
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Send message
export const sendMessage = async (req: ApiTokenRequest, res: Response) => {
  try {
    const { userToken, recipientId, content } = req.body;

    if (!userToken || !recipientId || !content) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Verify user token
    const decoded = jwt.verify(
      userToken,
      process.env.JWT_SECRET as string
    ) as any;

    if (decoded.type !== "user_token") {
      res.status(403).json({ message: "Invalid token type" });
      return;
    }

    const senderId = decoded.userId;

    // Find or create chat
    let chat = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        chatMembers: {
          every: {
            userId: {
              in: [senderId, recipientId],
            },
          },
        },
      },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          isGroup: false,
          chatMembers: {
            create: [
              { userId: senderId },
              { userId: recipientId },
            ],
          },
        },
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        chatId: chat.id,
        senderId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Save data to storage
export const saveData = async (req: ApiTokenRequest, res: Response) => {
  try {
    const { userToken, key, value } = req.body;

    if (!userToken || !key || value === undefined) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Verify user token
    const decoded = jwt.verify(
      userToken,
      process.env.JWT_SECRET as string
    ) as any;

    if (decoded.type !== "user_token") {
      res.status(403).json({ message: "Invalid token type" });
      return;
    }

    const userId = decoded.userId;
    const appId = req.appId;

    // Save or update data
    const data = await prisma.appData.upsert({
      where: {
        appId_userId_key: {
          appId: appId!,
          userId,
          key,
        },
      },
      update: {
        value: JSON.stringify(value),
      },
      create: {
        appId: appId!,
        userId,
        key,
        value: JSON.stringify(value),
      },
    });

    res.json({
      success: true,
      key: data.key,
      value: JSON.parse(data.value),
    });
  } catch (error) {
    console.error("Save data error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get data from storage
export const getData = async (req: ApiTokenRequest, res: Response) => {
  try {
    const { userToken, key } = req.body;

    if (!userToken || !key) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Verify user token
    const decoded = jwt.verify(
      userToken,
      process.env.JWT_SECRET as string
    ) as any;

    if (decoded.type !== "user_token") {
      res.status(403).json({ message: "Invalid token type" });
      return;
    }

    const userId = decoded.userId;
    const appId = req.appId;

    const data = await prisma.appData.findUnique({
      where: {
        appId_userId_key: {
          appId: appId!,
          userId,
          key,
        },
      },
    });

    if (!data) {
      res.status(404).json({ message: "Data not found" });
      return;
    }

    res.json({
      key: data.key,
      value: JSON.parse(data.value),
    });
  } catch (error) {
    console.error("Get data error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete data from storage
export const deleteData = async (req: ApiTokenRequest, res: Response) => {
  try {
    const { userToken, key } = req.body;

    if (!userToken || !key) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Verify user token
    const decoded = jwt.verify(
      userToken,
      process.env.JWT_SECRET as string
    ) as any;

    if (decoded.type !== "user_token") {
      res.status(403).json({ message: "Invalid token type" });
      return;
    }

    const userId = decoded.userId;
    const appId = req.appId;

    await prisma.appData.delete({
      where: {
        appId_userId_key: {
          appId: appId!,
          userId,
          key,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete data error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create payment
export const createPayment = async (req: ApiTokenRequest, res: Response) => {
  try {
    const { userToken, amount, description } = req.body;

    if (!userToken || !amount) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Verify user token
    const decoded = jwt.verify(
      userToken,
      process.env.JWT_SECRET as string
    ) as any;

    if (decoded.type !== "user_token") {
      res.status(403).json({ message: "Invalid token type" });
      return;
    }

    const userId = decoded.userId;
    const appId = req.appId;

    // Calculate fees
    const PLATFORM_FEE_PERCENT = 0.15; // 15%
    const platformFee = parseFloat(amount) * PLATFORM_FEE_PERCENT;
    const developerAmount = parseFloat(amount) - platformFee;

    const payment = await prisma.payment.create({
      data: {
        userId,
        appId: appId!,
        amount: parseFloat(amount),
        platformFee,
        developerAmount,
        description: description || "Payment",
        status: "PENDING",
      },
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get payment status
export const getPaymentStatus = async (req: ApiTokenRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { userToken } = req.body;

    if (!userToken) {
      res.status(400).json({ message: "userToken is required" });
      return;
    }

    // Verify user token
    const decoded = jwt.verify(
      userToken,
      process.env.JWT_SECRET as string
    ) as any;

    if (decoded.type !== "user_token") {
      res.status(403).json({ message: "Invalid token type" });
      return;
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    // Verify payment belongs to user
    if (payment.userId !== decoded.userId) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    res.json(payment);
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
