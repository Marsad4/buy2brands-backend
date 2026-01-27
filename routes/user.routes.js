const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    changePassword,
    getOrderHistory,
    getAllUsers,
    createUser,
    updateUserRole,
    deleteUser
} = require('../controllers/user.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// All user routes are protected
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);
router.get('/orders', protect, getOrderHistory);

// Admin only routes
router.get('/', protect, admin, getAllUsers);
router.post('/', protect, admin, createUser);
router.put('/:id/role', protect, admin, updateUserRole);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
