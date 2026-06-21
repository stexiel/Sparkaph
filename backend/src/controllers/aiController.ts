import { AuthRequest, Response } from "../middleware/authMiddleware";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { join } from "path";
import archiver from "archiver";
import { unlink } from "fs/promises";
import prisma from "../utils/prisma";

const SPARKAPH_AI_API_KEY = process.env.SPARKAPH_AI_API_KEY || "";

export const chatWithAI = async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("Sparkaph AI Chat Request:", message);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${SPARKAPH_AI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Ты - Sparkaph AI, продвинутый ассистент для разработчиков мини-приложений. 

Твои возможности:
- Помощь в разработке веб-приложений (HTML, CSS, JavaScript)
- Генерация полноценных мини-аппов с современным дизайном
- Консультации по API Sparkaph
- Решение технических проблем

Стиль общения:
- Дружелюбный и профессиональный
- Отвечай на русском языке
- Давай конкретные примеры кода
- Если пользователь хочет создать приложение, предложи сгенерировать ZIP файл

Контекст Sparkaph:
- Платформа для создания и хостинга мини-приложений
- Поддерживает HOSTED (статические файлы) и EXTERNAL (API) приложения
- Есть API для взаимодействия с пользователями и данными
- Система уведомлений, чатов, платежей

Пользователь: ${message}`
                }
              ]
            }
          ]
        }),
      }
    );

    const data = await response.json();
    console.log("Sparkaph AI Response:", data);

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return res.json({
        response: "Извините, AI сервис временно недоступен. Пожалуйста, попробуйте позже."
      });
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    res.json({ response: aiResponse });
  } catch (error: any) {
    console.error("Sparkaph AI Chat Error:", error);
    res.json({ 
      response: "Извините, произошла ошибка при обращении к AI сервису. Пожалуйста, попробуйте позже." 
    });
  }
};

export const generateZip = async (req: AuthRequest, res: Response) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: "Description is required" });
    }

    console.log("Sparkaph AI ZIP Generation Request:", description);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${SPARKAPH_AI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Создай полноценный мини-апп на основе описания. Приложение должно быть полностью функциональным и готовым к использованию.

Требования:
1. Адаптивный дизайн для мобильных и десктоп устройств
2. Красивый современный UI с glassmorphism эффектами
3. Используй CSS переменные для цветов для легкой темизации
4. JavaScript для интерактивности (анимации, переходы, логика)
5. Раздели код на 3 файла: index.html, styles.css, script.js
6. Используй Tailwind CSS через CDN для стилизации
7. Дизайн должен быть похож на iOS с прозрачными элементами и плавными анимациями
8. Добавь красивые иконки (можно использовать emoji или SVG)
9. Убедись что все элементы интерактивны и работают
10. Добавь hover эффекты и transitions

Верни код в формате JSON с тремя файлами:
\`\`\`json
{
  "index.html": "полный HTML код",
  "styles.css": "полный CSS код",
  "script.js": "полный JavaScript код"
}
\`\`\`

Описание: ${description}`
                }
              ]
            }
          ]
        }),
      }
    );

    const data = await response.json();
    console.log("Sparkaph AI ZIP Response:", data);

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return res.status(500).json({ error: "AI сервис временно недоступен. Попробуйте позже." });
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    // Extract JSON from response
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
    let filesData: any = {};

    if (jsonMatch) {
      try {
        filesData = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        // Fallback to single HTML file
        const htmlMatch = aiResponse.match(/```html\n([\s\S]*?)\n```/);
        if (htmlMatch) {
          filesData = { "index.html": htmlMatch[1] };
        } else {
          filesData = { "index.html": aiResponse };
        }
      }
    } else {
      // Fallback to single HTML file
      const htmlMatch = aiResponse.match(/```html\n([\s\S]*?)\n```/);
      if (htmlMatch) {
        filesData = { "index.html": htmlMatch[1] };
      } else {
        filesData = { "index.html": aiResponse };
      }
    }

    // Create temp directory if it doesn't exist
    const tempDir = join(__dirname, "../../temp");
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Create files
    const fileNames: string[] = [];
    for (const [fileName, content] of Object.entries(filesData)) {
      const filePath = join(tempDir, fileName);
      const writeStream = createWriteStream(filePath);
      writeStream.write(content as string);
      writeStream.end();
      fileNames.push(filePath);
    }

    // Create ZIP file
    const zipFileName = `app-${Date.now()}.zip`;
    const zipPath = join(tempDir, zipFileName);
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", async () => {
      // Clean up files
      for (const filePath of fileNames) {
        await unlink(filePath).catch(console.error);
      }
    });

    archive.on("error", (err: Error) => {
      throw err;
    });

    archive.pipe(output);

    // Add all files to ZIP
    for (const [fileName, content] of Object.entries(filesData)) {
      const filePath = join(tempDir, fileName);
      archive.file(filePath, { name: fileName });
    }

    await archive.finalize();

    // Return ZIP URL
    const zipUrl = `/api/ai/download/${zipFileName}`;
    res.json({ zipUrl });
  } catch (error: any) {
    console.error("ZIP Generation Error:", error);
    res.status(500).json({ error: "Failed to generate ZIP", details: error.message });
  }
};

