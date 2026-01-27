const express = require('express');
const router = express.Router();
const {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getAllOrders,
    deleteOrder
} = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/admin.middleware');
const { orderValidation, objectIdValidation } = require('../middleware/validator.middleware');

// User routes
router.post('/', protect, orderValidation, createOrder);
router.get('/', protect, getUserOrders);
router.get('/:id', protect, objectIdValidation, getOrderById);
router.delete('/:id/cancel', protect, objectIdValidation, cancelOrder);
router.delete('/:id', protect, objectIdValidation, deleteOrder); // User can delete their own order history

// Admin routes
router.get('/admin/all', protect, authorize, getAllOrders);
router.patch('/:id/status', protect, authorize, objectIdValidation, updateOrderStatus);

module.exports = router;
