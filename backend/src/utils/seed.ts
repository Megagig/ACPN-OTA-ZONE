import mongoose from 'mongoose';
import User, { UserRole, UserStatus } from '../models/user.model';
import connectDB from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Creates a superadmin user for initial setup
 */
const createSuperAdmin = async () => {
  try {
    // Connect to the database
    await connectDB();

    console.log('Connected to MongoDB, checking for superadmin...');

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({
      email: 'Megagigdev@gmail.com',
      role: UserRole.SUPERADMIN,
    });

    if (existingSuperAdmin) {
      console.log('Superadmin already exists. Skipping creation.');
      process.exit(0);
    }

    // Create a new superadmin user
    const superAdmin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'Megagigdev@gmail.com',
      password: 'Exploit4ever@247',
      phone: '08060374755', // placeholder phone number
      role: UserRole.SUPERADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isApproved: true,
      registrationDate: new Date(),
    });

    console.log('Superadmin created successfully:', {
      email: superAdmin.email,
      role: superAdmin.role,
      id: superAdmin._id,
    });

    // Close the database connection
    mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error('Error creating superadmin:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Execute the function
createSuperAdmin();
