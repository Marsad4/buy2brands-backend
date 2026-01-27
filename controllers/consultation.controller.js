const { sendMail } = require('../utils/email.service');

/**
 * Submit a new expert consultation request
 * @route POST /api/consultation/request
 * @access Public
 */
exports.submitConsultationRequest = async (req, res) => {
    try {
        const { name, email, phone, company, message, consultationType } = req.body;

        // Basic validation
        if (!name || !email || !message || !consultationType) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields'
            });
        }

        // Email content
        const subject = `New Expert Consultation Request: ${consultationType} - ${name}`;

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
                <h2 style="color: #1a365d; text-align: center;">New Consultation Request</h2>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                    <p><strong>Company:</strong> ${company || 'Not provided'}</p>
                    <p><strong>Type:</strong> ${consultationType}</p>
                </div>
                
                <h3 style="color: #2d3748;">Message:</h3>
                <div style="background-color: #fff; padding: 15px; border: 1px solid #e2e8f0; border-radius: 5px; white-space: pre-wrap;">
                    ${message}
                </div>
                
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="font-size: 12px; color: #718096; text-align: center;">
                    This email was sent from the Buy2Brands Expert Consultation form.
                </p>
            </div>
        `;

        // Send email to admin
        await sendMail({
            to: 'info@buy2brands.com',
            subject: subject,
            html: htmlContent
        });

        res.status(200).json({
            success: true,
            message: 'Consultation request submitted successfully'
        });

    } catch (error) {
        console.error('Error submitting consultation request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit request',
            error: error.message
        });
    }
};
