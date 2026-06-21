import { Response } from "../middleware/authMiddleware";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import path from "path";
import fs from "fs";
import { notifyAppDeployed, notifyAppFailed } from "../utils/notifications";

export const uploadZip = async (req: AuthRequest, res: Response) => {
  try {
    const { appId } = req.params;
    const userId = req.user?.userId;

    console.log("📤 ZIP upload request:", { appId, userId, hasFile: !!req.file });

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Verify app ownership
    const app = await prisma.app.findFirst({
      where: { id: appId, userId },
    });

    if (!app) {
      res.status(404).json({ message: "App not found" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    // Use the path provided by multer
    const zipPath = req.file.path;

    console.log("📦 File details:", {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      zipPath,
      exists: fs.existsSync(zipPath),
    });

    if (!fs.existsSync(zipPath)) {
      console.error("❌ ZIP file not found at:", zipPath);
      res.status(400).json({ message: "ZIP file not found" });
      return;
    }

    // Get latest version
    const lastDeployment = await prisma.deployment.findFirst({
      where: { appId },
      orderBy: { version: "desc" },
    });

    // Delete old ZIP files from previous deployments
    if (lastDeployment && lastDeployment.zipPath) {
      try {
        if (fs.existsSync(lastDeployment.zipPath)) {
          fs.unlinkSync(lastDeployment.zipPath);
          console.log("🗑️  Deleted old ZIP file:", lastDeployment.zipPath);
        }
      } catch (err) {
        console.warn("⚠️  Failed to delete old ZIP:", err);
      }
    }

    const version = lastDeployment ? lastDeployment.version + 1 : 1;

    const deployment = await prisma.deployment.create({
      data: {
        appId,
        version,
        zipPath,
        status: "BUILDING",
      },
    });

    // Start deployment process asynchronously
    deployZip(deployment.id, zipPath, app.handle).catch(err => {
      console.error('Deployment failed:', err);
    });

    res.status(201).json({
      ...deployment,
      message: 'Deployment started. Check status for progress.'
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getDeployments = async (req: AuthRequest, res: Response) => {
  try {
    const { appId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Verify app ownership
    const app = await prisma.app.findFirst({
      where: { id: appId, userId },
    });

    if (!app) {
      res.status(404).json({ message: "App not found" });
      return;
    }

    const deployments = await prisma.deployment.findMany({
      where: { appId },
      orderBy: { createdAt: "desc" },
    });

    res.json(deployments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Long polling endpoint for deployment status updates
export const pollDeploymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { appId } = req.params;
    const { lastStatus, timeout = 30000 } = req.query;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Verify app ownership
    const app = await prisma.app.findFirst({
      where: { id: appId, userId },
    });

    if (!app) {
      res.status(404).json({ message: "App not found" });
      return;
    }

    const maxWaitTime = parseInt(timeout as string) || 30000;
    const startTime = Date.now();
    let lastKnownStatus = lastStatus as string;

    // Polling function
    const checkStatus = async (): Promise<boolean> => {
      const deployments = await prisma.deployment.findMany({
        where: { appId },
        orderBy: { createdAt: "desc" },
        take: 1,
      });

      if (deployments.length === 0) return false;

      const latestDeployment = deployments[0];
      
      // Return if status changed or no last status provided
      if (!lastKnownStatus || latestDeployment.status !== lastKnownStatus) {
        res.json({
          deployment: latestDeployment,
          hasUpdate: true,
        });
        return true;
      }

      return false;
    };

    // Initial check
    const hasUpdate = await checkStatus();
    if (hasUpdate) return;

    // Long polling loop
    const pollInterval = setInterval(async () => {
      if (Date.now() - startTime >= maxWaitTime) {
        clearInterval(pollInterval);
        res.json({
          deployment: null,
          hasUpdate: false,
          message: "Timeout",
        });
        return;
      }

      const hasUpdate = await checkStatus();
      if (hasUpdate) {
        clearInterval(pollInterval);
      }
    }, 2000); // Check every 2 seconds

    // Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(pollInterval);
    });

  } catch (error) {
    console.error("Long polling error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
};


// Helper to update build log
async function updateBuildLog(deploymentId: string, message: string) {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId }
  });

  await prisma.deployment.update({
    where: { id: deploymentId },
    data: {
      buildLog: (deployment?.buildLog || '') + message
    }
  });
}

// Helper to get build log
async function getBuildLog(deploymentId: string): Promise<string> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId }
  });
  return deployment?.buildLog || '';
}

// Deployment error types
enum DeploymentError {
  ZIP_NOT_FOUND = 'ZIP_NOT_FOUND',
  EXTRACTION_FAILED = 'EXTRACTION_FAILED',
  NO_INDEX_HTML = 'NO_INDEX_HTML',
  INVALID_STRUCTURE = 'INVALID_STRUCTURE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Helper function to deploy ZIP (for frontend)
async function deployZip(
  deploymentId: string,
  zipPath: string,
  handle: string,
) {
  let errorType: DeploymentError | null = null;
  let errorMessage = '';

  try {
    console.log("🚀 Starting deployment:", { deploymentId, zipPath, handle });

    // Update deployment status to BUILDING
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: "BUILDING",
        buildLog: 'Starting deployment...\n'
      },
    });

    // Paths
    const appsDir = path.join(__dirname, "../../apps");
    const deployDir = path.join(appsDir, handle);

    console.log("📁 Apps directory:", appsDir);
    console.log("📁 Deploy directory:", deployDir);
    console.log("📦 ZIP path:", zipPath);

    // Check if ZIP exists
    if (!fs.existsSync(zipPath)) {
      errorType = DeploymentError.ZIP_NOT_FOUND;
      errorMessage = `ZIP file not found at: ${zipPath}`;
      throw new Error(errorMessage);
    }

    await updateBuildLog(deploymentId, 'ZIP file found\n');

    // Create apps directory if it doesn't exist
    if (!fs.existsSync(appsDir)) {
      console.log("✨ Creating apps directory...");
      fs.mkdirSync(appsDir, { recursive: true });
    }

    // Remove old deployment if exists
    if (fs.existsSync(deployDir)) {
      console.log("🗑️  Removing old deployment...");
      fs.rmSync(deployDir, { recursive: true, force: true });
    }

    // Create deploy directory
    fs.mkdirSync(deployDir, { recursive: true });

    // Extract ZIP using AdmZip
    console.log("📦 Extracting ZIP...");
    await updateBuildLog(deploymentId, 'Extracting ZIP...\n');
    
    try {
      const AdmZip = require("adm-zip");
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(deployDir, true);
      console.log("✅ ZIP extracted successfully");
      await updateBuildLog(deploymentId, 'ZIP extracted successfully\n');
    } catch (err) {
      errorType = DeploymentError.EXTRACTION_FAILED;
      errorMessage = `Failed to extract ZIP: ${err}`;
      throw new Error(errorMessage);
    }

    // List extracted files
    const files = fs.readdirSync(deployDir);
    console.log("✅ Extracted files:", files);

    // Check if index.html is in a subdirectory and move files to root
    const findIndexHtml = (dir: string): string | null => {
      try {
        const items = fs.readdirSync(dir);
        console.log(`📂 Scanning directory: ${dir}, items:`, items);
        
        for (const item of items) {
          // Skip hidden directories and system folders
          if (item.startsWith('.') || item === 'node_modules') {
            console.log(`⏭️  Skipping system folder: ${item}`);
            continue;
          }
          
          const fullPath = path.join(dir, item);
          try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              console.log(`📁 Found subdirectory: ${item}`);
              const found = findIndexHtml(fullPath);
              if (found) return found;
            } else if (item === "index.html") {
              console.log(`✅ Found index.html in: ${dir}`);
              return dir;
            }
          } catch (err) {
            console.warn(`⚠️  Error accessing ${fullPath}:`, err);
          }
        }
      } catch (err) {
        console.warn(`⚠️  Error reading directory ${dir}:`, err);
      }
      return null;
    };

    const indexHtmlDir = findIndexHtml(deployDir);
    if (!indexHtmlDir) {
      errorType = DeploymentError.NO_INDEX_HTML;
      errorMessage = 'index.html not found in ZIP. Please ensure your ZIP contains an index.html file.';
      console.error("❌ index.html not found");
      throw new Error(errorMessage);
    }

    await updateBuildLog(deploymentId, `Found index.html in: ${indexHtmlDir}\n`);

    if (indexHtmlDir !== deployDir) {
      console.log("📁 Moving files from subdirectory to root...");
      await updateBuildLog(deploymentId, 'Moving files to root directory...\n');
      
      const subFiles = fs.readdirSync(indexHtmlDir);
      for (const file of subFiles) {
        const oldPath = path.join(indexHtmlDir, file);
        const newPath = path.join(deployDir, file);
        fs.renameSync(oldPath, newPath);
      }
      // Remove empty subdirectory
      const subdirs = fs.readdirSync(deployDir).filter((f) =>
        fs.statSync(path.join(deployDir, f)).isDirectory(),
      );
      subdirs.forEach((dir) =>
        fs.rmSync(path.join(deployDir, dir), { recursive: true, force: true }),
      );
      console.log("✅ Files moved to root");
      await updateBuildLog(deploymentId, 'Files moved to root\n');
    }

    // Update deployment with success
    const url = `http://localhost:3000/${handle}`;
    console.log("🌐 App URL:", url);

    const deployment = await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: "DEPLOYED",
        url,
        buildLog: (await getBuildLog(deploymentId)) + 'Deployment completed successfully!\n',
      },
      include: {
        app: {
          select: {
            userId: true,
            name: true,
            handle: true,
          },
        },
      },
    });

    // Send success notification
    await notifyAppDeployed(
      deployment.app.userId,
      deployment.app.name,
      deployment.app.handle,
      url
    );

    console.log(`✅ Deployment ${deploymentId} completed: ${url}`);
  } catch (error) {
    console.error(`❌ Deployment ${deploymentId} failed:`, error);

    const finalErrorType = errorType || DeploymentError.UNKNOWN_ERROR;
    const finalErrorMessage = errorMessage || String(error);

    const deployment = await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: "FAILED",
        buildLog: (await getBuildLog(deploymentId)) + `\nERROR: ${finalErrorMessage}`,
      },
      include: {
        app: {
          select: {
            userId: true,
            name: true,
            handle: true,
          },
        },
      },
    });

    // Send failure notification
    await notifyAppFailed(
      deployment.app.userId,
      deployment.app.name,
      deployment.app.handle,
      finalErrorMessage
    );
  }
}