export const downloadZip = async (req: AuthRequest, res: Response) => {
  try {
    const { fileName } = req.params;
    const filePath = join(__dirname, "../../temp", fileName);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.download(filePath, "sparkaph-app.zip", (err: Error) => {
      if (err) {
        console.error("Download Error:", err);
      }
      // Clean up file after download
      unlink(filePath).catch(console.error);
    });
  } catch (error) {
    console.error("Download Error:", error);
    res.status(500).json({ error: "Failed to download file" });
  }
};

export const generateAndDeploy = async (req: AuthRequest, res: Response) => {
  try {
    const { description, appName, handle } = req.body;
    const userId = (req as any).user?.userId;

    if (!description || !appName || !handle) {
      return res.status(400).json({ error: "Description, app name and handle are required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("Sparkaph AI Generate and Deploy Request:", { description, appName, handle, userId });

    // Check if handle is already taken
    const existingApp = await prisma.app.findUnique({
      where: { handle },
    });

    if (existingApp) {
      return res.status(400).json({ error: "Handle already taken" });
    }

    // Generate ZIP
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${SPARKAPH_AI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Создай полноценный мини-апп "${appName}" на основе описания. Приложение должно быть полностью функциональным и готовым к использованию.

Требования:
1. Адаптивный дизайн для мобильных и десктоп устройств
2. Красивый современный UI с glassmorphism эффектами
3. Используй CSS переменные для цветов для легкой темизации
4. JavaScript для интерактивности (анимации, переходы, логика)
5. Раздели код на 3 файла: index.html, styles.css, script.js
6. Используй Tailwind CSS через CDN для стилизации
7. Дизайн должен быть похож на iOS с прозрачными элементами и плавными анимациями
8. Добавь красивые иконки (можно использовать emoji или SVG)
9. Убедись что все элементы интерактивны и работают
10. Добавь hover эффекты и transitions

Верни код в формате JSON с тремя файлами:
\`\`\`json
{
  "index.html": "полный HTML код",
  "styles.css": "полный CSS код",
  "script.js": "полный JavaScript код"
}
\`\`\`

Описание: ${description}`
                }
              ]
            }
          ]
        }),
      }
    );

    const data = await response.json();
    console.log("Sparkaph AI Response:", data);

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return res.status(500).json({ error: "AI сервис временно недоступен. Попробуйте позже." });
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    // Extract JSON from response
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
    let filesData: any = {};

    if (jsonMatch) {
      try {
        filesData = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        const htmlMatch = aiResponse.match(/```html\n([\s\S]*?)\n```/);
        if (htmlMatch) {
          filesData = { "index.html": htmlMatch[1] };
        } else {
          filesData = { "index.html": aiResponse };
        }
      }
    } else {
      const htmlMatch = aiResponse.match(/```html\n([\s\S]*?)\n```/);
      if (htmlMatch) {
        filesData = { "index.html": htmlMatch[1] };
      } else {
        filesData = { "index.html": aiResponse };
      }
    }

    // Create app in database
    const app = await prisma.app.create({
      data: {
        name: appName,
        handle,
        userId,
        type: "HOSTED",
        status: "DRAFT",
      },
    });

    // Create temp directory if it doesn't exist
    const tempDir = join(__dirname, "../../temp");
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Create files
    const fileNames: string[] = [];
    for (const [fileName, content] of Object.entries(filesData)) {
      const filePath = join(tempDir, fileName);
      const writeStream = createWriteStream(filePath);
      writeStream.write(content as string);
      writeStream.end();
      fileNames.push(filePath);
    }

    // Create ZIP file
    const zipFileName = `app-${Date.now()}.zip`;
    const zipPath = join(tempDir, zipFileName);
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", async () => {
      // Clean up files
      for (const filePath of fileNames) {
        await unlink(filePath).catch(console.error);
      }
    });

    archive.on("error", (err: Error) => {
      throw err;
    });

    archive.pipe(output);

    // Add all files to ZIP
    for (const [fileName, content] of Object.entries(filesData)) {
      const filePath = join(tempDir, fileName);
      archive.file(filePath, { name: fileName });
    }

    await archive.finalize();

    // Create deployment
    const deployment = await prisma.deployment.create({
      data: {
        appId: app.id,
        version: 1,
        zipPath,
        status: "BUILDING",
      },
    });

    // Start deployment process
    const { deployZip } = require("./deploymentController");
    deployZip(deployment.id, zipPath, handle);

    res.json({
      app,
      deployment,
      message: "Приложение создано и развертывается...",
    });
  } catch (error: any) {
    console.error("Generate and Deploy Error:", error);
    res.status(500).json({ error: "Failed to generate and deploy", details: error.message });
  }
};
