import { Response } from "../middleware/authMiddleware";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/authMiddleware";
import { notifyFriendRequest, notifyFriendAccepted } from "../utils/notifications";

export const sendFriendRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user?.userId;

    if (!senderId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (senderId === receiverId) {
      res
        .status(400)
        .json({ message: "Cannot send friend request to yourself" });
      return;
    }

    // Check if request already exists
    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      res.status(400).json({ message: "Friend request already exists" });
      return;
    }

    const friendRequest = await prisma.friend.create({
      data: {
        senderId,
        receiverId,
        status: "PENDING",
      },
      include: {
        sender: {
          select: { id: true, username: true, avatar: true },
        },
        receiver: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    // Send notification to receiver
    await notifyFriendRequest(senderId, receiverId);

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const acceptFriendRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const friendRequest = await prisma.friend.updateMany({
      where: {
        id: requestId,
        receiverId: userId,
        status: "PENDING",
      },
      data: { status: "ACCEPTED" },
    });

    if (friendRequest.count === 0) {
      res.status(404).json({ message: "Friend request not found" });
      return;
    }

    const updated = await prisma.friend.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: { id: true, username: true, avatar: true },
        },
        receiver: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    if (!updated) {
      res.status(404).json({ message: "Friend request not found" });
      return;
    }

    // Update friends count for both users
    await prisma.user.update({
      where: { id: updated.senderId },
      data: { friendsCount: { increment: 1 } },
    });
    await prisma.user.update({
      where: { id: updated.receiverId },
      data: { friendsCount: { increment: 1 } },
    });

    // Send notification to the sender that their request was accepted
    await notifyFriendAccepted(updated.receiverId, updated.senderId);

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const rejectFriendRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const friendRequest = await prisma.friend.updateMany({
      where: {
        id: requestId,
        receiverId: userId,
        status: "PENDING",
      },
      data: { status: "REJECTED" },
    });

    if (friendRequest.count === 0) {
      res.status(404).json({ message: "Friend request not found" });
      return;
    }

    res.json({ message: "Friend request rejected" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const removeFriend = async (req: AuthRequest, res: Response) => {
  try {
    const { friendId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const friend = await prisma.friend.deleteMany({
      where: {
        id: friendId,
        status: "ACCEPTED",
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    if (friend.count === 0) {
      res.status(404).json({ message: "Friend not found" });
      return;
    }

    // Update friends count for both users
    await prisma.user.update({
      where: { id: userId },
      data: { friendsCount: { decrement: 1 } },
    });

    res.json({ message: "Friend removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFriendRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const requests = await prisma.friend.findMany({
      where: {
        receiverId: userId,
        status: "PENDING",
      },
      include: {
        sender: {
          select: { id: true, username: true, avatar: true, bio: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFriends = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const friends = await prisma.friend.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: { id: true, username: true, avatar: true, isOnline: true },
        },
        receiver: {
          select: { id: true, username: true, avatar: true, isOnline: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Transform to get friend info (not self)
    const transformed = friends.map((f: any) => ({
      ...f,
      friend: f.senderId === userId ? f.receiver : f.sender,
    }));

    res.json(transformed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFriendStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const friend = await prisma.friend.findFirst({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId },
        ],
      },
    });

    if (!friend) {
      res.json({ status: "NONE" });
      return;
    }

    res.json({ status: friend.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
