// This file extends the Express Request interface to include file upload functionality with multer
import { Request } from 'express';

// Define the structure for the file object that multer provides
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
  // Additional properties that exist in your file objects
  name: string;
  tempFilePath: string; // Required for Cloudinary uploads
}

// Extend the Express Request interface
declare global {
  namespace Express {
    interface Request {
      files?:
        | {
            [fieldname: string]: MulterFile[];
          }
        | {
            file?: MulterFile; // For single file uploads
            [fieldname: string]: MulterFile | MulterFile[]; // For multiple files with different field names
          };
      // Include any other custom properties your middleware adds to the request
    }
  }
}
