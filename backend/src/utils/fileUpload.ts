// File validation utility for handling file uploads
import { Request, NextFunction } from 'express';
import { UploadedFile } from 'express-fileupload';
import ErrorResponse from '../utils/errorResponse';

/**
 * Validates and returns the uploaded file from request
 * @param req Express request object
 * @param next Express next function for error handling
 * @param fieldName Name of the file field (default: 'file')
 * @param maxSize Maximum file size in bytes (default: 5MB)
 * @returns The file object or null if validation fails
 */
export const validateUploadedFile = (
  req: Request,
  next: NextFunction,
  fieldName: string = 'file',
  maxSize: number = 5000000
): UploadedFile | null => {
  // Check if files object exists
  if (!req.files) {
    next(new ErrorResponse(`Please upload a file`, 400));
    return null;
  }

  // Check if the specified field exists in files
  if (!(fieldName in req.files)) {
    next(
      new ErrorResponse(
        `Please upload a file using the '${fieldName}' field`,
        400
      )
    );
    return null;
  }

  // Get the file - can be either an array or a single file
  const fileData = req.files[fieldName];

  // Handle both single file and array of files cases
  const file = Array.isArray(fileData) ? fileData[0] : fileData;

  // Check file size
  if (file.size > maxSize) {
    next(
      new ErrorResponse(
        `File size should be less than ${maxSize / 1000000}MB`,
        400
      )
    );
    return null;
  }

  // Check if tempFilePath exists for Cloudinary uploads
  if (!file.tempFilePath) {
    next(
      new ErrorResponse(
        `Temporary file path is missing from the uploaded file`,
        400
      )
    );
    return null;
  }

  return file;
};
