import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
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
export const uploadToCloudinary = async (
  filePath: string,
  folder: string
): Promise<cloudinary.UploadApiResponse> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `acpn-ota/${folder}`,
    });
    return result;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error}`);
  }
};

/**
 * Delete file from Cloudinary
 * @param publicId Public ID of the file
 * @returns Delete result
 */
export const deleteFromCloudinary = async (
  publicId: string
): Promise<cloudinary.DeleteApiResponse> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary deletion failed: ${error}`);
  }
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
};
