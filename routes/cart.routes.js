const express = require('express');
const router = express.Router();
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

// All cart routes are protected
router.get('/', protect, getCart);
router.post('/add', protect, addToCart);
router.put('/update', protect, updateCartItem);
router.delete('/remove/:cartId', protect, removeFromCart);
router.delete('/clear', protect, clearCart);

module.exports = router;
