import mongoose from 'mongoose';
import DueType from '../models/dueType.model';
import { connectDB } from '../config/db';

const predefinedDueTypes = [
  {
    name: 'Registration Fee',
    description: 'One-time pharmacy registration fee',
    isRecurring: false,
  },
  {
    name: 'Annual Dues',
    description: 'Annual membership dues for the association',
    isRecurring: true,
    recurringPeriod: 'annual',
  },
  {
    name: 'Event Fee',
    description: 'Fee for special events and activities',
    isRecurring: false,
  },
  {
    name: 'Annual Membership',
    description: 'Annual membership fee',
    isRecurring: true,
    recurringPeriod: 'annual',
  },
  {
    name: 'Conferences',
    description: 'Fee for attending conferences and training sessions',
    isRecurring: false,
  },
  {
    name: 'Land & Building',
    description: 'Contribution towards land and building projects',
    isRecurring: false,
  },
  {
    name: 'Transportation',
    description: 'Transportation related fees and contributions',
    isRecurring: false,
  },
  {
    name: 'Feeding',
    description: 'Feeding allowance for events and meetings',
    isRecurring: false,
  },
];

export const seedDueTypes = async () => {
  try {
    await connectDB();

    console.log('🌱 Seeding predefined due types...');

    // Create a system user ID for seeding (you may need to adjust this)
    const systemUserId = new mongoose.Types.ObjectId();

    for (const dueTypeData of predefinedDueTypes) {
      const existingDueType = await DueType.findOne({ name: dueTypeData.name });

      if (!existingDueType) {
        await DueType.create({
          ...dueTypeData,
          createdBy: systemUserId,
        });
        console.log(`✅ Created due type: ${dueTypeData.name}`);
      } else {
        console.log(`⏭️ Due type already exists: ${dueTypeData.name}`);
      }
    }

    console.log('🎉 Due types seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding due types:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDueTypes()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
