import { Response } from "../middleware/authMiddleware";
import { AuthRequest } from "../middleware/authMiddleware";
import prisma from "../utils/prisma";
import path from "path";
import fs from "fs";

// Quick deploy - просто URL приложения, без ZIP
export const quickDeploy = async (req: AuthRequest, res: Response) => {
  try {
    const { appUrl, name, description, type } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!appUrl) {
      res.status(400).json({ message: "App URL is required" });
      return;
    }

    // Validate URL
    try {
      new URL(appUrl);
    } catch {
      res.status(400).json({ message: "Invalid URL" });
      return;
    }

    // Generate unique handle
    const handle = `app_${Date.now()}`;

    // Create app in database
    const app = await prisma.app.create({
      data: {
        name: name || "My App",
        description: description || "",
        handle,
        userId,
        url: appUrl, // External URL
        type: type || "EXTERNAL",
        status: "PUBLISHED",
      },
    });

    res.status(201).json({
      app,
      message: "App created successfully!",
      accessUrl: `http://localhost:3000/app/${handle}`,
    });
  } catch (error) {
    console.error("Quick deploy error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create app from GitHub repo
export const deployFromGitHub = async (req: AuthRequest, res: Response) => {
  try {
    const { repoUrl, name } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!repoUrl) {
      res.status(400).json({ message: "GitHub repo URL is required" });
      return;
    }

    // Extract GitHub Pages URL from repo
    // Example: https://github.com/user/repo -> https://user.github.io/repo
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      res.status(400).json({ message: "Invalid GitHub URL" });
      return;
    }

    const [, username, repo] = match;
    const ghPagesUrl = `https://${username}.github.io/${repo.replace('.git', '')}`;

    const handle = `gh_${Date.now()}`;

    const app = await prisma.app.create({
      data: {
        name: name || repo,
        description: `Deployed from ${repoUrl}`,
        handle,
        userId,
        url: ghPagesUrl,
        type: "EXTERNAL",
      },
    });

    res.status(201).json({
      app,
      message: "App created from GitHub!",
      accessUrl: `http://localhost:3000/app/${handle}`,
      githubPages: ghPagesUrl,
    });
  } catch (error) {
    console.error("GitHub deploy error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Instant deploy - создать приложение из HTML прямо в теле запроса
export const instantDeploy = async (req: AuthRequest, res: Response) => {
  try {
    const { html, name, description, type } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!html) {
      res.status(400).json({ message: "HTML content is required" });
      return;
    }

    const handle = `instant_${Date.now()}`;

    // Create app directory
    const appsDir = path.join(__dirname, "../../apps");
    const appDir = path.join(appsDir, handle);

    if (!fs.existsSync(appsDir)) {
      fs.mkdirSync(appsDir, { recursive: true });
    }

    fs.mkdirSync(appDir, { recursive: true });

    // Write HTML file
    fs.writeFileSync(path.join(appDir, "index.html"), html);

    // Create app in database
    const app = await prisma.app.create({
      data: {
        name: name || "Instant App",
        description: description || "Created with instant deploy",
        handle,
        userId,
        url: `http://localhost:3000/apps/${handle}/index.html`,
        type: type || "HOSTED",
        status: "PUBLISHED",
      },
    });

    // Create deployment record
    await prisma.deployment.create({
      data: {
        appId: app.id,
        version: 1,
        status: "DEPLOYED",
        url: `http://localhost:3000/apps/${handle}/index.html`,
      },
    });

    res.status(201).json({
      app,
      message: "App deployed instantly!",
      url: `http://localhost:3000/apps/${handle}/index.html`,
      accessUrl: `http://localhost:3000/app/${handle}`,
    });
  } catch (error) {
    console.error("Instant deploy error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
