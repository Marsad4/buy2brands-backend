const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: String,
        required: [true, 'Order ID is required']
    },
    reason: {
        type: String,
        required: [true, 'Return reason is required'],
        enum: ['Damaged', 'Wrong Item', 'Size Issue', 'Other']
    },
    message: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending'
    },
    adminResponse: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);
