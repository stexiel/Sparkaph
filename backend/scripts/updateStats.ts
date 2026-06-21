import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateDailyStats() {
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

    console.log('✅ Daily stats updated successfully!');
    console.log('Date:', today.toDateString());
    console.log('DAU:', dau);
    console.log('New Users:', newUsers);
    console.log('Messages:', messages);
    console.log('Apps:', apps);
    console.log('Payments:', payments);
    console.log('Revenue:', revenueResult._sum.amount || 0);
  } catch (error) {
    console.error('Error updating daily stats:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDailyStats();
