const mongoose = require('mongoose');

const shippingRuleSchema = new mongoose.Schema({
    minItems: {
        type: Number,
        required: true,
        min: 0
    },
    maxItems: {
        type: Number,
        default: null // null means unlimited
    },
    baseCost: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    costPerAdditionalItem: {
        type: Number,
        min: 0,
        default: 0
    },
    isFree: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const shippingStructureSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Shipping structure name is required'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    rules: {
        type: [shippingRuleSchema],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'Shipping structure must have at least one rule'
        }
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Ensure only one default structure
shippingStructureSchema.pre('save', async function (next) {
    if (this.isDefault && this.isModified('isDefault')) {
        await mongoose.model('ShippingStructure').updateMany(
            { _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    next();
});

// Index for faster lookups
shippingStructureSchema.index({ isActive: 1 });
shippingStructureSchema.index({ isDefault: 1 });

module.exports = mongoose.model('ShippingStructure', shippingStructureSchema);
