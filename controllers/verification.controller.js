const VerificationCode = require('../models/VerificationCode.model');
const { sendMail } = require('../utils/email.service');
const { generateVerificationEmail } = require('../utils/emailTemplates.util');

// Generate random 6-digit code
const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Send verification code to email
// @route   POST /api/verification/send
// @access  Public
exports.sendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check rate limiting - max 3 codes per hour per email
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentCodes = await VerificationCode.countDocuments({
            email: email.toLowerCase(),
            createdAt: { $gte: oneHourAgo }
        });

        if (recentCodes >= 3) {
            return res.status(429).json({
                success: false,
                message: 'Too many verification requests. Please try again later.'
            });
        }

        // Generate code and set expiry (15 minutes)
        const code = generateCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Create verification code
        const verificationCode = await VerificationCode.create({
            email: email.toLowerCase(),
            code,
            expiresAt
        });

        // Send email
        try {
            const emailContent = generateVerificationEmail(code);
            await sendMail({
                to: email,
                subject: emailContent.subject,
                text: emailContent.text,
                html: emailContent.html
            });

            console.log(`✅ Verification code sent to: ${email}`);
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // Delete the code if email fails
            await VerificationCode.deleteOne({ _id: verificationCode._id });

            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email. Please try again.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Verification code sent to your email',
            expiresAt
        });
    } catch (error) {
        console.error('Send verification code error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send verification code'
        });
    }
};

// @desc    Verify code
// @route   POST /api/verification/verify
// @access  Public
exports.verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email and code are required'
            });
        }

        // Find verification code
        const verification = await VerificationCode.findOne({
            email: email.toLowerCase(),
            verified: false
        }).sort({ createdAt: -1 }); // Get most recent

        if (!verification) {
            return res.status(404).json({
                success: false,
                message: 'No verification code found. Please request a new one.'
            });
        }

        // Check if expired
        if (new Date() > verification.expiresAt) {
            await VerificationCode.deleteOne({ _id: verification._id });
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired. Please request a new one.'
            });
        }

        // Check attempts limit
        if (verification.attempts >= 5) {
            await VerificationCode.deleteOne({ _id: verification._id });
            return res.status(400).json({
                success: false,
                message: 'Too many failed attempts. Please request a new code.'
            });
        }

        // Verify code
        if (verification.code !== code) {
            verification.attempts += 1;
            await verification.save();

            return res.status(400).json({
                success: false,
                message: `Invalid code. ${5 - verification.attempts} attempts remaining.`
            });
        }

        // Mark as verified
        verification.verified = true;
        await verification.save();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('Verify code error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to verify code'
        });
    }
};

// @desc    Resend verification code
// @route   POST /api/verification/resend
// @access  Public
exports.resendCode = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Use the same send logic
        return exports.sendVerificationCode(req, res);
    } catch (error) {
        console.error('Resend code error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to resend code'
        });
    }
};
