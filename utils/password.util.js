const bcrypt = require('bcryptjs');

/**
 * Hash password
 */
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 */
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

/**
 * Validate password strength
 */
const validatePasswordStrength = (password) => {
    // At least 6 characters, 1 uppercase, 1 lowercase, 1 number
    const minLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return minLength && hasUpperCase && hasLowerCase && hasNumber;
};

module.exports = {
    hashPassword,
    comparePassword,
    validatePasswordStrength
};
