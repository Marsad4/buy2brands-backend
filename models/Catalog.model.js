const mongoose = require('mongoose');

const catalogSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['brand', 'category', 'subcategory', 'gender', 'sale'],
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    // For subcategories - reference to parent category
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Catalog',
        default: null
    },
    // For sales - discount percentage
    discount: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for type + name + parentId uniqueness
catalogSchema.index({ type: 1, name: 1, parentId: 1 }, { unique: true });

// Index for active items
catalogSchema.index({ isActive: 1 });

module.exports = mongoose.model('Catalog', catalogSchema);
