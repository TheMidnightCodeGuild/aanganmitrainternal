// Image and video compression utilities
// WhatsApp-style compression for optimal file sizes

export const compressImage = (file, maxWidth = 1920, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions (WhatsApp-style)
        let { width, height } = img;
        
        // WhatsApp compression logic:
        // - If image is larger than 1920px in any dimension, scale down proportionally
        // - Maintain aspect ratio
        // - Use progressive quality reduction for very large images
        
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          } else {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }

        // Progressive quality reduction based on original size
        let finalQuality = quality;
        const originalSize = file.size;
        
        if (originalSize > 5 * 1024 * 1024) { // > 5MB
          finalQuality = 0.5;
        } else if (originalSize > 2 * 1024 * 1024) { // > 2MB
          finalQuality = 0.6;
        } else if (originalSize > 1024 * 1024) { // > 1MB
          finalQuality = 0.65;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with progressive quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new file with compressed data
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          finalQuality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const compressVideo = (file) => {
  return new Promise((resolve, reject) => {
    // For videos, we'll do basic validation and return the original file
    // Video compression requires more complex libraries like FFmpeg
    // For now, we'll just validate and return the original
    
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      // Basic video validation
      const duration = video.duration;
      const fileSize = file.size;
      
      // If video is too long (> 5 minutes) or too large (> 50MB), warn user
      if (duration > 300) { // 5 minutes
        console.warn('Video is longer than 5 minutes. Consider trimming for better performance.');
      }
      
      if (fileSize > 50 * 1024 * 1024) { // 50MB
        console.warn('Video file is large. Consider compressing for better upload performance.');
      }
      
      // Return original file for now
      resolve(file);
    };
    
    video.onerror = () => {
      // If video metadata can't be loaded, still return the file
      console.warn('Could not load video metadata, proceeding with original file');
      resolve(file);
    };
    
    video.src = URL.createObjectURL(file);
  });
};

export const getFileType = (file) => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'unknown';
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateFile = (file) => {
  const fileType = getFileType(file);
  
  // No size limits - let compression handle it
  if (fileType === 'unknown') {
    return { valid: false, error: 'Unsupported file type. Please select images or videos only.' };
  }
  
  // Basic format validation
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
  
  if (fileType === 'image' && !allowedImageTypes.includes(file.type)) {
    return { valid: false, error: 'Unsupported image format. Please use JPEG, PNG, WebP, or GIF.' };
  }
  
  if (fileType === 'video' && !allowedVideoTypes.includes(file.type)) {
    return { valid: false, error: 'Unsupported video format. Please use MP4, AVI, MOV, WMV, FLV, or WebM.' };
  }
  
  return { valid: true, error: null };
};

// WhatsApp-style compression settings
export const getCompressionSettings = (file) => {
  const fileType = getFileType(file);
  const fileSize = file.size;
  
  if (fileType === 'image') {
    // Progressive compression based on file size
    if (fileSize > 10 * 1024 * 1024) { // > 10MB
      return { maxWidth: 1600, quality: 0.4 };
    } else if (fileSize > 5 * 1024 * 1024) { // > 5MB
      return { maxWidth: 1800, quality: 0.5 };
    } else if (fileSize > 2 * 1024 * 1024) { // > 2MB
      return { maxWidth: 1920, quality: 0.6 };
    } else if (fileSize > 1024 * 1024) { // > 1MB
      return { maxWidth: 1920, quality: 0.7 };
    } else {
      return { maxWidth: 1920, quality: 0.8 };
    }
  }
  
  // For videos, return default settings
  return { maxWidth: 1920, quality: 0.7 };
}; 