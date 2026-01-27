const { body, param, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

/**
 * Validation rules for user signup
 */
const signupValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required'),
    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required'),
    body('companyName')
        .trim()
        .notEmpty()
        .withMessage('Company name is required'),
    validate
];

/**
 * Validation rules for user login
 */
const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    validate
];

/**
 * Validation rules for product creation
 */
const productValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Product name is required'),
    body('brand')
        .trim()
        .notEmpty()
        .withMessage('Brand is required'),
    body('unitPrice')
        .isFloat({ min: 0 })
        .withMessage('Unit price must be a positive number'),
    body('variants')
        .isArray({ min: 1 })
        .withMessage('At least one variant is required'),
    validate
];

/**
 * Validation rules for order creation
 */
const orderValidation = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    body('shippingAddress.fullName')
        .trim()
        .notEmpty()
        .withMessage('Full name is required'),
    body('shippingAddress.email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('shippingAddress.phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required'),
    validate
];

/**
 * Validation for MongoDB ObjectId
 */
const objectIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid ID format'),
    validate
];

module.exports = {
    validate,
    signupValidation,
    loginValidation,
    productValidation,
    orderValidation,
    objectIdValidation
};
