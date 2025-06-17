import mongoose from 'mongoose';
import Event from '../models/Event';
import Attendee from '../models/Attendee';
import User from '../models/User';
import { addMonths, startOfYear } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/acpn-ota');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Event.deleteMany({});
    await Attendee.deleteMany({});
    console.log('Cleared existing data');

    // Get admin user for createdBy field
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      throw new Error('Admin user not found');
    }

    // Create test events for the current year
    const currentYear = new Date().getFullYear();
    const events = [
      {
        title: 'Quarterly Strategy Meeting Q1',
        description: 'First quarterly strategy meeting of the year',
        startDate: addMonths(startOfYear(new Date(currentYear, 0)), 2),
        endDate: addMonths(startOfYear(new Date(currentYear, 0)), 2),
        eventType: 'meetings',
        location: 'Main Conference Room',
        status: 'published',
        createdBy: admin._id
      },
      {
        title: 'Annual Tech Conference',
        description: 'Annual technology conference and networking event',
        startDate: addMonths(startOfYear(new Date(currentYear, 0)), 5),
        endDate: addMonths(startOfYear(new Date(currentYear, 0)), 5),
        eventType: 'conference',
        location: 'Grand Hotel',
        maxAttendees: 200,
        status: 'published',
        createdBy: admin._id
      },
      {
        title: 'UI/UX Workshop',
        description: 'Hands-on workshop for UI/UX design principles',
        startDate: addMonths(startOfYear(new Date(currentYear, 0)), 7),
        endDate: addMonths(startOfYear(new Date(currentYear, 0)), 7),
        eventType: 'workshop',
        location: 'Training Center',
        maxAttendees: 30,
        status: 'published',
        createdBy: admin._id
      }
    ];

    const createdEvents = await Event.insertMany(events);
    console.log('Created test events');

    // Get all members
    const members = await User.find({ role: 'member' });
    if (members.length === 0) {
      throw new Error('No member users found');
    }

    // Create attendees for each event
    const attendees = [];
    for (const event of createdEvents) {
      // Randomly select 70% of members to attend each event
      const selectedMembers = members
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(members.length * 0.7));

      for (const member of selectedMembers) {
        attendees.push({
          eventId: event._id,
          userId: member._id,
          status: Math.random() > 0.2 ? 'present' : 'absent', // 80% attendance rate
          paymentStatus: 'paid',
          registeredAt: new Date(event.startDate.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days before event
        });
      }
    }

    await Attendee.insertMany(attendees);
    console.log('Created test attendees');

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData(); 