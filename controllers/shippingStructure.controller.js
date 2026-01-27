const ShippingStructure = require('../models/ShippingStructure.model');

/**
 * @desc    Get all shipping structures
 * @route   GET /api/shipping-structures
 * @access  Public
 */
const getAllShippingStructures = async (req, res, next) => {
    try {
        const structures = await ShippingStructure.find({ isActive: true })
            .sort({ isDefault: -1, name: 1 });

        res.status(200).json({
            success: true,
            data: { structures }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all shipping structures (admin - includes inactive)
 * @route   GET /api/shipping-structures/admin/all
 * @access  Private/Admin
 */
const getAllShippingStructuresAdmin = async (req, res, next) => {
    try {
        const structures = await ShippingStructure.find()
            .sort({ isDefault: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            data: { structures }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single shipping structure
 * @route   GET /api/shipping-structures/:id
 * @access  Public
 */
const getShippingStructure = async (req, res, next) => {
    try {
        const structure = await ShippingStructure.findById(req.params.id);

        if (!structure) {
            return res.status(404).json({
                success: false,
                message: 'Shipping structure not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { structure }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create shipping structure
 * @route   POST /api/shipping-structures
 * @access  Private/Admin
 */
const createShippingStructure = async (req, res, next) => {
    try {
        const { name, description, rules, isDefault, isActive } = req.body;

        // Validate rules
        if (!rules || rules.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one shipping rule is required'
            });
        }

        // Sort rules by minItems
        const sortedRules = rules.sort((a, b) => a.minItems - b.minItems);

        // Validate rule ranges don't overlap
        for (let i = 0; i < sortedRules.length - 1; i++) {
            const current = sortedRules[i];
            const next = sortedRules[i + 1];
            
            if (current.maxItems !== null && current.maxItems >= next.minItems) {
                return res.status(400).json({
                    success: false,
                    message: `Rule ranges overlap: Rule ${i + 1} maxItems (${current.maxItems}) must be less than Rule ${i + 2} minItems (${next.minItems})`
                });
            }
        }

        const structure = await ShippingStructure.create({
            name,
            description,
            rules: sortedRules,
            isDefault: isDefault || false,
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            success: true,
            message: 'Shipping structure created successfully',
            data: { structure }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Shipping structure with this name already exists'
            });
        }
        next(error);
    }
};

/**
 * @desc    Update shipping structure
 * @route   PUT /api/shipping-structures/:id
 * @access  Private/Admin
 */
const updateShippingStructure = async (req, res, next) => {
    try {
        const { name, description, rules, isDefault, isActive } = req.body;

        const structure = await ShippingStructure.findById(req.params.id);

        if (!structure) {
            return res.status(404).json({
                success: false,
                message: 'Shipping structure not found'
            });
        }

        // If rules are being updated, validate them
        if (rules && rules.length > 0) {
            const sortedRules = rules.sort((a, b) => a.minItems - b.minItems);

            // Validate rule ranges
            for (let i = 0; i < sortedRules.length - 1; i++) {
                const current = sortedRules[i];
                const next = sortedRules[i + 1];
                
                if (current.maxItems !== null && current.maxItems >= next.minItems) {
                    return res.status(400).json({
                        success: false,
                        message: `Rule ranges overlap: Rule ${i + 1} maxItems (${current.maxItems}) must be less than Rule ${i + 2} minItems (${next.minItems})`
                    });
                }
            }

            structure.rules = sortedRules;
        }

        if (name !== undefined) structure.name = name;
        if (description !== undefined) structure.description = description;
        if (isDefault !== undefined) structure.isDefault = isDefault;
        if (isActive !== undefined) structure.isActive = isActive;

        await structure.save();

        res.status(200).json({
            success: true,
            message: 'Shipping structure updated successfully',
            data: { structure }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Shipping structure with this name already exists'
            });
        }
        next(error);
    }
};

/**
 * @desc    Delete shipping structure
 * @route   DELETE /api/shipping-structures/:id
 * @access  Private/Admin
 */
const deleteShippingStructure = async (req, res, next) => {
    try {
        const structure = await ShippingStructure.findById(req.params.id);

        if (!structure) {
            return res.status(404).json({
                success: false,
                message: 'Shipping structure not found'
            });
        }

        // Check if it's being used by any products
        const Product = require('../models/Product.model');
        const productsUsingStructure = await Product.countDocuments({
            shippingStructure: structure._id
        });

        if (productsUsingStructure > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete shipping structure. It is being used by ${productsUsingStructure} product(s). Please update those products first.`
            });
        }

        await structure.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Shipping structure deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Calculate shipping cost based on structure and item count
 * @route   POST /api/shipping-structures/:id/calculate
 * @access  Public
 */
const calculateShippingCost = async (req, res, next) => {
    try {
        const { itemCount } = req.body;
        const structure = await ShippingStructure.findById(req.params.id);

        if (!structure) {
            return res.status(404).json({
                success: false,
                message: 'Shipping structure not found'
            });
        }

        if (!itemCount || itemCount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid item count is required'
            });
        }

        // Find applicable rule
        let applicableRule = null;
        for (const rule of structure.rules) {
            if (itemCount >= rule.minItems) {
                if (rule.maxItems === null || itemCount <= rule.maxItems) {
                    applicableRule = rule;
                    break;
                }
            }
        }

        // If no rule found, use the last rule (highest minItems)
        if (!applicableRule && structure.rules.length > 0) {
            applicableRule = structure.rules[structure.rules.length - 1];
        }

        let shippingCost = 0;

        if (applicableRule) {
            if (applicableRule.isFree) {
                shippingCost = 0;
            } else {
                shippingCost = applicableRule.baseCost;
                
                // Add cost for additional items beyond minItems
                if (applicableRule.costPerAdditionalItem > 0 && itemCount > applicableRule.minItems) {
                    const additionalItems = itemCount - applicableRule.minItems;
                    shippingCost += additionalItems * applicableRule.costPerAdditionalItem;
                }
            }
        }

        res.status(200).json({
            success: true,
            data: {
                shippingCost,
                rule: applicableRule,
                itemCount
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllShippingStructures,
    getAllShippingStructuresAdmin,
    getShippingStructure,
    createShippingStructure,
    updateShippingStructure,
    deleteShippingStructure,
    calculateShippingCost
};
