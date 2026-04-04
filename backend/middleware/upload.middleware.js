import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

// Use memory storage for buffer-based uploads to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/**
 * Helper to upload a buffer to Cloudinary
 * @param {Buffer} buffer 
 * @param {string} folder 
 */
export const uploadToCloudinary = (buffer, folder = 'money_mentor') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

export default upload;
