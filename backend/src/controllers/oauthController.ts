import { AuthRequest, Response } from "../middleware/authMiddleware";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";

interface OAuthProfile {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  avatar?: string;
  provider: "github" | "google";
}

export const handleOAuthLogin = async (
  profile: OAuthProfile,
  res: Response,
) => {
  try {
    // Check if user exists by OAuth ID
    let user;
    const providerFieldMap = {
      github: "githubId",
      google: "googleId",
    };

    const providerField = providerFieldMap[profile.provider];

    user = await prisma.user.findFirst({
      where: {
        [providerField]: profile.id,
      },
    });

    if (!user) {
      // Create new user with OAuth - random username and nickname
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const username = `user_${randomSuffix}`;
      const nickname = `User_${randomSuffix}`;

      user = await prisma.user.create({
        data: {
          username,
          nickname,
          avatar: profile.avatar,
          [providerField]: profile.id,
          isOnline: true,
        },
      });
    } else {
      // Update user online status
      await prisma.user.update({
        where: { id: user.id },
        data: { isOnline: true },
      });
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
      message: "OAuth login successful",
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
  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).json({ message: "OAuth login failed" });
  }
};

// GitHub OAuth
export const githubOAuth = async (req: AuthRequest, res: Response) => {
  const { code } = req.body;

  try {
    console.log("GitHub OAuth - Received code:", code ? "Yes" : "No");
    console.log("GitHub Client ID:", process.env.GITHUB_CLIENT_ID);

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID || "Ov23liqEgGVQuMMBoEMs",
          client_secret: process.env.GITHUB_CLIENT_SECRET || "5713b49eeb5939c06bb9735c0803ad5d22234eea",
          code,
        }),
      },
    );

    const tokenData = await tokenResponse.json();
    console.log("GitHub OAuth - Token response:", JSON.stringify(tokenData));

    if (!tokenData.access_token) {
      console.error("GitHub OAuth - No access token in response");
      return res.status(400).json({ message: "Failed to get access token", error: tokenData });
    }

    // Get user profile
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    // Get user email
    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const emailData = await emailResponse.json();
    const primaryEmail = emailData.find((e: any) => e.primary)?.email;

    await handleOAuthLogin(
      {
        id: userData.id.toString(),
        email: primaryEmail,
        username: userData.login,
        name: userData.name,
        avatar: userData.avatar_url,
        provider: "github",
      },
      res,
    );
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    res.status(500).json({ message: "GitHub OAuth failed" });
  }
};

// Google OAuth
export const googleOAuth = async (req: AuthRequest, res: Response) => {
  const { code } = req.body;

  try {
    console.log("Google OAuth - Received code:", code ? "Yes" : "No");
    console.log("Google Client ID:", process.env.GOOGLE_CLIENT_ID);
    console.log("Google Redirect URI:", process.env.GOOGLE_REDIRECT_URI);

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("Google OAuth - Missing credentials");
      return res.status(500).json({ message: "Google OAuth not configured" });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: code || "",
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5173/login/google/callback",
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData = await tokenResponse.json();
    console.log("Google OAuth - Token response:", JSON.stringify(tokenData));

    if (!tokenData.access_token) {
      console.error("Google OAuth - No access token in response");
      return res.status(400).json({ message: "Failed to get access token", error: tokenData });
    }

    // Get user profile
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      },
    );

    const userData = await userResponse.json();
    console.log("Google OAuth - User data:", userData);

    await handleOAuthLogin(
      {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        username: userData.email?.split("@")[0],
        avatar: userData.picture,
        provider: "google",
      },
      res,
    );
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(500).json({ message: "Google OAuth failed" });
  }
};
