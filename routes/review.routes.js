const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

// Import controller
const {
    createReview,
    getProductReviews,
    updateReview,
    deleteReview,
    getUserReviews
} = require('../controllers/review.controller');

// Product reviews routes
router.post('/products/:productId/reviews', protect, createReview);
router.get('/products/:productId/reviews', getProductReviews);

// Individual review routes
router.get('/reviews/user', protect, getUserReviews); // Get logged-in user's reviews
router.put('/reviews/:reviewId', protect, updateReview);
router.delete('/reviews/:reviewId', protect, deleteReview);

module.exports = router;
