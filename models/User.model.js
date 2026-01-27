const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Authentication
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },

    // Personal Info
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    contactNumber: {
        type: String,
        trim: true
    },

    // Business Info
    companyName: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    businessDescription: {
        type: String,
        trim: true
    },
    businessType: {
        type: String,
        enum: ['shop', 'store_chain', 'factory', 'warehouse', 'mall', 'department_store', 'other'],
        default: 'shop'
    },
    numberOfStores: {
        type: Number,
        default: 1,
        min: 1
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'kids', 'unisex'],
        default: 'unisex'
    },
    categories: [{
        type: String,
        enum: ['clothing', 'shoes', 'accessories', 'sportswear', 'formal', 'casual', 'other']
    }],

    // Addresses
    billingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    dispatchingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },

    // Preferences
    contactPreferences: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        smsNotifications: {
            type: Boolean,
            default: false
        },
        promotionalEmails: {
            type: Boolean,
            default: true
        }
    },

    // User Role
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    // Status
    isActive: {
        type: Boolean,
        default: true
    },

    // Timestamps
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
