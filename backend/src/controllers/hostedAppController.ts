import { AuthRequest, Response } from "../middleware/authMiddleware";
import prisma from "../utils/prisma";
import path from "path";
import fs from "fs";

// Serve HOSTED app files
export const serveHostedApp = async (req: AuthRequest, res: Response) => {
  try {
    const { handle } = req.params;
    // Get language from Accept-Language header
    const acceptLang = req.headers['accept-language'] || 'en';
    const lang = acceptLang.includes('ru') ? 'ru' : 'en';
    
    // Get file path from request path
    let filePath = req.path === '/' || req.path === '' || req.path === '/metadata' ? 'index.html' : req.path.substring(1);

    // Find app by handle
    const app = await prisma.app.findUnique({
      where: { handle },
      include: {
        deployments: {
          where: { status: "DEPLOYED" },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    if (!app) {
      res.status(404).send(generateErrorPage(
        '404',
        lang === 'ru' ? 'Приложение не найдено' : 'App Not Found',
        lang === 'ru' ? `Приложение "${handle}" не существует на Sparkaph.` : `The app "${handle}" does not exist on Sparkaph.`,
        lang === 'ru' ? 'Проверьте URL или просмотрите доступные приложения.' : 'Check the URL or browse available apps.',
        lang
      ));
      return;
    }

    if (app.type !== "HOSTED") {
      // For EXTERNAL apps, redirect to their URL
      if (app.url) {
        res.redirect(app.url);
        return;
      }
      
      res.status(400).send(generateErrorPage(
        'External App',
        lang === 'ru' ? `${app.name} - внешнее приложение` : `${app.name} is an External App`,
        lang === 'ru' ? `Это приложение работает на внешнем сервере, но URL не настроен.` : `This app runs on an external server, but URL is not configured.`,
        lang === 'ru' ? 'Разработчик должен настроить URL приложения в настройках.' : 'The developer needs to configure the app URL in settings.',
        lang
      ));
      return;
    }

    if (!app.deployments || app.deployments.length === 0) {
      res.status(404).send(generateErrorPage(
        lang === 'ru' ? 'Не задеплоено' : 'Not Deployed',
        lang === 'ru' ? 'Приложение еще не задеплоено' : 'App Not Deployed Yet',
        lang === 'ru' ? `Приложение "${app.name}" существует, но еще не было задеплоено.` : `The app "${app.name}" exists but hasn't been deployed yet.`,
        lang === 'ru' ? 'Разработчик должен сначала загрузить и задеплоить файлы приложения.' : 'The developer needs to upload and deploy the app files first.',
        lang
      ));
      return;
    }

    // Construct file path
    const appDir = path.join(__dirname, "../../apps", handle);
    const requestedFile = path.join(appDir, filePath);

    // Security check: prevent directory traversal
    if (!requestedFile.startsWith(appDir)) {
      res.status(403).send(generateErrorPage(
        '403',
        lang === 'ru' ? 'Доступ запрещен' : 'Access Denied',
        lang === 'ru' ? 'У вас нет прав для доступа к этому ресурсу.' : 'You do not have permission to access this resource.',
        lang === 'ru' ? 'Проверка безопасности не пройдена.' : 'Security check failed.',
        lang
      ));
      return;
    }

    // Check if file exists
    if (!fs.existsSync(requestedFile)) {
      res.status(404).send(generateErrorPage(
        '404',
        lang === 'ru' ? 'Файл не найден' : 'File Not Found',
        lang === 'ru' ? `Файл "${filePath}" не существует в этом приложении.` : `The file "${filePath}" does not exist in this app.`,
        lang === 'ru' ? 'Проверьте путь к файлу или свяжитесь с разработчиком приложения.' : 'Check the file path or contact the app developer.',
        lang
      ));
      return;
    }

    // Check if it's a directory
    if (fs.statSync(requestedFile).isDirectory()) {
      // Try to serve index.html from directory
      const indexPath = path.join(requestedFile, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
        return;
      } else {
        res.status(404).send(generateErrorPage(
          '404',
          lang === 'ru' ? 'Индексный файл не найден' : 'Index File Not Found',
          lang === 'ru' ? 'Эта директория не содержит файл index.html.' : 'This directory does not contain an index.html file.',
          lang === 'ru' ? 'Разработчик приложения должен добавить файл index.html в эту директорию.' : 'The app developer needs to add an index.html file to this directory.',
          lang
        ));
        return;
      }
    }

    // Determine file type and set appropriate headers
    const downloadExtensions = ['.xlsx', '.xls', '.csv', '.pdf', '.zip', '.rar', '.tar', '.gz'];
    const shouldDownload = downloadExtensions.some(ext => filePath.toLowerCase().endsWith(ext));

    // MIME types for common file types
    const mimeTypes: { [key: string]: string } = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
    };

    const ext = path.extname(requestedFile).toLowerCase();
    const mimeType = mimeTypes[ext];

    if (shouldDownload) {
      // Set headers for file download
      const fileName = path.basename(requestedFile);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.setHeader('Content-Type', mimeType || 'application/octet-stream');
    } else if (mimeType) {
      // Set correct MIME type for display
      res.setHeader('Content-Type', mimeType);
    }

    // Serve the file
    res.sendFile(requestedFile);
  } catch (error) {
    console.error("Error serving hosted app:", error);
    const acceptLang = req.headers['accept-language'] || 'en';
    const lang = acceptLang.includes('ru') ? 'ru' : 'en';
    res.status(500).send(generateErrorPage(
      '500',
      lang === 'ru' ? 'Ошибка сервера' : 'Server Error',
      lang === 'ru' ? 'Произошла неожиданная ошибка при загрузке этого приложения.' : 'An unexpected error occurred while loading this app.',
      lang === 'ru' ? 'Пожалуйста, попробуйте позже или свяжитесь с поддержкой.' : 'Please try again later or contact support.',
      lang
    ));
  }
};

// Get app metadata for SEO
export const getAppMetadata = async (req: AuthRequest, res: Response) => {
  try {
    const { handle } = req.params;

    const app = await prisma.app.findUnique({
      where: { handle },
      include: {
        user: {
          select: {
            username: true,
            nickname: true
          }
        }
      }
    });

    if (!app) {
      res.status(404).json({ message: "App not found" });
      return;
    }

    res.json({
      name: app.name,
      handle: app.handle,
      description: app.description || `${app.name} - A Sparkaph app`,
      icon: app.icon,
      type: app.type,
      author: app.user.nickname || app.user.username,
      url: `https://sparkaph.com/${app.handle}`,
      createdAt: app.createdAt
    });
  } catch (error) {
    console.error("Error getting app metadata:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Generate beautiful error page HTML
function generateErrorPage(code: string, title: string, message: string, hint: string, lang: string = 'en'): string {
  const translations = {
    en: {
      goHome: 'Go to Home'
    },
    ru: {
      goHome: 'На главную'
    }
  };
  
  const t = translations[lang as keyof typeof translations] || translations.en;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${code} - ${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .error-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 24px;
            padding: 48px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        
        .error-code {
            font-size: 72px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 16px;
        }
        
        .error-title {
            font-size: 32px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 16px;
        }
        
        .error-message {
            font-size: 18px;
            color: #666;
            margin-bottom: 12px;
            line-height: 1.6;
        }
        
        .error-hint {
            font-size: 14px;
            color: #999;
            margin-bottom: 32px;
            padding: 16px;
            background: #f5f5f5;
            border-radius: 12px;
        }
        
        .error-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
            border: none;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-secondary {
            background: #f5f5f5;
            color: #1a1a1a;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        
        .logo {
            width: 64px;
            height: 64px;
            margin: 0 auto 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
        }
        
        @media (max-width: 640px) {
            .error-container {
                padding: 32px 24px;
            }
            
            .error-code {
                font-size: 56px;
            }
            
            .error-title {
                font-size: 24px;
            }
            
            .error-message {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="logo">⚡</div>
        <div class="error-code">${code}</div>
        <h1 class="error-title">${title}</h1>
        <p class="error-message">${message}</p>
        <div class="error-hint">💡 ${hint}</div>
        <div class="error-actions">
            <a href="/" class="btn btn-primary">${t.goHome}</a>
        </div>
    </div>
</body>
</html>
  `.trim();
}
