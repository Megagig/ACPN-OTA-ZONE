import React, { useState, useRef } from 'react';
import type { User } from '../../types/auth.types';
import userManagementService from '../../services/userManagement.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui';

interface ProfilePictureUploaderProps {
  user: User;
  onPictureUpdate: (newPictureUrl: string) => void;
}

const ProfilePictureUploader: React.FC<ProfilePictureUploaderProps> = ({
  user,
  onPictureUpdate,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default avatar or user's profile picture
  const profilePicture =
    user?.profilePicture || 'https://via.placeholder.com/150';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.match('image.*')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (jpeg, jpg, png, gif)',
        variant: 'destructive',
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.length) {
      toast({
        title: 'No file selected',
        description: 'Please select an image to upload',
        variant: 'destructive',
      });
      return;
    }

    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('profilePicture', file);

    setLoading(true);
    try {
      const response = await userManagementService.uploadProfilePicture(
        formData
      );

      if (response.data?.profilePicture) {
        onPictureUpdate(response.data.profilePicture);
      }

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
      });

      // Reset the preview
      setPreviewUrl(null);

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload profile picture. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <img
          src={previewUrl || profilePicture}
          alt={`${user?.firstName} ${user?.lastName}`}
          className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-md hover:bg-primary/90 transition-colors"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
      </div>

      <div className="hidden">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/gif"
        />
      </div>

      {previewUrl && (
        <div className="flex gap-2">
          <Button onClick={handleUpload} disabled={loading} size="sm">
            {loading ? 'Uploading...' : 'Save Picture'}
          </Button>
          <Button
            onClick={() => {
              setPreviewUrl(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUploader;
