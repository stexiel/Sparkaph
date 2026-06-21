import prisma from "../utils/prisma";
import { AuthRequest, Response } from "../middleware/authMiddleware";
import { io } from "../app";
import {
  sendMessageSchema,
  markMessagesAsReadSchema,
} from "../utils/validation";
import { notifyNewMessage } from "../utils/notifications";
import { deleteCache } from "../utils/redis";

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = sendMessageSchema.parse(req.body);
    const { chatId, content, type, fileUrl } = validatedData;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content,
        type: type || "TEXT",
        fileUrl,
        statuses: {
          create: {
            userId: userId,
            status: "SENT",
          },
        },
      },
      include: {
        sender: {
          select: { id: true, username: true, avatar: true },
        },
        statuses: true,
      },
    });

    // Update chat updatedAt
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Get all chat members except sender to send notifications
    const chatMembers = await prisma.chatMember.findMany({
      where: {
        chatId,
        userId: { not: userId },
      },
      select: { userId: true },
    });

    // Send notifications to all members except sender
    const messagePreview = content || "[Media]";
    await Promise.all(
      chatMembers.map((member) =>
        notifyNewMessage(userId, member.userId, messagePreview, chatId)
      )
    );

    // Emit socket event
    io.to(chatId).emit("new_message", message);

    res.status(201).json(message);
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

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Verify user is member of chat
    const isMember = await prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },
    });

    if (!isMember) {
      res.status(403).json({ message: "Not a member of this chat" });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      include: {
        sender: {
          select: { id: true, username: true, avatar: true },
        },
        statuses: true,
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const markMessagesAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = markMessagesAsReadSchema.parse(req.params);
    const { chatId } = validatedData;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Find messages in this chat that are not sent by the current user
    // and don't have a READ status for the current user
    const messagesToUpdate = await prisma.message.findMany({
      where: {
        chatId,
        senderId: { not: userId },
        statuses: {
          none: {
            userId: userId,
            status: "READ",
          },
        },
      },
    });

    await Promise.all(
      messagesToUpdate.map(async (msg: any) => {
        // Check if status exists
        const existingStatus = await prisma.messageStatus.findUnique({
          where: {
            messageId_userId: {
              messageId: msg.id,
              userId: userId,
            },
          },
        });

        if (existingStatus) {
          await prisma.messageStatus.update({
            where: { id: existingStatus.id },
            data: { status: "READ" },
          });
        } else {
          await prisma.messageStatus.create({
            data: {
              messageId: msg.id,
              userId: userId,
              status: "READ",
            },
          });
        }
      }),
    );

    // Clear chat cache for this user to update unread count
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { chatMembers: true },
    });
    
    if (chat) {
      // Clear cache for all members of this chat
      for (const member of chat.chatMembers) {
        await deleteCache(`chats:${member.userId}`);
      }
    }

    // Emit socket event to notify sender that messages are read
    io.to(chatId).emit("messages_read", { chatId, userId });

    res.json({ message: "Messages marked as read" });
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

export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Find the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { chat: true },
    });

    if (!message) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    // Check if user is the sender or admin of the chat
    const chatMember = await prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId: message.chatId,
          userId,
        },
      },
    });

    const isAdmin = chatMember?.role === "ADMIN";
    const isSender = message.senderId === userId;

    if (!isSender && !isAdmin) {
      res.status(403).json({ message: "You can only delete your own messages or be an admin" });
      return;
    }

    // Delete message statuses first
    await prisma.messageStatus.deleteMany({
      where: { messageId },
    });

    // Delete the message
    await prisma.message.delete({
      where: { id: messageId },
    });

    // Clear cache
    const chat = await prisma.chat.findUnique({
      where: { id: message.chatId },
      include: { chatMembers: true },
    });
    
    if (chat) {
      for (const member of chat.chatMembers) {
        await deleteCache(`chats:${member.userId}`);
      }
    }

    // Emit socket event
    io.to(message.chatId).emit("message_deleted", { messageId, chatId: message.chatId });

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
