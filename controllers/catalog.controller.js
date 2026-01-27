const Catalog = require('../models/Catalog.model');
const Product = require('../models/Product.model');

/**
 * @desc    Get all catalog items grouped by type
 * @route   GET /api/catalog
 * @access  Private
 */
const getAllCatalog = async (req, res, next) => {
    try {
        const items = await Catalog.find({ isActive: true }).sort('type name');

        // Group by type
        const grouped = {
            brands: items.filter(i => i.type === 'brand'),
            categories: items.filter(i => i.type === 'category'),
            subcategories: items.filter(i => i.type === 'subcategory'),
            genders: items.filter(i => i.type === 'gender'),
            sales: items.filter(i => i.type === 'sale')
        };

        res.status(200).json({
            success: true,
            data: grouped
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create catalog item
 * @route   POST /api/catalog
 * @access  Private/Admin
 */
const createCatalogItem = async (req, res, next) => {
    try {
        const { type, name, parentId, discount } = req.body;

        if (!type || !name) {
            return res.status(400).json({
                success: false,
                message: 'Type and name are required'
            });
        }

        const item = await Catalog.create({
            type,
            name,
            parentId: parentId || null,
            discount: discount || 0
        });

        res.status(201).json({
            success: true,
            message: 'Catalog item created successfully',
            data: { item }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'This item already exists'
            });
        }
        next(error);
    }
};

/**
 * @desc    Update catalog item
 * @route   PUT /api/catalog/:id
 * @access  Private/Admin
 */
const updateCatalogItem = async (req, res, next) => {
    try {
        const { name, discount, isActive } = req.body;

        const item = await Catalog.findByIdAndUpdate(
            req.params.id,
            { name, discount, isActive },
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Catalog item not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Catalog item updated successfully',
            data: { item }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete catalog item
 * @route   DELETE /api/catalog/:id
 * @access  Private/Admin
 */
const deleteCatalogItem = async (req, res, next) => {
    try {
        const item = await Catalog.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Catalog item not found'
            });
        }

        // Check if item is in use by products
        const productCount = await Product.countDocuments({
            $or: [
                { brand: item.name },
                { category: item.name },
                { subcategory: item.name },
                { gender: item.name },
                { sale: item._id }
            ]
        });

        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete. This item is used by ${productCount} product(s)`
            });
        }

        await item.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Catalog item deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllCatalog,
    createCatalogItem,
    updateCatalogItem,
    deleteCatalogItem
};
