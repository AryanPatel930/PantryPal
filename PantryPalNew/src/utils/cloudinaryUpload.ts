import { Alert } from 'react-native';

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads an image to Cloudinary and returns the public URL.
 * @param uri The local file URI of the image to upload.
 * @returns A Promise that resolves with the public URL of the uploaded image.
 */
export const uploadImageToCloudinary = async (uri: string): Promise<string | null> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    console.log('Cloudinary credentials are not configured. Skipping image upload.');
    return null;
  }

  const fileExt = uri.split('.').pop();
  const formData = new FormData();
  formData.append('file', {
    uri: uri,
    name: `photo.${fileExt}`,
    type: `image/${fileExt}`,
  } as any);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });
    
    // ⬇️ NEW: Log the full response for detailed debugging
    const data = await response.json();
    console.log('Cloudinary API Response:', data);

    if (!response.ok) {
        // If the response is not OK, throw an error with the detailed message
        const errorMessage = data.error?.message || response.statusText;
        throw new Error(`Cloudinary upload failed: ${errorMessage}`);
    }

    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error('Image upload failed, no URL returned from Cloudinary.');
    }
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    Alert.alert('Error', 'Failed to upload image. Please try again.');
    return null;
  }
};