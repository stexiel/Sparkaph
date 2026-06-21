import { NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest, Response } from './authMiddleware';

export const authenticateAppToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);

    // Find API token in database
    const apiToken = await (prisma as any).apiToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            isDeveloper: true,
          },
        },
        app: {
          select: {
            id: true,
            name: true,
            handle: true,
          },
        },
      },
    });

    if (!apiToken) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    // Update last used timestamp
    await (prisma as any).apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsed: new Date() },
    });

    // Attach user and app info to request
    req.user = {
      userId: apiToken.user.id,
      username: apiToken.user.username,
    };
    req.appId = apiToken.app?.id;
    req.apiToken = apiToken;

    next();
  } catch (error) {
    console.error('App auth error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};
