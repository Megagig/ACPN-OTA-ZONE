"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUploadedFile = void 0;
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
/**
 * Validates and returns the uploaded file from request
 * @param req Express request object
 * @param next Express next function for error handling
 * @param fieldName Name of the file field (default: 'file')
 * @param maxSize Maximum file size in bytes (default: 5MB)
 * @returns The file object or null if validation fails
 */
const validateUploadedFile = (req, next, fieldName = 'file', maxSize = 5000000) => {
    // Check if files object exists
    if (!req.files) {
        next(new errorResponse_1.default(`Please upload a file`, 400));
        return null;
    }
    // Check if the specified field exists in files
    if (!(fieldName in req.files)) {
        next(new errorResponse_1.default(`Please upload a file using the '${fieldName}' field`, 400));
        return null;
    }
    // Get the file - can be either an array or a single file
    const fileData = req.files[fieldName];
    // Handle both single file and array of files cases
    const file = Array.isArray(fileData) ? fileData[0] : fileData;
    // Check file size
    if (file.size > maxSize) {
        next(new errorResponse_1.default(`File size should be less than ${maxSize / 1000000}MB`, 400));
        return null;
    }
    // Check if tempFilePath exists for Cloudinary uploads
    if (!file.tempFilePath) {
        next(new errorResponse_1.default(`Temporary file path is missing from the uploaded file`, 400));
        return null;
    }
    return file;
};
exports.validateUploadedFile = validateUploadedFile;
