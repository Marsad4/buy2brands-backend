const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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

    // For pack orders
    packMultiplier: {
        type: Number,
        min: 1
    },
    hasDiscount: {
        type: Boolean,
        default: false
    },
    discountPercent: {
        type: Number,
        min: 0,
        max: 100
    },
    variations: [{
        size: String,
        color: String,
        quantity: Number
    }],
    itemCount: {
        type: Number // Total items in pack order
    },

    // For single variant orders
    size: String,
    color: String,
    quantity: {
        type: Number,
        required: true,
        min: 1
    },

    // Pricing
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: {
        type: [orderItemSchema],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'Order must have at least one item'
        }
    },

    // Order Details
    subtotal: {
        type: Number,
        min: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    shippingCost: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'pending'
    },

    // Shipping Info
    shippingAddress: {
        fullName: String,
        email: String,
        phone: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },

    // Payment Info
    paymentMethod: {
        type: String,
        enum: ['cod', 'card', 'bank_transfer', 'paypal'],
        default: 'cod'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },

    // Notes
    customerNotes: String,
    adminNotes: String,

    // Tracking
    trackingNumber: String,

    // Timestamps for status changes
    statusHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String
    }],

    // Stripe Payment Info
    stripePaymentIntent: String,
    stripeSessionId: String
}, {
    timestamps: true
});

// Auto-generate order ID
orderSchema.pre('save', async function (next) {
    if (!this.orderId) {
        // Find last order to increment ID correctly
        const lastOrder = await mongoose.model('Order').findOne({}, {}, { sort: { 'createdAt': -1 } });
        let newId = 1;

        if (lastOrder && lastOrder.orderId) {
            const lastIdNum = parseInt(lastOrder.orderId.split('-')[1]);
            if (!isNaN(lastIdNum)) {
                newId = lastIdNum + 1;
            }
        } else {
            const count = await mongoose.model('Order').countDocuments();
            newId = count + 1;
        }

        this.orderId = `ORD-${newId.toString().padStart(6, '0')}`;
    }

    // Add to status history
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date()
        });
    }

    next();
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
