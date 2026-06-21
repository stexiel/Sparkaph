import { AuthRequest, Response } from "../middleware/authMiddleware";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";
import { registerSchema, loginSchema } from "../utils/validation";

export const checkUsername = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.query;

    if (!username || typeof username !== "string") {
      res.status(400).json({ available: false, message: "Username is required" });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({ available: false, message: "Username must be at least 3 characters" });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: { username },
    });

    res.json({ available: !existingUser });
  } catch (error) {
    console.error("Error checking username:", error);
    res.status(500).json({ available: false, message: "Server error" });
  }
};

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { username, nickname, password } = validatedData;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { nickname }],
      },
    });

    if (existingUser) {
      res.status(400).json({ message: "Username or nickname already exists" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        nickname,
        password: hashedPassword,
      },
    });

    // Generate tokens
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" },
    );
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "User created successfully",
      user: { id: user.id, username: user.username, nickname: user.nickname },
      token,
      refreshToken,
    });
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

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { username, password } = validatedData;

    // Find user by username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { nickname: username }],
      },
    });
    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Check password
    if (!user.password) {
      res.status(400).json({ message: "This account uses OAuth login" });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Generate tokens
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" },
    );
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        siteAvatar: user.siteAvatar,
        bio: user.bio,
        relationshipStatus: user.relationshipStatus,
        notificationsEnabled: user.notificationsEnabled,
        isDeveloper: user.isDeveloper,
      },
      token,
      refreshToken,
    });
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
