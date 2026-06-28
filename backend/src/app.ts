import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter, RedisAdapter } from "@socket.io/redis-adapter";
import authRoutes from "./routes/authRoutes";
import chatRoutes from "./routes/chatRoutes";
import userRoutes, { publicUserRouter } from "./routes/userRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import appRoutes from "./routes/appRoutes";
import deploymentRoutes from "./routes/deploymentRoutes";
import apiTokenRoutes from "./routes/apiTokenRoutes";
import friendRoutes from "./routes/friendRoutes";
import storyRoutes, { publicStoryRouter } from "./routes/storyRoutes";
import followerRoutes from "./routes/followerRoutes";
import blockRoutes from "./routes/blockRoutes";
import groupRoutes from "./routes/groupRoutes";
import oauthRoutes from "./routes/oauthRoutes";
import { publicAppRouter } from "./routes/appRoutes";
import hostedAppRoutes from "./routes/hostedAppRoutes";
import appApiRoutes from "./routes/appApiRoutes";
import appSdkRoutes from "./routes/appSdkRoutes";
import longPollingRoutes from "./routes/longPollingRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import aiRoutes from "./routes/aiRoutes";
import walletRoutes from "./routes/walletRoutes";
import adminRoutes from "./routes/adminRoutes";
import path from "path";
import prisma from "./utils/prisma";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware";
import logger, { requestLogger } from "./utils/logger";

const app = express();

// Trust proxy for Render - use number of proxies instead of true
app.set('trust proxy', 1);

const httpServer = createServer(app);

// Initialize Socket.io immediately
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Redis adapter for Socket.io scaling (optional)
const setupRedisAdapter = async () => {
  if (process.env.REDIS_URL) {
    try {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      io.adapter(createAdapter(pubClient, subClient));
      logger.info("Redis adapter connected for Socket.io");
    } catch (error) {
      logger.warn("Redis connection failed, running without Redis adapter");
    }
  } else {
    logger.info("Socket.io running without Redis adapter");
  }

  setupSocketHandlers();
};

const setupSocketHandlers = () => {
  // Socket.io connection handler - use userId -> socketId map for O(1) lookups
  const onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "User connected");

    socket.on("setup", async (userId: string) => {
      socket.join(userId);
      
      // Add socket to user's socket set
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
        // Only mark online if this is the first socket for this user
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { isOnline: true },
          });
          socket.broadcast.emit("user_online", userId);
          logger.info({ userId }, "User marked online");
        } catch (error) {
          logger.error({ error, userId }, "Error updating user status");
        }
      }
      onlineUsers.get(userId)!.add(socket.id);
      logger.info({ userId, socketId: socket.id }, "User set up");
    });

    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      logger.info({ socketId: socket.id, chatId }, "User joined chat");
    });

    // WebRTC Signaling
    socket.on("call_user", ({ userToCall, signalData, from, name }) => {
      const callerSocketId = socket.id;
      const userSockets = onlineUsers.get(userToCall);
      
      if (userSockets && userSockets.size > 0) {
        // Send to any socket of the target user
        const targetSocketId = userSockets.values().next().value;
        io.to(targetSocketId).emit("call_user", {
          signal: signalData,
          from,
          name,
          callerSocketId,
        });
        logger.info({ from, to: userToCall }, "Call initiated");
      }
    });

    socket.on("answer_call", (data) => {
      io.to(data.to).emit("call_accepted", data.signal);
      logger.info({ to: data.to }, "Call answered");
    });

    socket.on("end_call", ({ to }) => {
      const userSockets = onlineUsers.get(to);
      if (userSockets && userSockets.size > 0) {
        const targetSocketId = userSockets.values().next().value;
        io.to(targetSocketId).emit("call_ended");
        logger.info({ to }, "Call ended");
      }
    });

    socket.on("disconnect", async () => {
      // Find which user this socket belonged to
      let disconnectedUserId: string | null = null;
      
      for (const [userId, sockets] of onlineUsers.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          disconnectedUserId = userId;
          
          // If no more sockets for this user, mark offline
          if (sockets.size === 0) {
            onlineUsers.delete(userId);
            try {
              await prisma.user.update({
                where: { id: userId },
                data: { isOnline: false, lastSeen: new Date() },
              });
              socket.broadcast.emit("user_offline", userId);
              logger.info({ userId }, "User marked offline");
            } catch (error) {
              logger.error({ error, userId }, "Error updating user status on disconnect");
            }
          }
          break;
        }
      }
      
      logger.info({ socketId: socket.id, userId: disconnectedUserId }, "User disconnected");
    });
  });
};

setupRedisAdapter();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Serve static files from CDN (GitHub Pages) with fallback to local
const STATIC_ASSETS_URL = process.env.STATIC_ASSETS_URL || 'https://stexiel.github.io/sparkaph-assets';
app.use('/static', async (req, res, next) => {
  try {
    const assetPath = req.path;
    const remoteUrl = `${STATIC_ASSETS_URL}${assetPath}`;
    
    // Try to fetch from CDN
    const response = await fetch(remoteUrl);
    if (response.ok) {
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
      res.send(Buffer.from(buffer));
      return;
    }
    
    // Fallback to local public folder
    next();
  } catch (error) {
    // Fallback to local on error
    next();
  }
});

// Local static files fallback
app.use('/static', express.static(path.join(__dirname, '../frontend/public')));

app.use("/api/auth", authRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/users", userRoutes);
app.use("/api/apps", appRoutes);
app.use("/api/deployments", deploymentRoutes);
app.use("/api/tokens", apiTokenRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/followers", followerRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/app", appApiRoutes); // App SDK API (legacy)
app.use("/api/sdk", appSdkRoutes); // App SDK API (new - user-specific)
app.use("/api/polling", longPollingRoutes); // Long polling (like Telegram getUpdates)
app.use("/api/payments", paymentRoutes); // Payment system
app.use("/api/wallet", walletRoutes); // Sparks wallet system
app.use("/api/admin", adminRoutes); // Admin dashboard
app.use("/stories", publicStoryRouter); // Public story access
app.use("/user", publicUserRouter); // Public profile access

app.get("/", (req, res) => {
  res.send("Sparkaph API is running");
});

// Public app access (for app metadata and profile)
app.use("/app", publicAppRouter);

// HOSTED app routes - handle dynamically (must be last to not conflict with other routes)
app.use("/:handle", hostedAppRoutes);

// Error handling middleware (must be after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

export { httpServer, io };
