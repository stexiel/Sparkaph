import { Response } from "../middleware/authMiddleware";
import { AuthRequest } from "../middleware/authMiddleware";

// In-memory storage for updates (в продакшене используй Redis)
const updates: Map<string, any[]> = new Map();
let updateIdCounter = 0;

// Get updates (long polling like Telegram)
export const getUpdates = async (req: AuthRequest, res: Response) => {
  try {
    const appId = req.apiToken?.appId;
    const { offset = 0, limit = 100, timeout = 30 } = req.query;

    if (!appId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const offsetNum = parseInt(offset as string);
    const limitNum = parseInt(limit as string);
    const timeoutNum = parseInt(timeout as string);

    // Get updates for this app
    const appUpdates = updates.get(appId) || [];
    
    // Filter updates after offset
    const newUpdates = appUpdates.filter(u => u.update_id > offsetNum);

    if (newUpdates.length > 0) {
      // Return immediately if we have updates
      res.json({
        ok: true,
        result: newUpdates.slice(0, limitNum)
      });
      return;
    }

    // Long polling - wait for new updates
    const startTime = Date.now();
    const maxWaitTime = Math.min(timeoutNum, 60) * 1000; // Max 60 seconds

    const checkForUpdates = () => {
      const currentUpdates = updates.get(appId) || [];
      const newUpdates = currentUpdates.filter(u => u.update_id > offsetNum);

      if (newUpdates.length > 0) {
        res.json({
          ok: true,
          result: newUpdates.slice(0, limitNum)
        });
        return true;
      }

      if (Date.now() - startTime >= maxWaitTime) {
        // Timeout - return empty array
        res.json({
          ok: true,
          result: []
        });
        return true;
      }

      return false;
    };

    // Check immediately
    if (checkForUpdates()) return;

    // Poll every 1 second
    const interval = setInterval(() => {
      if (checkForUpdates()) {
        clearInterval(interval);
      }
    }, 1000);

    // Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(interval);
    });

  } catch (error) {
    console.error("Error in getUpdates:", error);
    res.status(500).json({ 
      ok: false,
      message: "Server error" 
    });
  }
};

// Add update (internal function)
export const addUpdate = (appId: string, updateType: string, data: any) => {
  const appUpdates = updates.get(appId) || [];
  
  const update = {
    update_id: ++updateIdCounter,
    type: updateType,
    data: data,
    timestamp: new Date().toISOString()
  };

  appUpdates.push(update);
  
  // Keep only last 100 updates per app
  if (appUpdates.length > 100) {
    appUpdates.shift();
  }

  updates.set(appId, appUpdates);
};

// Example: Add update when user interacts with app
export const sendUpdateToApp = async (req: AuthRequest, res: Response) => {
  try {
    const { appId, updateType, data } = req.body;

    if (!appId || !updateType) {
      res.status(400).json({ message: "appId and updateType are required" });
      return;
    }

    addUpdate(appId, updateType, data);

    res.json({ 
      ok: true,
      message: "Update sent" 
    });
  } catch (error) {
    console.error("Error sending update:", error);
    res.status(500).json({ message: "Server error" });
  }
};
