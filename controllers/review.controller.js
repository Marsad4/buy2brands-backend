const Review = require('../models/Review.model');
const Product = require('../models/Product.model');

// Helper function to update product rating stats
const updateProductRating = async (productId) => {
    try {
        const reviews = await Review.find({ product: productId });

        if (reviews.length === 0) {
            await Product.findByIdAndUpdate(productId, {
                averageRating: 0,
                reviewCount: 0
            });
            return;
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        await Product.findByIdAndUpdate(productId, {
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            reviewCount: reviews.length
        });
    } catch (error) {
        console.error('Error updating product rating:', error);
    }
};

// @desc    Create a new review
// @route   POST /api/products/:productId/reviews
// @access  Private
exports.createReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user._id || req.user.id;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({ user: userId, product: productId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product. You can update your existing review.'
            });
        }

        // Create review
        const review = await Review.create({
            user: userId,
            product: productId,
            rating,
            comment
        });

        // Populate user details
        await review.populate('user', 'firstName lastName email');

        // Update product rating
        await updateProductRating(productId);

        res.status(201).json({
            success: true,
            data: { review },
            message: 'Review created successfully'
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create review'
        });
    }
};

// @desc    Get all reviews for a product
// @route   GET /api/products/:productId/reviews
// @access  Public
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        const reviews = await Review.find({ product: productId })
            .sort({ createdAt: -1 }); // Newest first

        res.status(200).json({
            success: true,
            data: { reviews, count: reviews.length }
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch reviews'
        });
    }
};

// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
// @access  Private
exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user._id || req.user.id;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user owns this review
        // Handle both populated user object and user ID
        const reviewUserId = review.user._id || review.user;
        if (reviewUserId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own reviews'
            });
        }

        review.rating = rating || review.rating;
        review.comment = comment || review.comment;
        await review.save();

        await review.populate('user', 'firstName lastName email');

        // Update product rating
        await updateProductRating(review.product);

        res.status(200).json({
            success: true,
            data: { review },
            message: 'Review updated successfully'
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update review'
        });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id || req.user.id;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user owns this review
        // Handle both populated user object and user ID
        const reviewUserId = review.user._id || review.user;
        if (reviewUserId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own reviews'
            });
        }

        const productId = review.product;
        await review.deleteOne();

        // Update product rating
        await updateProductRating(productId);

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete review'
        });
    }
};

// @desc    Get all reviews by logged-in user
// @route   GET /api/reviews/user
// @access  Private
exports.getUserReviews = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const reviews = await Review.find({ user: userId })
            .populate('product', 'name image images averageRating reviewCount')
            .sort({ createdAt: -1 }); // Newest first

        res.status(200).json({
            success: true,
            data: { reviews, count: reviews.length }
        });
    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch user reviews'
        });
    }
};
