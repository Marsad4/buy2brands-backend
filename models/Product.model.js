const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    size: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    sku: {
        type: String,
        trim: true,
        sparse: true // Allows multiple null values but ensures uniqueness when present
    },
    unitPrice: {
        type: Number,
        required: false,
        min: 0
    }
}, { _id: false });

const packVariationSchema = new mongoose.Schema({
    size: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: false });

const packConfigSchema = new mongoose.Schema({
    enabled: {
        type: Boolean,
        default: false
    },
    discountPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    variations: [packVariationSchema]
}, { _id: false });

const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    publicId: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    brand: {
        type: String,
        required: [true, 'Brand is required'],
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    subcategory: {
        type: String,
        trim: true
    },
    gender: {
        type: String,
        trim: true
    },
    onSale: {
        type: Boolean,
        default: false
    },
    sku: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    image: {
        type: String,
        required: false // Made optional for backward compatibility
    },
    images: {
        type: [imageSchema],
        default: []
    },
    unitPrice: {
        type: Number,
        required: [true, 'Unit price is required'],
        min: 0
    },
    description: {
        type: String,
        trim: true
    },
    variants: {
        type: [variantSchema],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'Product must have at least one variant'
        }
    },
    packConfig: {
        type: packConfigSchema,
        default: () => ({ enabled: false, discountPercent: 0, variations: [] })
    },
    category: {
        type: String,
        trim: true
    },
    taxPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    shippingStructure: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShippingStructure',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0,
        min: 0
    },
    sizeChart: {
        type: {
            type: String,
            enum: ['table', 'image'],
            default: 'table'
        },
        // For table-based size charts
        columns: [{
            type: String,
            trim: true
        }],
        rows: [{
            type: Map,
            of: String
        }],
        // For image-based size charts
        imageUrl: {
            type: String,
            trim: true
        },
        imagePublicId: {
            type: String,
            trim: true
        }
    }
}, {
    timestamps: true
});

// Auto-generate SKU if not provided
productSchema.pre('save', function (next) {
    if (!this.sku) {
        const brandPrefix = this.brand.substring(0, 3).toUpperCase();
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.sku = `${brandPrefix}-${randomNum}`;
    }

    // Sync image field with featured image from images array for backward compatibility
    if (this.images && this.images.length > 0) {
        console.log('🔄 Syncing product image from images array:', this.images.length, 'images found');
        const featuredImage = this.images.find(img => img.isFeatured) || this.images[0];
        this.image = featuredImage.url;
        console.log('✅ Set product.image to:', this.image);
    } else {
        console.log('⚠️ No images found in images array, product.image remains:', this.image);
    }

    next();
});

// Index for search
productSchema.index({ name: 'text', brand: 'text', description: 'text' });
productSchema.index({ brand: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);

