const express = require('express');
const router = express.Router();

const {
    sendVerificationCode,
    verifyCode,
    resendCode
} = require('../controllers/verification.controller');

// Verification routes
router.post('/send', sendVerificationCode);
router.post('/verify', verifyCode);
router.post('/resend', resendCode);

module.exports = router;
