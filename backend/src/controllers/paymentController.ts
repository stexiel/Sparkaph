import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

const PLATFORM_FEE_PERCENT = 0.15; // 15%

// Create payment (from SDK)
export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, description, metadata } = req.body;
    const userId = req.user?.userId;
    const appId = req.appId;

    if (!appId) {
      res.status(400).json({ message: 'Token not associated with an app' });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Calculate fees
    const platformFee = amount * PLATFORM_FEE_PERCENT;
    const developerAmount = amount - platformFee;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        appId,
        amount,
        platformFee,
        developerAmount,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        status: 'PENDING',
      },
    });

    // Generate Boosty payment URL
    const boostyUrl = generateBoostyUrl(payment.id, amount, description);

    res.json({
      paymentId: payment.id,
      amount,
      platformFee,
      developerAmount,
      paymentUrl: boostyUrl,
      status: 'PENDING',
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Failed to create payment' });
  }
};

// Generate Boosty payment URL
function generateBoostyUrl(paymentId: string, amount: number, description?: string): string {
  const boostyUsername = 'sparkaph'; // Ваш Boosty username
  const baseUrl = `https://boosty.to/${boostyUsername}/donate`;
  
  // Encode payment data in URL
  const params = new URLSearchParams({
    amount: amount.toString(),
    message: description || 'Sparkaph Payment',
    custom_data: paymentId, // Для идентификации платежа
  });

  return `${baseUrl}?${params.toString()}`;
}

// Boosty webhook handler
export const boostyWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { payment_id, amount, status, custom_data } = req.body;

    // custom_data содержит наш paymentId
    const paymentId = custom_data;

    if (!paymentId) {
      res.status(400).json({ message: 'Invalid webhook data' });
      return;
    }

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { app: { include: { user: true } } },
    });

    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: status === 'success' ? 'COMPLETED' : 'FAILED',
        externalId: payment_id,
      },
    });

    if (status === 'success') {
      // Update developer balance
      const developerId = payment.app.userId;
      
      await prisma.developerBalance.upsert({
        where: { userId: developerId },
        update: {
          pendingAmount: { increment: payment.developerAmount },
          totalEarned: { increment: payment.developerAmount },
        },
        create: {
          userId: developerId,
          pendingAmount: payment.developerAmount,
          totalEarned: payment.developerAmount,
          availableAmount: 0,
        },
      });

      console.log(`✅ Payment ${paymentId} completed. Developer ${developerId} earned ${payment.developerAmount}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Boosty webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

// Get payment status
export const getPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user?.userId;

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        description: true,
        createdAt: true,
      },
    });

    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ message: 'Failed to get payment status' });
  }
};

// Get developer balance
export const getDeveloperBalance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    let balance = await prisma.developerBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      // Create balance if doesn't exist
      balance = await prisma.developerBalance.create({
        data: { userId },
      });
    }

    res.json(balance);
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ message: 'Failed to get balance' });
  }
};

// Request withdrawal
export const requestWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, method, details } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Check balance
    const balance = await prisma.developerBalance.findUnique({
      where: { userId },
    });

    if (!balance || balance.availableAmount < amount) {
      res.status(400).json({ message: 'Insufficient balance' });
      return;
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amount,
        method,
        details: JSON.stringify(details),
        status: 'PENDING',
      },
    });

    // Deduct from available balance
    await prisma.developerBalance.update({
      where: { userId },
      data: {
        availableAmount: { decrement: amount },
      },
    });

    res.json({
      withdrawalId: withdrawal.id,
      amount,
      status: 'PENDING',
      message: 'Withdrawal request created. We will process it within 1-3 business days.',
    });
  } catch (error) {
    console.error('Request withdrawal error:', error);
    res.status(500).json({ message: 'Failed to request withdrawal' });
  }
};

// Confirm payment (manual - for testing without Boosty)
export const confirmPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { app: { include: { user: true } } },
    });

    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    // Update payment
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'COMPLETED' },
    });

    // Update developer balance
    const developerId = payment.app.userId;
    
    await prisma.developerBalance.upsert({
      where: { userId: developerId },
      update: {
        availableAmount: { increment: payment.developerAmount },
        totalEarned: { increment: payment.developerAmount },
      },
      create: {
        userId: developerId,
        availableAmount: payment.developerAmount,
        totalEarned: payment.developerAmount,
      },
    });

    res.json({ success: true, message: 'Payment confirmed' });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
};
