import { AuthRequest, Response } from "../middleware/authMiddleware";
import prisma from "../utils/prisma";
import logger from "../utils/logger";

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { name, memberIds, handle, isPublic } = req.body;
    const userId = req.user?.userId;

    if (!name || !memberIds || memberIds.length === 0) {
      return res.status(400).json({ message: "Group name and members are required" });
    }

    // If handle is provided, check if it's available
    if (handle) {
      const existingGroup = await prisma.chat.findUnique({
        where: { handle },
      });

      if (existingGroup) {
        return res.status(400).json({ message: "Handle already taken" });
      }

      // Validate handle format (@username)
      if (!handle.startsWith('@') || handle.length < 4) {
        return res.status(400).json({ message: "Handle must start with @ and be at least 4 characters" });
      }
    }

    // Create group chat
    const group = await prisma.chat.create({
      data: {
        name,
        handle,
        isGroup: true,
        isPublic: isPublic || false,
        chatMembers: {
          create: [
            { userId, role: "ADMIN" }, // Creator is admin
            ...memberIds.map((id: string) => ({ userId: id, role: "MEMBER" }))
          ]
        }
      },
      include: {
        chatMembers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isOnline: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(group);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Failed to create group" });
  }
};

export const getGroups = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const groups = await prisma.chat.findMany({
      where: {
        isGroup: true,
        chatMembers: {
          some: {
            userId
          }
        }
      },
      include: {
        chatMembers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isOnline: true
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    res.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Failed to fetch groups" });
  }
};

export const addGroupMember = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, userId } = req.body;
    const currentUserId = req.user?.userId;

    // Check if current user is admin
    const membership = await prisma.chatMember.findFirst({
      where: {
        chatId,
        userId: currentUserId,
        role: "ADMIN"
      }
    });

    if (!membership) {
      return res.status(403).json({ message: "Only admins can add members" });
    }

    // Add member
    await prisma.chatMember.create({
      data: {
        chatId,
        userId,
        role: "MEMBER"
      }
    });

    res.json({ message: "Member added successfully" });
  } catch (error) {
    console.error("Error adding group member:", error);
    res.status(500).json({ message: "Failed to add member" });
  }
};

export const removeGroupMember = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, userId } = req.body;
    const currentUserId = req.user?.userId;

    // Check if current user is admin
    const membership = await prisma.chatMember.findFirst({
      where: {
        chatId,
        userId: currentUserId,
        role: "ADMIN"
      }
    });

    if (!membership) {
      return res.status(403).json({ message: "Only admins can remove members" });
    }

    // Remove member
    await prisma.chatMember.deleteMany({
      where: {
        chatId,
        userId
      }
    });

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing group member:", error);
    res.status(500).json({ message: "Failed to remove member" });
  }
};

export const updateGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, name } = req.body;
    const userId = req.user?.userId;

    // Check if user is admin
    const membership = await prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        role: "ADMIN"
      }
    });

    if (!membership) {
      return res.status(403).json({ message: "Only admins can update group" });
    }

    // Update group
    const group = await prisma.chat.update({
      where: { id: chatId },
      data: { name }
    });

    res.json(group);
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ message: "Failed to update group" });
  }
};

// Search public groups by handle or name
export const searchPublicGroups = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: "Search query is required" });
    }

    logger.info({ query }, "Searching public groups");

    let groups;

    try {
      // Try case-insensitive search first
      groups = await prisma.chat.findMany({
        where: {
          isGroup: true,
          isPublic: true,
          OR: [
            { 
              AND: [
                { handle: { not: null } },
                { handle: { contains: query, mode: 'insensitive' } }
              ]
            },
            { 
              AND: [
                { name: { not: null } },
                { name: { contains: query, mode: 'insensitive' } }
              ]
            }
          ]
        },
        include: {
          chatMembers: {
            select: {
              id: true,
              userId: true,
              role: true
            }
          }
        },
        take: 20
      });
    } catch (dbError) {
      // Fallback to case-sensitive search if insensitive mode fails
      logger.warn({ error: dbError, query }, "Case-insensitive group search failed, using case-sensitive fallback");
      groups = await prisma.chat.findMany({
        where: {
          isGroup: true,
          isPublic: true,
          OR: [
            { 
              AND: [
                { handle: { not: null } },
                { handle: { contains: query } }
              ]
            },
            { 
              AND: [
                { name: { not: null } },
                { name: { contains: query } }
              ]
            }
          ]
        },
        include: {
          chatMembers: {
            select: {
              id: true,
              userId: true,
              role: true
            }
          }
        },
        take: 20
      });
    }

    logger.info({ count: groups.length, query }, "Groups found");
    res.json(groups);
  } catch (error) {
    logger.error({ error, query: req.query.query }, "Error searching public groups");
    res.status(500).json({ 
      message: "Failed to search groups",
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
};

// Get public group by handle
export const getPublicGroupByHandle = async (req: AuthRequest, res: Response) => {
  try {
    const { handle } = req.params;

    const group = await prisma.chat.findUnique({
      where: { handle },
      include: {
        chatMembers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                nickname: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!group || !group.isPublic) {
      return res.status(404).json({ message: "Public group not found" });
    }

    res.json(group);
  } catch (error) {
    console.error("Error fetching public group:", error);
    res.status(500).json({ message: "Failed to fetch group" });
  }
};

// Join public group
export const joinPublicGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if group is public
    const group = await prisma.chat.findUnique({
      where: { id: chatId }
    });

    if (!group || !group.isPublic) {
      return res.status(404).json({ message: "Public group not found" });
    }

    // Check if already a member
    const existing = await prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ message: "Already a member" });
    }

    // Add as member
    await prisma.chatMember.create({
      data: {
        chatId,
        userId,
        role: "MEMBER"
      }
    });

    res.json({ message: "Joined group successfully" });
  } catch (error) {
    console.error("Error joining public group:", error);
    res.status(500).json({ message: "Failed to join group" });
  }
};
