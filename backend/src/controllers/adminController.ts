import { AuthRequest, Response } from "../middleware/authMiddleware";
import prisma from "../utils/prisma";

// Get statistics for admin dashboard
export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'daily' } = req.query; // daily, weekly, monthly

    let stats;
    const now = new Date();

    if (period === 'daily') {
      stats = await prisma.dailyStats.findMany({
        orderBy: { date: 'desc' },
        take: 30, // Last 30 days
      });
    } else if (period === 'weekly') {
      stats = await prisma.weeklyStats.findMany({
        orderBy: [{ year: 'desc' }, { week: 'desc' }],
        take: 12, // Last 12 weeks
      });
    } else {
      stats = await prisma.monthlyStats.findMany({
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 12, // Last 12 months
      });
    }

    // Get current totals
    const totalUsers = await prisma.user.count();
    const totalApps = await prisma.app.count();
    const totalMessages = await prisma.message.count();
    const totalRevenue = await prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    });

    // Get online users count
    const onlineUsers = await prisma.user.count({
      where: { isOnline: true },
    });

    res.json({
      stats,
      totals: {
        users: totalUsers,
        apps: totalApps,
        messages: totalMessages,
        revenue: totalRevenue._sum.amount || 0,
        onlineUsers,
      },
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create admin account (only for admins)
export const createAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, nickname } = req.body;
    const creatorId = (req as any).userId;

    // Check if creator is admin
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
    });

    if (!creator || !creator.isAdmin) {
      res.status(403).json({ message: "Only admins can create admin accounts" });
      return;
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      res.status(400).json({ message: "Username already exists" });
      return;
    }

    // Create admin account
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        nickname: nickname || username,
        isAdmin: true,
        createdByAdminId: creatorId,
      },
    });

    res.json({
      message: "Admin account created successfully",
      admin: {
        id: newAdmin.id,
        username: newAdmin.username,
        nickname: newAdmin.nickname,
        isAdmin: newAdmin.isAdmin,
      },
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all admin accounts (only for admins)
export const getAdmins = async (req: AuthRequest, res: Response) => {
  try {
    const creatorId = (req as any).userId;

    // Check if requester is admin
    const requester = await prisma.user.findUnique({
      where: { id: creatorId },
    });

    if (!requester || !requester.isAdmin) {
      res.status(403).json({ message: "Only admins can view admin accounts" });
      return;
    }

    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        username: true,
        nickname: true,
        isAdmin: true,
        createdAt: true,
        createdBy: {
          select: {
            username: true,
            nickname: true,
          },
        },
      },
    });

    res.json({ admins });
  } catch (error) {
    console.error("Error getting admins:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update daily stats (called by cron job)
export const updateDailyStats = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate DAU (users active in last 24 hours)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dau = await prisma.user.count({
      where: {
        lastSeen: {
          gte: yesterday,
        },
      },
    });

    // Calculate new users (registered today)
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // Calculate messages sent today
    const messages = await prisma.message.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // Calculate apps created today
    const apps = await prisma.app.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // Calculate payments today
    const payments = await prisma.payment.count({
      where: {
        createdAt: {
          gte: today,
        },
        status: 'COMPLETED',
      },
    });

    // Calculate revenue today
    const revenueResult = await prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: today,
        },
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    // Upsert daily stats
    const stats = await prisma.dailyStats.upsert({
      where: { date: today },
      update: {
        dau,
        newUsers,
        messages,
        apps,
        payments,
        revenue: revenueResult._sum.amount || 0,
      },
      create: {
        date: today,
        dau,
        newUsers,
        messages,
        apps,
        payments,
        revenue: revenueResult._sum.amount || 0,
      },
    });

    res.json({ message: "Daily stats updated", stats });
  } catch (error) {
    console.error("Error updating daily stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};
