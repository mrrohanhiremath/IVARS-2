// Cloudinary Image Optimization Helper
export const optimizeCloudinaryUrl = (url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  crop?: 'fill' | 'fit' | 'scale';
} = {}) => {
  if (!url || !url.includes('cloudinary')) return url;

  const {
    width = 800,
    height,
    quality = 80,
    format = 'auto',
    crop = 'fill'
  } = options;

  // Build transformation string
  const transformations = [];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  if (crop) transformations.push(`c_${crop}`);
  
  // Add fetch format and quality optimizations
  transformations.push('f_auto'); // Auto format (WebP for supported browsers)
  transformations.push('q_auto'); // Auto quality
  
  const transformString = transformations.join(',');

  // Insert transformation into Cloudinary URL
  return url.replace('/upload/', `/upload/${transformString}/`);
};

// Generate thumbnail URL
export const getCloudinaryThumbnail = (url: string) => {
  return optimizeCloudinaryUrl(url, {
    width: 200,
    height: 200,
    quality: 60,
    crop: 'fill'
  });
};

// Generate responsive image URLs
export const getCloudinaryResponsive = (url: string) => {
  return {
    thumbnail: optimizeCloudinaryUrl(url, { width: 200, height: 200 }),
    small: optimizeCloudinaryUrl(url, { width: 400 }),
    medium: optimizeCloudinaryUrl(url, { width: 800 }),
    large: optimizeCloudinaryUrl(url, { width: 1200 }),
  };
};
