"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
/**
 * Upload file to Cloudinary
 * @param filePath Local file path
 * @param folder Folder name in Cloudinary
 * @returns Upload result
 */
const uploadToCloudinary = (filePath, folder) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Log configuration for debugging
        console.log('Cloudinary config check:', {
            cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
            api_key: !!process.env.CLOUDINARY_API_KEY,
            api_secret: !!process.env.CLOUDINARY_API_SECRET,
            folder: `acpn-ota/${folder}`,
            filePath,
        });
        const result = yield cloudinary_1.v2.uploader.upload(filePath, {
            folder: `acpn-ota/${folder}`,
            resource_type: 'auto', // Allow any file type
        });
        console.log('Cloudinary upload successful:', {
            public_id: result.public_id,
            secure_url: result.secure_url,
        });
        return result;
    }
    catch (error) {
        console.error('Cloudinary upload error details:', {
            message: error === null || error === void 0 ? void 0 : error.message,
            name: error === null || error === void 0 ? void 0 : error.name,
            stack: error === null || error === void 0 ? void 0 : error.stack,
            filePath,
            folder,
        });
        throw new Error(`Cloudinary upload failed: ${JSON.stringify((error === null || error === void 0 ? void 0 : error.message) || error)}`);
    }
});
exports.uploadToCloudinary = uploadToCloudinary;
/**
 * Delete file from Cloudinary
 * @param publicId Public ID of the file
 * @returns Delete result
 */
const deleteFromCloudinary = (publicId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield cloudinary_1.v2.uploader.destroy(publicId);
        console.log('Cloudinary deletion successful:', result);
        return result;
    }
    catch (error) {
        console.error('Cloudinary deletion error details:', {
            message: error === null || error === void 0 ? void 0 : error.message,
            name: error === null || error === void 0 ? void 0 : error.name,
            publicId,
        });
        throw new Error(`Cloudinary deletion failed: ${JSON.stringify((error === null || error === void 0 ? void 0 : error.message) || error)}`);
    }
});
exports.deleteFromCloudinary = deleteFromCloudinary;
exports.default = {
    uploadToCloudinary: exports.uploadToCloudinary,
    deleteFromCloudinary: exports.deleteFromCloudinary,
};
