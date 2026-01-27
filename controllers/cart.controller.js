const Product = require('../models/Product.model');
const Cart = require('../models/Cart.model');

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = async (req, res, next) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id }).populate({
            path: 'items.productId',
            select: 'name brand unitPrice image shippingStructure',
            populate: {
                path: 'shippingStructure',
                select: 'name rules isDefault'
            }
        });

        if (!cart) {
            cart = await Cart.create({
                user: req.user._id,
                items: [],
                totalAmount: 0
            });
        }

        res.status(200).json({
            success: true,
            data: { cart }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/add
 * @access  Private
 */
const addToCart = async (req, res, next) => {
    try {
        const payload = req.body;
        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = new Cart({
                user: req.user._id,
                items: []
            });
        }

        // Helper function to process a single item addition
        const processItem = (item) => {
            // Generate unique cart ID if not provided
            const cartId = item.cartId || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

            // Build cart key for merging logic
            const buildCartKey = (i) => {
                if (i.isPack) {
                    return `pack::${i.productName}::multiplier=${i.packMultiplier}::discount=${!!i.hasDiscount}`;
                }
                return `single::${i.productName}::size=${i.size}::color=${i.color}`;
            };

            const key = buildCartKey(item);
            const existingItemIndex = cart.items.findIndex(i => i.key === key);

            if (existingItemIndex >= 0) {
                // Merge quantities and prices
                cart.items[existingItemIndex].quantity += item.quantity || 0;
                cart.items[existingItemIndex].totalPrice += item.totalPrice || 0;

                if (item.isPack) {
                    cart.items[existingItemIndex].packMultiplier += item.packMultiplier || 0;
                }
            } else {
                // Add new item
                cart.items.push({
                    ...item,
                    cartId,
                    key
                });
            }
        };

        // Check if we have variations (Bulk Add) AND it's not a pre-configured pack
        if (!payload.isPack && payload.variations && Array.isArray(payload.variations)) {
            // Need to fetch product to get unit price ensures accuracy
            const product = await Product.findById(payload.productId);

            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            for (const variant of payload.variations) {
                if (variant.quantity > 0) {
                    const itemTotalPrice = product.unitPrice * variant.quantity;

                    const itemToAdd = {
                        productId: payload.productId,
                        productName: payload.productName,
                        brand: payload.brand,
                        isPack: false,
                        size: variant.size,
                        color: variant.color,
                        quantity: variant.quantity,
                        totalPrice: itemTotalPrice,
                        // Add image if available in product
                        image: product.image
                    };
                    processItem(itemToAdd);
                }
            }
        } else {
            // Single Item Add (Existing Logic)
            processItem(payload);
        }

        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Item added to cart',
            data: { cart }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/update
 * @access  Private
 */
const updateCartItem = async (req, res, next) => {
    try {
        const { cartId, quantity } = req.body;

        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(item => item.cartId === cartId);

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        if (quantity < 1) {
            // Remove item
            cart.items.splice(itemIndex, 1);
        } else {
            // Update quantity and price
            const item = cart.items[itemIndex];
            const unitPrice = item.totalPrice / item.quantity;
            item.quantity = quantity;
            item.totalPrice = unitPrice * quantity;
        }

        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Cart updated',
            data: { cart }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/remove/:cartId
 * @access  Private
 */
const removeFromCart = async (req, res, next) => {
    try {
        const { cartId } = req.params;

        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = cart.items.filter(item => item.cartId !== cartId);
        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            data: { cart }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart/clear
 * @access  Private
 */
const clearCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Cart cleared',
            data: { cart }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};
