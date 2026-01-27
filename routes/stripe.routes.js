const express = require('express');
const router = express.Router();
const {
    createPaymentIntent,
    confirmPayment,
    createCheckoutSession,
    verifySession,
    handleWebhook
} = require('../controllers/stripe.controller');
const { protect } = require('../middleware/auth.middleware');

// Payment Intent for embedded payment (NEW)
router.post('/create-payment-intent', protect, createPaymentIntent);

// Confirm payment after successful Payment Intent (NEW)
router.post('/confirm-payment', protect, confirmPayment);

// Create checkout session (protected route - OLD METHOD)
router.post('/create-checkout-session', protect, createCheckoutSession);

// Verify session and create order (protected route, for local development)
router.get('/verify-session/:sessionId', protect, verifySession);

// Webhook endpoint (public, verified via Stripe signature)
// Note: This route needs raw body, configured in server.js
router.post('/webhook', handleWebhook);

module.exports = router;
