const cloudinary = require('cloudinary').v2;
const multer = require('multer');
require('dotenv').config();

// Debug Cloudinary config
if (!process.env.CLOUDINARY_API_KEY) {
    console.error('❌ Cloudinary API Key is missing in environment variables!');
} else {
    console.log('✅ Cloudinary config loaded with Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
}

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer memory storage for handling file uploads
const storage = multer.memoryStorage();

// File filter for images
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Multer upload configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

module.exports = {
    cloudinary,
    upload
};
