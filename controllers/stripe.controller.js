require('dotenv').config();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const { sendMail } = require('../utils/email.service');
const {
    generateCustomerOrderEmail,
    generateAdminOrderEmail
} = require('../utils/emailTemplates.util');

/**
 * @desc    Create Payment Intent for embedded payment
 * @route   POST /api/stripe/create-payment-intent
 * @access  Private
 */
const createPaymentIntent = async (req, res) => {
    try {
        const { items, shippingAddress, tax = 0, shipping = 0 } = req.body;

        console.log('💳 Creating Payment Intent...');
        console.log('📦 Items:', items?.length || 0);

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Calculate total amount
        let totalAmount = 0;
        for (const item of items) {
            totalAmount += item.totalPrice || 0;
        }

        // Add tax and shipping
        totalAmount += (Number(tax) + Number(shipping));

        console.log('💰 Total amount (inc. tax/shipping):', totalAmount);

        // Create Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100), // Convert to pence
            currency: 'gbp',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId: req.user._id.toString(),
                fullName: shippingAddress.fullName,
                phone: shippingAddress.phone,
                address: shippingAddress.address,
                city: shippingAddress.city,
                state: shippingAddress.state,
                zipCode: shippingAddress.zipCode,
                country: shippingAddress.country,
                city: shippingAddress.city,
                state: shippingAddress.state,
                zipCode: shippingAddress.zipCode,
                country: shippingAddress.country,
                totalItems: items.length.toString(),
                tax: tax.toString(),
                shipping: shipping.toString()
            }
        });

        console.log('✅ Payment Intent created:', paymentIntent.id);

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error) {
        console.error('❌ Error creating payment intent:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create payment intent'
        });
    }
};

/**
 * @desc    Confirm payment and create order
 * @route   POST /api/stripe/confirm-payment
 * @access  Private
 */
const confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        console.log('✅ Confirming payment:', paymentIntentId);

        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        console.log('Payment status:', paymentIntent.status);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
                success: false,
                message: 'Payment not completed'
            });
        }

        // Check if order already exists (prevent duplicate creation)
        const existingOrder = await Order.findOne({ stripePaymentIntent: paymentIntentId })
            .populate('user', 'firstName lastName email companyName')
            .lean();
        if (existingOrder) {
            console.log('✅ Order already exists:', existingOrder.orderId);
            return res.json({
                success: true,
                order: existingOrder,
                message: 'Order already created'
            });
        }

        // Get user ID from payment intent metadata
        const userId = paymentIntent.metadata.userId;

        // Fetch user's cart
        const userCart = await Cart.findOne({ user: userId });

        if (!userCart || !userCart.items || userCart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No cart found'
            });
        }

        // Build shipping address from metadata
        const shippingAddress = {
            fullName: paymentIntent.metadata.fullName,
            email: req.user.email,
            phone: paymentIntent.metadata.phone,
            street: paymentIntent.metadata.address,
            city: paymentIntent.metadata.city,
            state: paymentIntent.metadata.state,
            zipCode: paymentIntent.metadata.zipCode,
            country: paymentIntent.metadata.country
        };

        // Prepare order items
        let totalAmount = 0;
        const orderItems = [];

        for (const item of userCart.items) {
            const product = await Product.findById(item.productId);

            if (product) {
                orderItems.push({
                    productId: item.productId,
                    productName: item.productName || product.name,
                    brand: item.brand || product.brand,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    totalPrice: item.totalPrice,
                    unitPrice: item.unitPrice || product.unitPrice,
                    isPack: item.isPack,
                    packMultiplier: item.packMultiplier,
                    itemCount: item.itemCount,
                    itemCount: item.itemCount,
                    hasDiscount: item.hasDiscount,
                    discountPercent: item.discountPercent,
                    variations: item.variations
                });

                totalAmount += item.totalPrice || 0;
            }
        }

        // Debug logging
        console.log('📝 Creating order with data:');
        console.log('Shipping Address:', JSON.stringify(shippingAddress, null, 2));
        console.log('Order Items ID 0:', orderItems[0] ? orderItems[0].productId : 'No items');

        // Create order with transaction-like error handling
        let order;
        try {
            order = await Order.create({
                user: userId,
                items: orderItems,
                totalAmount,
                subtotal: totalAmount, // The loop sums up item prices which is subtotal
                tax: Number(paymentIntent.metadata.tax || 0),
                shippingCost: Number(paymentIntent.metadata.shipping || 0),
                shippingAddress,
                paymentMethod: 'card',
                paymentStatus: 'completed',
                stripePaymentIntent: paymentIntentId
            });

            // Recalculate total with tax/shipping for accuracy (though Stripe charged the correct amount)
            order.subtotal = totalAmount;
            order.totalAmount = totalAmount + order.tax + order.shippingCost;
            await order.save();

            console.log('✅ Order created:', order.orderId);

            // Clear cart
            await Cart.findOneAndUpdate(
                { user: userId },
                { items: [], totalAmount: 0 }
            );

            console.log('✅ Cart cleared');
        } catch (orderError) {
            console.error('❌ Error creating order:', orderError.message);
            if (orderError.errors) {
                console.error('Detailed validation errors:', JSON.stringify(orderError.errors, null, 2));
            }

            // Check if order was created despite error (race condition)
            const existingOrder = await Order.findOne({ stripePaymentIntent: paymentIntentId })
                .populate('user', 'firstName lastName email companyName')
                .lean();
            if (existingOrder) {
                console.log('✅ Order found after error, returning existing order');
                order = existingOrder;
            } else {
                // Order creation failed, return error
                return res.status(500).json({
                    success: false,
                    message: orderError.message || 'Failed to create order'
                });
            }
        }

        // Send emails (non-blocking - don't fail if email fails)
        try {
            const populatedOrder = await Order.findById(order._id).populate('user', 'firstName lastName email companyName');

            const customerEmail = generateCustomerOrderEmail(populatedOrder, populatedOrder.user);
            await sendMail({
                to: populatedOrder.user.email,
                subject: customerEmail.subject,
                text: customerEmail.text,
                html: customerEmail.html
            });
            console.log(`✅ Email sent to: ${populatedOrder.user.email}`);

            const adminEmail = process.env.ADMIN_EMAIL || process.env.HOSTINGER_SMTP_USER;
            if (adminEmail) {
                const adminEmailContent = generateAdminOrderEmail(populatedOrder, populatedOrder.user);
                await sendMail({
                    to: adminEmail,
                    subject: adminEmailContent.subject,
                    text: adminEmailContent.text,
                    html: adminEmailContent.html
                });
                console.log(`✅ Admin email sent to: ${adminEmail}`);
            }
        } catch (emailError) {
            console.error('❌ Email error (non-critical):', emailError.message);
            // Don't fail the request if email fails - order is already created
        }

        // Ensure order is populated before returning
        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'firstName lastName email companyName')
            .lean();

        // Always return success if order exists
        res.json({
            success: true,
            order: populatedOrder || order,
            message: 'Order created successfully'
        });

    } catch (error) {
        console.error('❌ Error confirming payment:', error);
        console.error('Error stack:', error.stack);
        
        // Check if order was created despite error
        try {
            const paymentIntentId = req.body?.paymentIntentId;
            if (paymentIntentId) {
                const existingOrder = await Order.findOne({ stripePaymentIntent: paymentIntentId })
                    .populate('user', 'firstName lastName email companyName')
                    .lean();
                if (existingOrder) {
                    console.log('✅ Order found after error, returning existing order:', existingOrder.orderId);
                    return res.json({
                        success: true,
                        order: existingOrder,
                        message: 'Order found and returned successfully'
                    });
                }
            }
        } catch (checkError) {
            console.error('Error checking for existing order:', checkError);
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to confirm payment',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * @desc    Create Stripe checkout session
 * @route   POST /api/stripe/create-checkout-session
 * @access  Private
 */
const createCheckoutSession = async (req, res, next) => {
    try {
        console.log('🔍 Creating checkout session...');
        const { items, shippingAddress } = req.body;

        console.log('📦 Cart items received:', items?.length || 0);
        console.log('📍 Shipping address:', shippingAddress);

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Build line items for Stripe
        console.log('🔨 Building line items for Stripe...');
        const lineItems = await Promise.all(items.map(async (item) => {
            console.log('Processing item:', item.productId || item.id);
            const product = await Product.findById(item.productId || item.id);

            if (!product) {
                console.error(`❌ Product not found: ${item.productId || item.id}`);
                throw new Error(`Product not found: ${item.productId || item.id}`);
            }

            // Convert Mongoose document to plain object to avoid circular references
            const productName = String(product.name);

            // Validate image URL - Stripe requires valid HTTPS URLs
            let productImage = null;
            if (product.images && product.images.length > 0) {
                const imageUrl = String(product.images[0]);
                // Check if it's a valid HTTP/HTTPS URL
                if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                    productImage = imageUrl;
                }
            }

            // Build product description
            let description = '';
            if (item.isPack) {
                description = `${item.packMultiplier}× Pack (${item.itemCount} items)`;
            } else {
                description = `Size: ${item.size || 'N/A'}, Color: ${item.color || 'N/A'}, Qty: ${item.quantity || 1}`;
            }

            // Ensure we only use primitive values, no objects with circular refs
            const lineItem = {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: productName,
                        description: String(description)
                    },
                    unit_amount: Math.round(Number(item.totalPrice) * 100) // Convert to cents
                },
                quantity: 1
            };

            // Only add images if they exist and are valid URLs
            if (productImage) {
                lineItem.price_data.product_data.images = [productImage];
            }

            return lineItem;
        }));

        console.log('✅ Line items built successfully:', lineItems.length);

        // Don't store cart items in metadata to avoid circular reference issues
        // We'll fetch the cart from the database in the webhook instead
        console.log('💳 Creating Stripe session...');
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: lineItems,
            success_url: `${req.headers.origin || process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin || process.env.FRONTEND_URL}/payment-cancel`,
            customer_email: req.user.email,
            client_reference_id: req.user._id.toString(),
            metadata: {
                userId: req.user._id.toString(),
                fullName: shippingAddress.fullName,
                phone: shippingAddress.phone,
                address: shippingAddress.address,
                city: shippingAddress.city,
                state: shippingAddress.state,
                zipCode: shippingAddress.zipCode,
                country: shippingAddress.country,
                totalItems: items.length.toString()
            }
        });

        console.log('✅ Stripe session created:', session.id);

        res.json({
            success: true,
            url: session.url,
            sessionId: session.id
        });

    } catch (error) {
        console.error('❌ Error creating checkout session:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create checkout session',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * @desc    Verify Stripe session and create order (for local development)
 * @route   GET /api/stripe/verify-session/:sessionId
 * @access  Private
 */
const verifySession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        console.log('🔍 Verifying Stripe session:', sessionId);

        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        console.log('Session status:', session.payment_status);

        if (session.payment_status !== 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Payment not completed'
            });
        }

        // Check if order already exists for this session
        const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
        if (existingOrder) {
            console.log('✅ Order already exists:', existingOrder.orderId);
            return res.json({
                success: true,
                order: existingOrder,
                message: 'Order already created'
            });
        }

        // Get user ID from session
        const userId = session.metadata.userId;

        // Fetch user's cart from database
        const userCart = await Cart.findOne({ user: userId });

        if (!userCart || !userCart.items || userCart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No cart found'
            });
        }

        // Build shipping address from metadata
        const shippingAddress = {
            fullName: session.metadata.fullName,
            email: session.customer_email,
            phone: session.metadata.phone,
            street: session.metadata.address,
            city: session.metadata.city,
            state: session.metadata.state,
            zipCode: session.metadata.zipCode,
            country: session.metadata.country
        };

        // Calculate total and prepare order items
        let totalAmount = 0;
        const orderItems = [];

        for (const item of userCart.items) {
            const product = await Product.findById(item.productId);

            if (product) {
                orderItems.push({
                    productId: item.productId,
                    productName: item.productName || product.name,
                    brand: item.brand || product.brand,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    totalPrice: item.totalPrice,
                    unitPrice: item.unitPrice || product.unitPrice,
                    isPack: item.isPack,
                    packMultiplier: item.packMultiplier,
                    itemCount: item.itemCount,
                    itemCount: item.itemCount,
                    hasDiscount: item.hasDiscount,
                    discountPercent: item.discountPercent,
                    variations: item.variations
                });

                totalAmount += item.totalPrice || 0;
            }
        }

        // Create order in database
        const order = await Order.create({
            user: userId,
            items: orderItems,
            subtotal: totalAmount,
            tax: Number(session.metadata.tax || 0),
            shippingCost: Number(session.metadata.shipping || 0),
            totalAmount: totalAmount + Number(session.metadata.tax || 0) + Number(session.metadata.shipping || 0),
            shippingAddress,
            paymentMethod: 'card',
            paymentStatus: 'paid',
            stripeSessionId: sessionId,
            stripePaymentIntent: session.payment_intent
        });

        console.log('✅ Order created:', order.orderId);

        // Clear user's cart
        await Cart.findOneAndUpdate(
            { user: userId },
            { items: [], totalAmount: 0 }
        );

        console.log('✅ Cart cleared for user:', userId);

        // Send email notifications
        try {
            const populatedOrder = await Order.findById(order._id).populate('user', 'firstName lastName email companyName');

            // Send customer confirmation email
            const customerEmail = generateCustomerOrderEmail(populatedOrder, populatedOrder.user);
            await sendMail({
                to: populatedOrder.user.email,
                subject: customerEmail.subject,
                text: customerEmail.text,
                html: customerEmail.html
            });
            console.log(`✅ Order confirmation email sent to: ${populatedOrder.user.email}`);

            // Send admin notification
            const adminEmail = process.env.ADMIN_EMAIL || process.env.HOSTINGER_SMTP_USER;
            if (adminEmail) {
                const adminEmailContent = generateAdminOrderEmail(populatedOrder, populatedOrder.user);
                await sendMail({
                    to: adminEmail,
                    subject: adminEmailContent.subject,
                    text: adminEmailContent.text,
                    html: adminEmailContent.html
                });
                console.log(`✅ Admin notification sent to: ${adminEmail}`);
            }
        } catch (emailError) {
            console.error('❌ Error sending emails:', emailError.message);
        }

        res.json({
            success: true,
            order,
            message: 'Order created successfully'
        });

    } catch (error) {
        console.error('❌ Error verifying session:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to verify session'
        });
    }
};

