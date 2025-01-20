import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import multerS3 from 'multer-s3';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create an S3 client instance using AWS SDK v3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// File upload to S3 setup using Multer and multer-s3 (v3)
const storage = multerS3({
  s3,
  bucket: process.env.AWS_BUCKET_NAME!,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    // Generate a unique file name using the current timestamp and the original file name
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName); // Save with the generated name
  },
});

// Multer upload middleware to handle file uploads
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: (req, file, cb) => {
    // Accept only specific mime types (e.g., images, PDFs)
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
        cb(new Error('Invalid file type') as any, false);
    }
  },
});

// Function to generate a presigned URL for file download
export const generatePresignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  });

  // Generate the presigned URL using the v3 SDK
  const url = await getSignedUrl(s3, command, { expiresIn });
  return url;
};

// Function to delete a file from S3
export const deleteFileFromS3 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  });

  try {
    // Delete the file using the v3 SDK
    await s3.send(command);
    console.log(`File with key ${key} deleted from S3`);
  } catch (error) {
    console.error(`Error deleting file from S3:`, error);
    throw new Error('Failed to delete file from S3');
  }
};
