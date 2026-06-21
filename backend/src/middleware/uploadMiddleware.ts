import multer, { Multer } from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";

// S3 Client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Fallback to local storage if S3 is not configured
let upload: Multer;

if (
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET
) {
  // Use S3 for production
  upload = multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.AWS_S3_BUCKET,
      acl: "public-read",
      metadata: function (
        _req: any,
        file: any,
        cb: (error: Error | null, metadata: any) => void,
      ) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (
        _req: any,
        file: any,
        cb: (error: Error | null, filename: string) => void,
      ) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
      },
    }),
  });
} else {
  // Use local storage for development
  const path = require("path");
  const fs = require("fs");
  const uploadDir = path.join(__dirname, "../../uploads");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  upload = multer({
    storage: multer.diskStorage({
      destination: (
        req: any,
        file: any,
        cb: (error: Error | null, destination: string) => void,
      ) => {
        cb(null, uploadDir);
      },
      filename: (
        req: any,
        file: any,
        cb: (error: Error | null, filename: string) => void,
      ) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      },
    }),
    fileFilter: (req: any, file: any, cb: any) => {
      // Allow images, audio, and video files
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'audio/webm',
        'audio/ogg',
        'audio/wav',
        'audio/mpeg',
        'video/mp4',
        'video/webm',
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'), false);
      }
    },
  });
}

// Separate upload middleware for ZIP files
const uploadZipFile = multer({
  storage: multer.diskStorage({
    destination: (req: any, file: any, cb: (error: Error | null, destination: string) => void) => {
      const path = require('path');
      const fs = require('fs');
      const uploadDir = path.join(__dirname, '../../uploads/apps');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req: any, file: any, cb: (error: Error | null, filename: string) => void) => {
      const path = require('path');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  fileFilter: (req: any, file: any, cb: any) => {
    // Allow only ZIP files
    const allowedTypes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-zip',
      'application/octet-stream', // Sometimes ZIP files are sent as octet-stream
    ];
    
    // Also check file extension
    const path = require('path');
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || ext === '.zip') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only ZIP files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export { upload, uploadZipFile, s3Client };
