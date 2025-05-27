/**
 * Migration script to add defaultAmount field to existing due types
 *
 * Run using: npx ts-node scripts/migrate-due-types.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import DueType from '../src/models/dueType.model';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
};

const migrateDueTypes = async () => {
  try {
    await connectDB();

    console.log('Finding due types without defaultAmount field...');

    // Find all due types
    const dueTypes = await DueType.find({});

    console.log(`Found ${dueTypes.length} due types`);

    // Count due types without defaultAmount
    let updatedCount = 0;

    // Update each due type
    for (const dueType of dueTypes) {
      if (
        typeof dueType.defaultAmount === 'undefined' ||
        dueType.defaultAmount === null
      ) {
        console.log(`Updating due type: ${dueType.name}`);

        // Set default amount to 0
        dueType.defaultAmount = 0;
        await dueType.save();

        updatedCount++;
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} due types.`);
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    mongoose.disconnect();
    console.log('Database connection closed.');
  }
};

// Run the migration
migrateDueTypes();
