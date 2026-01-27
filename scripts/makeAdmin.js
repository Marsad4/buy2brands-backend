// Script to make a user admin
// Run this with: node scripts/makeAdmin.js <email>

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User.model');

const makeAdmin = async (email) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.DB_NAME
        });

        console.log('✅ Connected to MongoDB');

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log('❌ User not found with email:', email);
            process.exit(1);
        }

        // Update to admin
        user.role = 'admin';
        await user.save();

        console.log('✅ User updated to admin successfully!');
        console.log('User:', user.email);
        console.log('Role:', user.role);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

// Get email from command line
const email = process.argv[2];

if (!email) {
    console.log('Usage: node scripts/makeAdmin.js <email>');
    process.exit(1);
}

makeAdmin(email);
