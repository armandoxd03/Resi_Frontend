/**
 * Image URL Helper
 * Constructs proper image URLs based on how the image is stored
 */

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Get the full URL for an image
 * @param {string} imagePath - Can be a file path, base64 string, or data URI
 * @returns {string} - Full URL or data URI to display the image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return null;
  }

  // If it's already a data URI (base64), return as-is
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }

  // If it's a base64 string without the data URI prefix, add it
  if (imagePath.length > 1000 && /^[A-Za-z0-9+/=]+$/.test(imagePath)) {
    return `data:image/jpeg;base64,${imagePath}`;
  }

  // If it's a file path, construct the full URL
  if (imagePath.startsWith('uploads/')) {
    return `${API_URL}/${imagePath}`;
  }

  // Fallback: assume it's a relative path and construct URL
  return `${API_URL}/uploads/${imagePath}`;
};

/**
 * Get profile picture URL
 * @param {Object} user - User object with profilePicture field
 * @returns {string|null} - Full URL or data URI, or null if no picture
 */
export const getProfilePictureUrl = (user) => {
  return user?.profilePicture ? getImageUrl(user.profilePicture) : null;
};

/**
 * Get ID image URLs
 * @param {Object} user - User object with ID image fields
 * @returns {Object} - Object with front and back image URLs
 */
export const getIdImageUrls = (user) => {
  return {
    front: user?.idFrontImage ? getImageUrl(user.idFrontImage) : null,
    back: user?.idBackImage ? getImageUrl(user.idBackImage) : null,
  };
};

export default {
  getImageUrl,
  getProfilePictureUrl,
  getIdImageUrls,
};
