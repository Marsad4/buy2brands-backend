// Seed script to create initial admin user
// Run this with: node scripts/seedAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User.model');

const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.DB_NAME
        });

        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@exceliensparks.com' });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists');
            console.log('Email:', existingAdmin.email);
            console.log('Role:', existingAdmin.role);

            // Update to admin if not already
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log('✅ Updated existing user to admin');
            }

            process.exit(0);
        }

        // Create new admin user
        const adminUser = await User.create({
            email: 'admin@exceliensparks.com',
            password: 'Admin123!',
            firstName: 'Admin',
            lastName: 'User',
            companyName: 'ExcelienSparks',
            role: 'admin',
            businessType: 'warehouse',
            isActive: true
        });

        console.log('✅ Admin user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Email:', adminUser.email);
        console.log('Password: Admin123!');
        console.log('Role:', adminUser.role);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  IMPORTANT: Change this password after first login!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

seedAdmin();
