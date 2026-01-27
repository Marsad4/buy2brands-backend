const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    cartId: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    isPack: {
        type: Boolean,
        default: false
    },

    // For pack items
    packMultiplier: Number,
    hasDiscount: Boolean,
    discountPercent: Number,
    variations: [{
        size: String,
        color: String,
        quantity: Number
    }],
    itemCount: Number,

    // For single variant items
    size: String,
    color: String,
    quantity: {
        type: Number,
        required: true,
        min: 1
    },

    // Pricing
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: {
        type: [cartItemSchema],
        default: []
    },
    totalAmount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

// Calculate total before saving
cartSchema.pre('save', function (next) {
    this.totalAmount = this.items.reduce((sum, item) => {
        return sum + (item.totalPrice || 0);
    }, 0);
    next();
});

module.exports = mongoose.model('Cart', cartSchema);
