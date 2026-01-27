const express = require('express');
const router = express.Router();
const {
    signup,
    login,
    getMe,
    logout,
    refreshToken,
    resetPassword
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { signupValidation, loginValidation } = require('../middleware/validator.middleware');

// Public routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshToken);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
