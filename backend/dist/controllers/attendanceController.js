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
exports.exportAttendanceCSV = exports.sendWarnings = exports.calculatePenalties = exports.updateAttendance = exports.getEventAttendees = exports.getEvents = void 0;
const Event_1 = __importDefault(require("../models/Event"));
const Attendee_1 = __importDefault(require("../models/Attendee"));
const date_fns_1 = require("date-fns");
const mongoose_1 = __importDefault(require("mongoose"));
const getEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year } = req.query;
        const startDate = (0, date_fns_1.startOfYear)(new Date(Number(year), 0));
        const endDate = (0, date_fns_1.endOfYear)(new Date(Number(year), 0));
        const events = yield Event_1.default.find({
            startDate: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ startDate: 1 });
        res.json(events);
    }
    catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});
exports.getEvents = getEvents;
const getEventAttendees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const attendees = yield Attendee_1.default.find({ eventId })
            .populate('userId', 'firstName lastName email')
            .sort({ registeredAt: 1 });
        res.json(attendees);
    }
    catch (error) {
        console.error('Error fetching attendees:', error);
        res.status(500).json({ message: 'Error fetching attendees' });
    }
});
exports.getEventAttendees = getEventAttendees;
const updateAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const { attendanceData } = req.body;
        const updatePromises = attendanceData.map(({ userId, present }) => Attendee_1.default.findOneAndUpdate({ eventId, userId }, { status: present ? 'present' : 'absent' }, { new: true }));
        yield Promise.all(updatePromises);
        res.json({ message: 'Attendance updated successfully' });
    }
    catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({ message: 'Error updating attendance' });
    }
});
exports.updateAttendance = updateAttendance;
const calculatePenalties = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year } = req.body;
        const startDate = (0, date_fns_1.startOfYear)(new Date(Number(year), 0));
        const endDate = (0, date_fns_1.endOfYear)(new Date(Number(year), 0));
        // Get all meetings for the year
        const meetings = yield Event_1.default.find({
            startDate: { $gte: startDate, $lte: endDate },
            eventType: 'meetings'
        });
        // Get all users
        const users = yield mongoose_1.default.model('User').find({ role: 'member' });
        // Calculate attendance for each user
        const penalties = yield Promise.all(users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            const attendances = yield Attendee_1.default.find({
                userId: user._id,
                eventId: { $in: meetings.map(m => m._id) },
                status: 'present'
            });
            const attendanceRate = attendances.length / meetings.length;
            // Default to 0 if annualDues is not set
            const penalty = attendanceRate < 0.5 ? (user.annualDues || 0) / 2 : 0;
            if (penalty > 0) {
                yield mongoose_1.default.model('User').findByIdAndUpdate(user._id, {
                    $inc: { pendingDues: penalty }
                });
            }
            return {
                userId: user._id,
                name: `${user.firstName} ${user.lastName}`,
                attendanceRate,
                penalty
            };
        })));
        res.json({ penalties });
    }
    catch (error) {
        console.error('Error calculating penalties:', error);
        res.status(500).json({ message: 'Error calculating penalties' });
    }
});
exports.calculatePenalties = calculatePenalties;
const sendWarnings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year } = req.body;
        const startDate = (0, date_fns_1.startOfYear)(new Date(Number(year), 0));
        const endDate = (0, date_fns_1.endOfYear)(new Date(Number(year), 0));
        // Get all meetings for the year
        const meetings = yield Event_1.default.find({
            startDate: { $gte: startDate, $lte: endDate },
            eventType: 'meetings'
        });
        // Get all users
        const users = yield mongoose_1.default.model('User').find({ role: 'member' });
        // Calculate attendance and send warnings
        const warnings = yield Promise.all(users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            const attendances = yield Attendee_1.default.find({
                userId: user._id,
                eventId: { $in: meetings.map(m => m._id) },
                status: 'present'
            });
            const attendanceRate = attendances.length / meetings.length;
            if (attendanceRate < 0.5) {
                // TODO: Implement actual email sending
                console.log(`Warning sent to ${user.email} - Attendance rate: ${attendanceRate * 100}%`);
            }
            return {
                userId: user._id,
                name: `${user.firstName} ${user.lastName}`,
                attendanceRate,
                warningSent: attendanceRate < 0.5
            };
        })));
        res.json({ warnings });
    }
    catch (error) {
        console.error('Error sending warnings:', error);
        res.status(500).json({ message: 'Error sending warnings' });
    }
});
exports.sendWarnings = sendWarnings;
const exportAttendanceCSV = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const event = yield Event_1.default.findById(eventId);
        const attendees = yield Attendee_1.default.find({ eventId })
            .populate('userId', 'firstName lastName email');
        // Create CSV content
        const headers = ['Name', 'Email', 'Status', 'Registration Date'];
        const rows = attendees.map(attendee => [
            `${attendee.userId.firstName} ${attendee.userId.lastName}`,
            attendee.userId.email,
            attendee.status,
            new Date(attendee.registeredAt).toLocaleDateString()
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${event === null || event === void 0 ? void 0 : event.title}-attendance.csv`);
        res.send(csvContent);
    }
    catch (error) {
        console.error('Error exporting attendance:', error);
        res.status(500).json({ message: 'Error exporting attendance' });
    }
});
exports.exportAttendanceCSV = exportAttendanceCSV;
