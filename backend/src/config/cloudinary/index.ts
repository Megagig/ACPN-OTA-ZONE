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
): Promise<any> => {
  try {
    // Log configuration for debugging
    console.log('Cloudinary config check:', {
      cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
      api_key: !!process.env.CLOUDINARY_API_KEY,
      api_secret: !!process.env.CLOUDINARY_API_SECRET,
      folder: `acpn-ota/${folder}`,
      filePath,
    });

    const result = await cloudinary.uploader.upload(filePath, {
      folder: `acpn-ota/${folder}`,
      resource_type: 'auto', // Allow any file type
    });

    console.log('Cloudinary upload successful:', {
      public_id: result.public_id,
      secure_url: result.secure_url,
    });

    return result;
  } catch (error: any) {
    console.error('Cloudinary upload error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      filePath,
      folder,
    });
    throw new Error(
      `Cloudinary upload failed: ${JSON.stringify(error?.message || error)}`
    );
  }
};

/**
 * Delete file from Cloudinary
 * @param publicId Public ID of the file
 * @returns Delete result
 */
export const deleteFromCloudinary = async (publicId: string): Promise<any> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Cloudinary deletion successful:', result);
    return result;
  } catch (error: any) {
    console.error('Cloudinary deletion error details:', {
      message: error?.message,
      name: error?.name,
      publicId,
    });
    throw new Error(
      `Cloudinary deletion failed: ${JSON.stringify(error?.message || error)}`
    );
  }
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
};
