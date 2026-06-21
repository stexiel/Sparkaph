import prisma from "../utils/prisma";
import { AuthRequest, Response } from "../middleware/authMiddleware";

// Get user wallet
export const getWallet = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    // Create wallet if doesn't exist
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId },
      });
    }

    res.json(wallet);
  } catch (error) {
    console.error("Error getting wallet:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get transaction history
export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { limit = 50, offset = 0 } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.transaction.count({
      where: { userId },
    });

    res.json({
      transactions,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error("Error getting transactions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Purchase Sparks (simulated payment)
export const purchaseSparks = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { sparksAmount, realAmount, currency, paymentMethod } = req.body;

    if (!sparksAmount || !realAmount || !currency || !paymentMethod) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Create purchase record
    const purchase = await prisma.sparksPurchase.create({
      data: {
        userId,
        sparksAmount: Number(sparksAmount),
        realAmount: Number(realAmount),
        currency,
        paymentMethod,
        status: "PENDING",
        paymentProvider: "SIMULATED",
      },
    });

    // Simulate payment processing (in real app, this would be async webhook)
    // For now, we'll immediately complete the payment
    setTimeout(async () => {
      try {
        // Update purchase status
        await prisma.sparksPurchase.update({
          where: { id: purchase.id },
          data: { status: "COMPLETED" },
        });

        // Update wallet
        await prisma.wallet.upsert({
          where: { userId },
          create: {
            userId,
            balance: Number(sparksAmount),
            totalEarned: Number(sparksAmount),
          },
          update: {
            balance: { increment: Number(sparksAmount) },
            totalEarned: { increment: Number(sparksAmount) },
          },
        });

        // Create transaction record
        await prisma.transaction.create({
          data: {
            userId,
            type: "PURCHASE",
            amount: Number(sparksAmount),
            description: `Purchased ${sparksAmount} Sparks for ${realAmount} ${currency}`,
            metadata: JSON.stringify({ purchaseId: purchase.id }),
            status: "COMPLETED",
          },
        });
      } catch (error) {
        console.error("Error completing purchase:", error);
      }
    }, 2000); // Simulate 2 second processing time

    res.json({
      message: "Purchase initiated",
      purchase: {
        id: purchase.id,
        sparksAmount,
        realAmount,
        currency,
        status: "PENDING",
      },
    });
  } catch (error) {
    console.error("Error purchasing Sparks:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Check purchase status
export const checkPurchaseStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { purchaseId } = req.params;

    const purchase = await prisma.sparksPurchase.findFirst({
      where: {
        id: purchaseId,
        userId,
      },
    });

    if (!purchase) {
      res.status(404).json({ message: "Purchase not found" });
      return;
    }

    res.json(purchase);
  } catch (error) {
    console.error("Error checking purchase status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Pay for app with Sparks
export const payForApp = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { appId } = req.body;

    if (!appId) {
      res.status(400).json({ message: "App ID is required" });
      return;
    }

    // Get app details
    const app = await prisma.app.findUnique({
      where: { id: appId },
      include: { user: true },
    });

    if (!app) {
      res.status(404).json({ message: "App not found" });
      return;
    }

    if (!app.isPaid) {
      res.status(400).json({ message: "This app is free" });
      return;
    }

    // Check if user already paid for this app
    const existingPayment = await prisma.transaction.findFirst({
      where: {
        userId,
        type: "PAYMENT",
        metadata: {
          contains: appId,
        },
        status: "COMPLETED",
      },
    });

    if (existingPayment) {
      res.status(400).json({ message: "You already own this app" });
      return;
    }

    // Get user wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.balance < app.price) {
      res.status(400).json({
        message: "Insufficient Sparks balance",
        required: app.price,
        current: wallet?.balance || 0,
      });
      return;
    }

    // Process payment
    await prisma.$transaction(async (tx) => {
      // Deduct from buyer's wallet
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: app.price },
          totalSpent: { increment: app.price },
        },
      });

      // Add to developer's wallet (85% after 15% platform fee)
      const developerAmount = app.price * 0.85;
      const platformFee = app.price * 0.15;

      await tx.wallet.upsert({
        where: { userId: app.userId },
        create: {
          userId: app.userId,
          balance: developerAmount,
          totalEarned: developerAmount,
        },
        update: {
          balance: { increment: developerAmount },
          totalEarned: { increment: developerAmount },
        },
      });

      // Create transaction for buyer
      await tx.transaction.create({
        data: {
          userId,
          type: "PAYMENT",
          amount: -app.price,
          description: `Purchased app: ${app.name}`,
          metadata: JSON.stringify({
            appId: app.id,
            appName: app.name,
            developerId: app.userId,
          }),
          status: "COMPLETED",
        },
      });

      // Create transaction for developer
      await tx.transaction.create({
        data: {
          userId: app.userId,
          type: "REWARD",
          amount: developerAmount,
          description: `Earned from app sale: ${app.name}`,
          metadata: JSON.stringify({
            appId: app.id,
            buyerId: userId,
            platformFee,
          }),
          status: "COMPLETED",
        },
      });
    });

    res.json({
      message: "Payment successful",
      app: {
        id: app.id,
        name: app.name,
        price: app.price,
      },
    });
  } catch (error) {
    console.error("Error paying for app:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Check if user owns app
export const checkAppOwnership = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { appId } = req.params;

    const app = await prisma.app.findUnique({
      where: { id: appId },
    });

    if (!app) {
      res.status(404).json({ message: "App not found" });
      return;
    }

    // Free apps are owned by everyone
    if (!app.isPaid) {
      res.json({ owns: true, reason: "FREE_APP" });
      return;
    }

    // Check if user is the developer
    if (app.userId === userId) {
      res.json({ owns: true, reason: "DEVELOPER" });
      return;
    }

    // Check if user paid for the app
    const payment = await prisma.transaction.findFirst({
      where: {
        userId,
        type: "PAYMENT",
        metadata: {
          contains: appId,
        },
        status: "COMPLETED",
      },
    });

    res.json({
      owns: !!payment,
      reason: payment ? "PURCHASED" : "NOT_PURCHASED",
    });
  } catch (error) {
    console.error("Error checking app ownership:", error);
    res.status(500).json({ message: "Server error" });
  }
};
