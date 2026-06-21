import { Response } from "../middleware/authMiddleware";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/authMiddleware";
import { createChatSchema } from "../utils/validation";
import { getCache, setCache, deleteCache } from "../utils/redis";

export const createChat = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createChatSchema.parse(req.body);
    const { partnerId, isGroup, name } = validatedData;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (isGroup) {
      // Create group chat
      const memberIds = validatedData.memberIds || [];
      
      const chat = await prisma.chat.create({
        data: {
          isGroup: true,
          name: name || "New Group",
          chatMembers: {
            create: [
              { userId: userId, role: "ADMIN" },
              ...memberIds.map((id: string) => ({ userId: id, role: "MEMBER" })),
            ],
          },
        },
        include: {
          chatMembers: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                  isOnline: true,
                  lastSeen: true,
                },
              },
            },
          },
        },
      });
      res.status(201).json(chat);
    } else {
      // Private chat
      if (!partnerId) {
        res
          .status(400)
          .json({ message: "partnerId is required for private chats" });
        return;
      }

      // Check if chat already exists
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          AND: [
            { chatMembers: { some: { userId: userId } } },
            { chatMembers: { some: { userId: partnerId } } },
          ],
        },
        include: {
          chatMembers: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                  isOnline: true,
                  lastSeen: true,
                },
              },
            },
          },
        },
      });

      if (existingChat) {
        res.json(existingChat);
        return;
      }

      const chat = await prisma.chat.create({
        data: {
          isGroup: false,
          chatMembers: {
            create: [{ userId: userId }, { userId: partnerId }],
          },
        },
        include: {
          chatMembers: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                  isOnline: true,
                  lastSeen: true,
                },
              },
            },
          },
        },
      });
      res.status(201).json(chat);
    }
  } catch (error: any) {
    if (error.name === "ZodError") {
      res
        .status(400)
        .json({ message: "Invalid input data", errors: error.errors });
      return;
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Check cache first
    const cacheKey = `chats:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const chats = await prisma.chat.findMany({
      where: {
        chatMembers: {
          some: { userId },
        },
      },
      include: {
        chatMembers: {
          include: {
            user: {
              select: { id: true, username: true, avatar: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            statuses: true,
          },
        },
        app: {
          select: {
            id: true,
            name: true,
            handle: true,
            description: true,
            icon: true,
            type: true,
            status: true,
            user: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const chatsWithUnread = chats.map((chat) => {
      const unreadCount = chat.messages.reduce((acc, message) => {
        // Count only messages not sent by current user
        if (message.senderId !== userId) {
          // Check if current user has READ status for this message
          const hasReadStatus = message.statuses?.some(
            (status) => status.userId === userId && status.status === "READ"
          );
          // If no READ status, it's unread
          if (!hasReadStatus) {
            acc++;
          }
        }
        return acc;
      }, 0);
      return { ...chat, unreadCount };
    });

    // Cache for 2 minutes
    await setCache(cacheKey, chatsWithUnread, 120);
    res.json(chatsWithUnread);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Check if user is a member of the chat
    const chat = await prisma.chat.findFirst({
      where: {
        id,
        chatMembers: {
          some: { userId },
        },
      },
    });

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    // Delete messages first
    await prisma.message.deleteMany({ where: { chatId: id } });

    // Delete chat members
    await prisma.chatMember.deleteMany({ where: { chatId: id } });

    // Delete the chat
    await prisma.chat.delete({ where: { id } });

    // Clear cache
    await deleteCache(`chats:${userId}`);

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ message: "Server error" });
  }
};