/**
 * @desc    Stripe webhook handler
 * @route   POST /api/stripe/webhook
 * @access  Public (verified via Stripe signature)
 */
const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Verify webhook signature
        if (webhookSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            // For development without webhook secret
            console.warn('⚠️ Warning: No webhook secret configured. Using unverified webhook body.');
            event = JSON.parse(req.body.toString());
        }
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('✅ Checkout session completed:', session.id);

        try {
            // Extract user ID from metadata
            const userId = session.metadata.userId;

            // Fetch user's cart from database
            const userCart = await Cart.findOne({ user: userId });

            if (!userCart || !userCart.items || userCart.items.length === 0) {
                console.error('❌ No cart found for user:', userId);
                return res.json({ received: true, error: 'No cart found' });
            }

            // Build shipping address from metadata
            const shippingAddress = {
                fullName: session.metadata.fullName,
                email: session.customer_email,
                phone: session.metadata.phone,
                street: session.metadata.address,
                city: session.metadata.city,
                state: session.metadata.state,
                zipCode: session.metadata.zipCode,
                country: session.metadata.country
            };

            // Calculate total amount and prepare order items
            let totalAmount = 0;
            const orderItems = [];

            for (const item of userCart.items) {
                const product = await Product.findById(item.productId);

                if (!product) {
                    console.error(`Product not found: ${item.productId}`);
                    continue;
                }

                orderItems.push({
                    productId: item.productId,
                    productName: item.productName || product.name,
                    brand: item.brand || product.brand,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    totalPrice: item.totalPrice,
                    unitPrice: item.unitPrice || product.unitPrice,
                    isPack: item.isPack,
                    packMultiplier: item.packMultiplier,
                    itemCount: item.itemCount,
                    itemCount: item.itemCount,
                    hasDiscount: item.hasDiscount,
                    discountPercent: item.discountPercent,
                    variations: item.variations
                });

                totalAmount += item.totalPrice || 0;
            }

            // Create order in database
            const order = await Order.create({
                user: userId,
                items: orderItems,
                subtotal: totalAmount,
                tax: Number(session.metadata.tax || 0),
                shippingCost: Number(session.metadata.shipping || 0),
                totalAmount: totalAmount + Number(session.metadata.tax || 0) + Number(session.metadata.shipping || 0),
                shippingAddress,
                paymentMethod: 'card',
                paymentStatus: 'paid',
                stripeSessionId: session.id,
                stripePaymentIntent: session.payment_intent
            });

            console.log('✅ Order created:', order.orderId);

            // Clear user's cart
            await Cart.findOneAndUpdate(
                { user: userId },
                { items: [], totalAmount: 0 }
            );

            // Send email notifications
            try {
                const populatedOrder = await Order.findById(order._id).populate('user', 'firstName lastName email companyName');

                // Send customer confirmation email
                const customerEmail = generateCustomerOrderEmail(populatedOrder, populatedOrder.user);
                await sendMail({
                    to: populatedOrder.user.email,
                    subject: customerEmail.subject,
                    text: customerEmail.text,
                    html: customerEmail.html
                });
                console.log(`✅ Order confirmation email sent to customer: ${populatedOrder.user.email}`);

                // Send admin notification email
                const adminEmail = process.env.ADMIN_EMAIL || process.env.HOSTINGER_SMTP_USER;
                if (adminEmail) {
                    const adminEmailContent = generateAdminOrderEmail(populatedOrder, populatedOrder.user);
                    await sendMail({
                        to: adminEmail,
                        subject: adminEmailContent.subject,
                        text: adminEmailContent.text,
                        html: adminEmailContent.html
                    });
                    console.log(`✅ Order notification email sent to admin: ${adminEmail}`);
                }
            } catch (emailError) {
                console.error('❌ Error sending order emails:', emailError.message);
            }

        } catch (error) {
            console.error('❌ Error processing order after payment:', error);
            // Even if order creation fails, acknowledge the webhook to prevent retries
        }
    }

    // Return 200 to acknowledge receipt of the event
    res.json({ received: true });
};

module.exports = {
    createPaymentIntent,
    confirmPayment,
    createCheckoutSession,
    verifySession,
    handleWebhook
};
