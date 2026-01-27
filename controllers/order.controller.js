const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const { sendMail } = require('../utils/email.service');
const {
    generateCustomerOrderEmail,
    generateAdminOrderEmail,
    generateCustomerCancellationEmail,
    generateAdminCancellationEmail
} = require('../utils/emailTemplates.util');

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = async (req, res, next) => {
    try {
        const { items, shippingAddress, paymentMethod, customerNotes } = req.body;

        // Calculate total
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.productId}`
                });
            }

            // Add product details to item
            orderItems.push({
                ...item,
                productName: product.name,
                brand: product.brand,
                unitPrice: product.unitPrice
            });

            totalAmount += item.totalPrice || 0;
        }

        console.log('📝 Creating order with calculated total:', totalAmount);
        console.log('📝 Items first priced:', orderItems[0]?.totalPrice);

        // Create order
        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            totalAmount,
            shippingAddress,
            paymentMethod: paymentMethod || 'cod',
            customerNotes
        });

        // Clear user's cart
        await Cart.findOneAndUpdate(
            { user: req.user._id },
            { items: [], totalAmount: 0 }
        );

        // Send email notifications (non-blocking)
        try {
            // Populate user details for email
            const populatedOrder = await Order.findById(order._id).populate('user', 'firstName lastName email companyName');

            // Send customer confirmation email
            const customerEmail = generateCustomerOrderEmail(populatedOrder, req.user);
            await sendMail({
                to: req.user.email,
                subject: customerEmail.subject,
                text: customerEmail.text,
                html: customerEmail.html
            });
            console.log(`✅ Order confirmation email sent to customer: ${req.user.email}`);

            // Send admin notification email
            const adminEmail = process.env.ADMIN_EMAIL || process.env.HOSTINGER_SMTP_USER;
            if (adminEmail) {
                const adminEmailContent = generateAdminOrderEmail(populatedOrder, req.user);
                await sendMail({
                    to: adminEmail,
                    subject: adminEmailContent.subject,
                    text: adminEmailContent.text,
                    html: adminEmailContent.html
                });
                console.log(`✅ Order notification email sent to admin: ${adminEmail}`);
            }

            // Real-time notification to admins
            const io = req.app.get('io');
            if (io) {
                io.to('admin_room').emit('newOrderReceived', {
                    order: populatedOrder,
                    user: req.user,
                    timestamp: new Date()
                });
            }

        } catch (emailError) {
            // Log email errors but don't block order creation
            console.error('❌ Error sending order emails or notifications:', emailError.message);
            console.error('Order created successfully but emails/notifications failed');
        }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: { order }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user's orders
 * @route   GET /api/orders
 * @access  Private
 */
const getUserOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const query = { user: req.user._id };

        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .sort('-createdAt')
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            count: orders.length,
            total: count,
            data: { orders }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single order
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email companyName');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user owns this order or is admin
        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this order'
            });
        }

        res.status(200).json({
            success: true,
            data: { order }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update order status
 * @route   PATCH /api/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = async (req, res, next) => {
    try {
        const { status, note } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.status = status;

        if (note) {
            order.adminNotes = note;
        }

        await order.save();

        // Real-time update via Socket.io
        const io = req.app.get('io');
        if (io) {
            // Notify specific user
            io.to(`user_${order.user}`).emit('orderStatusChanged', {
                orderId: order._id,
                status: status,
                timestamp: new Date()
            });

            // Notify all admins (to sync other admin dashboards)
            io.to('admin_room').emit('orderUpdated', {
                orderId: order._id,
                status: status,
                userId: order.user,
                updatedBy: req.user._id
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order status updated',
            data: { order }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cancel order
 * @route   DELETE /api/orders/:id/cancel
 * @access  Private
 */
const cancelOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user owns this order
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this order'
            });
        }

        // Can only cancel if pending or processing
        if (!['pending', 'processing'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel order at this stage'
            });
        }

        order.status = 'cancelled';
        await order.save();

        // Send cancellation email notifications (non-blocking)
        try {
            // Populate user details for email
            const populatedOrder = await Order.findById(order._id).populate('user', 'firstName lastName email companyName');

            // Send customer cancellation email
            const customerEmail = generateCustomerCancellationEmail(populatedOrder, req.user);
            await sendMail({
                to: req.user.email,
                subject: customerEmail.subject,
                text: customerEmail.text,
                html: customerEmail.html
            });
            console.log(`✅ Cancellation email sent to customer: ${req.user.email}`);

            // Send admin notification email
            const adminEmail = process.env.ADMIN_EMAIL || process.env.HOSTINGER_SMTP_USER;
            if (adminEmail) {
                const adminEmailContent = generateAdminCancellationEmail(populatedOrder, req.user);
                await sendMail({
                    to: adminEmail,
                    subject: adminEmailContent.subject,
                    text: adminEmailContent.text,
                    html: adminEmailContent.html
                });
                console.log(`✅ Cancellation notification sent to admin: ${adminEmail}`);
            }
        } catch (emailError) {
            // Log email errors but don't block cancellation
            console.error('❌ Error sending cancellation emails:', emailError.message);
            console.error('Order cancelled successfully but emails failed to send');
        }

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: { order }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/orders/all
 * @access  Private/Admin
 */
const getAllOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;

        const query = {};

        if (status) {
            query.status = status;
        }

        if (search) {
            query.orderId = new RegExp(search, 'i');
        }

        const orders = await Order.find(query)
            .populate('user', 'firstName lastName email companyName')
            .sort('-createdAt')
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            count: orders.length,
            total: count,
            data: { orders }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete order (Admin or User's own order)
 * @route   DELETE /api/orders/:id
 * @access  Private
 */
const deleteOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user owns this order or is admin
        if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this order'
            });
        }

        await Order.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Order deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getAllOrders,
    deleteOrder
};
