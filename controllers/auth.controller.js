const User = require('../models/User.model');
const { generateToken, generateRefreshToken } = require('../utils/jwt.util');
const VerificationCode = require('../models/VerificationCode.model');

/**
 * @desc    Register new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, companyName, ...otherData } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create new user
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            companyName,
            ...otherData
        });

        // Generate tokens
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Remove password from response
        user.password = undefined;

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user,
                token,
                refreshToken
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if user exists and get password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Verify password
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Remove password from response
        user.password = undefined;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user,
                token,
                refreshToken
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: { user }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
    try {
        // In a real app, you might want to blacklist the token
        // For now, just send success response
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = verifyToken(token);

        if (decoded.type !== 'refresh') {
            return res.status(400).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Generate new access token
        const newToken = generateToken(decoded.id);

        res.status(200).json({
            success: true,
            data: { token: newToken }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // 1. Verify the code is valid and verified
        const verification = await VerificationCode.findOne({
            email: email.toLowerCase(),
            code,
            verified: true
        });

        if (!verification) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification code. Please verify email first.'
            });
        }

        // 2. Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // 3. Update password
        user.password = newPassword;
        await user.save();

        // 4. Delete verification code
        await VerificationCode.deleteOne({ _id: verification._id });

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    signup,
    login,
    getMe,
    logout,
    refreshToken,
    resetPassword
};
