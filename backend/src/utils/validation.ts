import { z } from "zod";

// Auth validation schemas
export const registerSchema = z.object({
  username: z.string().min(3).max(30),
  nickname: z.string().min(3).max(30),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(1),
});

// User validation schemas
export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  nickname: z.string().min(3).max(30).optional(),
  avatar: z.string().optional(),
  siteAvatar: z.string().optional(),
  bio: z.string().max(500).optional(),
  relationshipStatus: z
    .enum(["single", "dating", "married", "complicated", "searching"])
    .optional(),
  notificationsEnabled: z.boolean().optional(),
  isDeveloper: z.boolean().optional(),
});

// Chat validation schemas
export const createChatSchema = z.object({
  partnerId: z.string().uuid().optional(),
  isGroup: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
  memberIds: z.array(z.string().uuid()).optional(),
});

export const sendMessageSchema = z.object({
  chatId: z.string().uuid(),
  content: z.string().max(5000).optional(),
  type: z
    .enum(["TEXT", "IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "STICKER", "VOICE"])
    .default("TEXT"),
  fileUrl: z.string().url().optional(),
});

export const markMessagesAsReadSchema = z.object({
  chatId: z.string().uuid(),
});

// Search validation schema
export const searchUsersSchema = z.object({
  query: z.string().min(1).max(50),
});
