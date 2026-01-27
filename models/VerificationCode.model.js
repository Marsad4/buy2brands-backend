const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        index: true
    },
    code: {
        type: String,
        required: [true, 'Verification code is required'],
        length: 6
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index - automatically delete when expired
    },
    verified: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 0,
        max: 5 // Max 5 verification attempts
    }
}, {
    timestamps: true
});

// Index for faster lookups
verificationCodeSchema.index({ email: 1, verified: 1 });

// Delete old codes for same email before saving new one
verificationCodeSchema.pre('save', async function (next) {
    if (this.isNew) {
        await mongoose.model('VerificationCode').deleteMany({
            email: this.email,
            verified: false
        });
    }
    next();
});

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);
