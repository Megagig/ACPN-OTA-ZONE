"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
const date_fns_1 = require("date-fns");
const Event_1 = __importDefault(require("../models/Event"));
const Attendee_1 = __importDefault(require("../models/Attendee"));
(0, dotenv_1.config)();
const seedData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Connect to MongoDB
        yield mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/acpn-ota');
        console.log('Connected to MongoDB');
        // Clear existing data
        yield Event_1.default.deleteMany({});
        yield Attendee_1.default.deleteMany({});
        console.log('Cleared existing data');
        // Get admin user for createdBy field
        const UserModel = mongoose_1.default.model('User');
        const admin = yield UserModel.findOne({ role: 'admin' });
        if (!admin) {
            throw new Error('Admin user not found');
        }
        // Create test events for the current year
        const currentYear = new Date().getFullYear();
        const events = [
            {
                title: 'Quarterly Strategy Meeting Q1',
                description: 'First quarterly strategy meeting of the year',
                startDate: (0, date_fns_1.addMonths)((0, date_fns_1.startOfYear)(new Date(currentYear, 0)), 2),
                endDate: (0, date_fns_1.addMonths)((0, date_fns_1.startOfYear)(new Date(currentYear, 0)), 2),
                eventType: 'meetings',
                location: 'Main Conference Room',
                status: 'published',
                createdBy: admin._id
            },
            {
                title: 'Annual Tech Conference',
                description: 'Annual technology conference and networking event',
                startDate: (0, date_fns_1.addMonths)((0, date_fns_1.startOfYear)(new Date(currentYear, 0)), 5),
                endDate: (0, date_fns_1.addMonths)((0, date_fns_1.startOfYear)(new Date(currentYear, 0)), 5),
                eventType: 'conference',
                location: 'Grand Hotel',
                maxAttendees: 200,
                status: 'published',
                createdBy: admin._id
            },
            {
                title: 'UI/UX Workshop',
                description: 'Hands-on workshop for UI/UX design principles',
                startDate: (0, date_fns_1.addMonths)((0, date_fns_1.startOfYear)(new Date(currentYear, 0)), 7),
                endDate: (0, date_fns_1.addMonths)((0, date_fns_1.startOfYear)(new Date(currentYear, 0)), 7),
                eventType: 'workshop',
                location: 'Training Center',
                maxAttendees: 30,
                status: 'published',
                createdBy: admin._id
            }
        ];
        const createdEvents = yield Event_1.default.insertMany(events);
        console.log('Created test events');
        // Get all members
        const members = yield UserModel.find({ role: 'member' });
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
        yield Attendee_1.default.insertMany(attendees);
        console.log('Created test attendees');
        console.log('Seed completed successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
});
seedData();
