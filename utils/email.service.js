require('dotenv').config();
const nodemailer = require('nodemailer');

let cachedTransporter = null;

async function createTransporter() {
    if (cachedTransporter) return cachedTransporter;

    const host = process.env.HOSTINGER_SMTP_HOST;
    const port = Number(process.env.HOSTINGER_SMTP_PORT || 465);
    const secure = port === 465;

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user: process.env.HOSTINGER_SMTP_USER,
            pass: process.env.HOSTINGER_SMTP_PASS,
        },
        logger: true,        // turn on Nodemailer logging (prints to console)
        debug: true,         // include SMTP protocol logs
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        tls: {
            // temporarily allow self-signed certs if TLS verification fails in testing
            rejectUnauthorized: false
        }
    });

    // Verify connection/config early — will throw on network/auth issues
    await transporter.verify();
    console.log('SMTP verified — ready to send');

    cachedTransporter = transporter;
    return transporter;
}

async function sendMail({ to, subject, text, html, attachments }) {
    if (!process.env.FROM_EMAIL) {
        throw new Error('Missing FROM_EMAIL in .env — set it to "Your Name <you@yourdomain.com>"');
    }

    const transporter = await createTransporter();

    try {
        const info = await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to,
            subject,
            text,
            html,
            attachments
        });

        console.log('Message sent, messageId:', info.messageId);
        return info;
    } catch (err) {
        // Helpful debug output
        // Helpful debug output
        console.error('❌ Nodemailer sendMail error:', err && err.message ? err.message : err);
        if (err && err.response) console.error('SMTP response:', err.response);
        if (err && err.code) console.error('Error code:', err.code);
        if (err && err.command) console.error('Failed command:', err.command);
        console.error('SMTP Configuration used:', {
            host: process.env.HOSTINGER_SMTP_HOST,
            port: process.env.HOSTINGER_SMTP_PORT,
            user: process.env.HOSTINGER_SMTP_USER ? '***SET***' : '***MISSING***',
            pass: process.env.HOSTINGER_SMTP_PASS ? '***SET***' : '***MISSING***',
            from: process.env.FROM_EMAIL
        });
        throw err; // rethrow so caller (your server) can handle/log
    }
}

module.exports = { sendMail };
