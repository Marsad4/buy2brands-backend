const ReturnRequest = require('../models/ReturnRequest.model');
const User = require('../models/User.model');
const { sendMail } = require('../utils/email.service');
const { generateAdminReturnRequestEmail } = require('../utils/emailTemplates.util');

// Create a new return request
exports.createReturnRequest = async (req, res) => {
    try {
        const { orderId, reason, message } = req.body;

        if (!orderId || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and reason are required'
            });
        }

        const newRequest = new ReturnRequest({
            user: req.user.id,
            orderId,
            reason,
            message
        });

        const savedRequest = await newRequest.save();

        // Get user details for email
        const user = await User.findById(req.user.id);

        // Send email notification to admin
        try {
            const { subject, html, text } = generateAdminReturnRequestEmail(savedRequest, user);
            const adminEmail = process.env.ADMIN_EMAIL || 'sales@buy2brands.com'; // Fallback or env var, ideally env

            // Send email using sendMail function
            await sendMail({
                to: adminEmail,
                subject,
                text,
                html
            });
        } catch (emailError) {

            console.error('Error sending return request email to admin:', emailError);
            // Don't fail the request if email fails
        }

        res.status(201).json({
            success: true,
            data: savedRequest,
            message: 'Return request submitted successfully'
        });

    } catch (error) {
        console.error('Create return request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit return request'
        });
    }
};

// Get all return requests (Admin)
exports.getAllReturnRequests = async (req, res) => {
    try {
        const requests = await ReturnRequest.find()
            .populate('user', 'firstName lastName email companyName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Get all return requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch return requests'
        });
    }
};

// Get my return requests (User)
exports.getMyReturnRequests = async (req, res) => {
    try {
        const requests = await ReturnRequest.find({ user: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Get my return requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your return requests'
        });
    }
};

// Update return request status (Admin)
exports.updateReturnRequestStatus = async (req, res) => {
    try {
        const { status, adminResponse } = req.body;
        const { id } = req.params;

        const request = await ReturnRequest.findByIdAndUpdate(
            id,
            {
                status,
                adminResponse,
                // If resolving, maybe add resolvedAt?
            },
            { new: true }
        ).populate('user', 'firstName lastName email');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Return request not found'
            });
        }

        // Optional: Send email to user about status update (Not explicitly requested but good practice)

        res.status(200).json({
            success: true,
            data: request,
            message: 'Return request updated successfully'
        });

    } catch (error) {
        console.error('Update return request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update return request'
        });
    }
};
