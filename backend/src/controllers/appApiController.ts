import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

// Get current user from token
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        bio: true,
        isOnline: true,
        isDeveloper: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
};

// Get user by ID
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        bio: true,
        isOnline: true,
        isDeveloper: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
};

// Send message to user
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, text } = req.body;
    const appId = req.appId;

    if (!appId) {
      res.status(400).json({ message: 'Token not associated with an app' });
      return;
    }

    // Find or create chat between app and user
    let chat = await prisma.chat.findFirst({
      where: {
        appId,
        chatMembers: {
          some: { userId },
        },
      },
    });

    if (!chat) {
      // Create new chat
      chat = await prisma.chat.create({
        data: {
          appId,
          isGroup: false,
          chatMembers: {
            create: [{ userId }],
          },
        },
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: text,
        type: 'TEXT',
        senderId: 'system', // Messages from app are system messages
        chatId: chat.id,
      },
      include: {
        sender: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Save app data (key-value storage)
export const saveAppData = async (req: AuthRequest, res: Response) => {
  try {
    const { key, value } = req.body;
    const appId = req.appId;
    const userId = req.user?.userId;

    if (!appId) {
      res.status(400).json({ message: 'Token not associated with an app' });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Upsert app data
    const data = await prisma.appData.upsert({
      where: {
        appId_userId_key: {
          appId,
          userId,
          key,
        },
      },
      update: {
        value: JSON.stringify(value),
      },
      create: {
        appId,
        userId,
        key,
        value: JSON.stringify(value),
      },
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Save app data error:', error);
    res.status(500).json({ message: 'Failed to save data' });
  }
};

// Get app data
export const getAppData = async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    const appId = req.appId;
    const userId = req.user?.userId;

    if (!appId) {
      res.status(400).json({ message: 'Token not associated with an app' });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const data = await prisma.appData.findUnique({
      where: {
        appId_userId_key: {
          appId,
          userId,
          key,
        },
      },
    });

    if (!data) {
      res.status(404).json({ message: 'Data not found' });
      return;
    }

    res.json({ key: data.key, value: JSON.parse(data.value) });
  } catch (error) {
    console.error('Get app data error:', error);
    res.status(500).json({ message: 'Failed to get data' });
  }
};

// Delete app data
export const deleteAppData = async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    const appId = req.appId;
    const userId = req.user?.userId;

    if (!appId) {
      res.status(400).json({ message: 'Token not associated with an app' });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    await prisma.appData.delete({
      where: {
        appId_userId_key: {
          appId,
          userId,
          key,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete app data error:', error);
    res.status(500).json({ message: 'Failed to delete data' });
  }
};
