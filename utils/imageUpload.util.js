const { cloudinary } = require('../config/cloudinary.config');
const streamifier = require('streamifier');

/**
 * Upload a single image buffer to Cloudinary
 * @param {Buffer} fileBuffer - The image file buffer
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Object>} - Upload result with url and publicId
 */
const uploadToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'image',
                transformation: [
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id
                    });
                }
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};

/**
 * Upload multiple product images
 * @param {Array} files - Array of file objects from multer
 * @returns {Promise<Array>} - Array of upload results
 */
const uploadProductImages = async (files) => {
    try {
        const uploadPromises = files.map((file, index) => {
            return uploadToCloudinary(file.buffer, 'exceliensparks/products').then(result => ({
                ...result,
                order: index,
                isFeatured: index === 0 // First image is featured by default
            }));
        });

        return await Promise.all(uploadPromises);
    } catch (error) {
        throw new Error(`Failed to upload product images: ${error.message}`);
    }
};

/**
 * Upload size chart image
 * @param {Object} file - File object from multer
 * @returns {Promise<Object>} - Upload result with url and publicId
 */
const uploadSizeChartImage = async (file) => {
    try {
        const result = await uploadToCloudinary(file.buffer, 'exceliensparks/size_charts');
        return result;
    } catch (error) {
        throw new Error(`Failed to upload size chart image: ${error.message}`);
    }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Deletion result
 */
const deleteCloudinaryImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new Error(`Failed to delete image: ${error.message}`);
    }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array} publicIds - Array of Cloudinary public IDs
 * @returns {Promise<Array>} - Array of deletion results
 */
const deleteMultipleImages = async (publicIds) => {
    try {
        const deletePromises = publicIds.map(publicId => deleteCloudinaryImage(publicId));
        return await Promise.all(deletePromises);
    } catch (error) {
        throw new Error(`Failed to delete multiple images: ${error.message}`);
    }
};

/**
 * Validate image file
 * @param {Object} file - File object from multer
 * @returns {boolean} - True if valid
 */
const validateImageFile = (file) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
    }

    if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB.');
    }

    return true;
};

module.exports = {
    uploadProductImages,
    uploadSizeChartImage,
    deleteCloudinaryImage,
    deleteMultipleImages,
    validateImageFile
};
