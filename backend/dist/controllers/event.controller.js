"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.bulkRegisterAllMembers = exports.cancelEvent = exports.publishEvent = exports.sendAttendanceWarningsForYear = exports.calculatePenalties = exports.getAllPenaltyConfigs = exports.createPenaltyConfig = exports.getPenaltyConfig = exports.getUserEventHistory = exports.getEventRegistrations = exports.getUserRegistrations = exports.getUserPenalties = exports.getEventStats = exports.acknowledgeEvent = exports.getMyEvents = exports.markAttendance = exports.getEventAttendance = exports.cancelRegistration = exports.registerForEvent = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEvent = exports.getAllEvents = void 0;
const event_model_1 = __importStar(require("../models/event.model"));
const eventRegistration_model_1 = __importStar(require("../models/eventRegistration.model"));
const eventAttendance_model_1 = __importDefault(require("../models/eventAttendance.model"));
const eventNotification_model_1 = __importDefault(require("../models/eventNotification.model"));
const meetingPenaltyConfig_model_1 = __importDefault(require("../models/meetingPenaltyConfig.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const due_model_1 = __importDefault(require("../models/due.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
const email_service_1 = __importDefault(require("../services/email.service"));
const cloudinary_1 = require("cloudinary");
// @desc    Get all events
// @route   GET /api/events
// @access  Private
exports.getAllEvents = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // Build query
    const query = {};
    // Filter by status if provided
    if (req.query.status) {
        query.status = req.query.status;
    }
    // Filter by event type if provided
    if (req.query.eventType) {
        query.eventType = req.query.eventType;
    }
    // Filter by date range if provided
    if (req.query.startDate) {
        query.startDate = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
        query.endDate = { $lte: new Date(req.query.endDate) };
    }
    // Search by title, description, or location
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        query.$or = [
            { title: searchRegex },
            { description: searchRegex },
            { location: searchRegex },
            { organizer: searchRegex },
        ];
    }
    const total = yield event_model_1.default.countDocuments(query);
    const events = yield event_model_1.default.find(query)
        .populate({
        path: 'createdBy',
        select: 'firstName lastName email',
    })
        .sort({ startDate: 1 })
        .skip(startIndex)
        .limit(limit);
    // For each event, get registration and attendance counts
    const eventsWithCounts = yield Promise.all(events.map((event) => __awaiter(void 0, void 0, void 0, function* () {
        const registrationCount = yield eventRegistration_model_1.default.countDocuments({
            eventId: event._id,
        });
        const attendanceCount = yield eventAttendance_model_1.default.countDocuments({
            eventId: event._id,
            attended: true,
        });
        const eventObj = event.toObject();
        return Object.assign(Object.assign({}, eventObj), { registrationCount,
            attendanceCount });
    })));
    res.status(200).json({
        success: true,
        count: events.length,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            total,
        },
        data: eventsWithCounts,
    });
}));
// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
exports.getEvent = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield event_model_1.default.findById(req.params.id).populate({
        path: 'createdBy',
        select: 'firstName lastName email',
    });
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${req.params.id}`, 404));
    }
    // Get registrations and attendance
    const registrations = yield eventRegistration_model_1.default.find({ eventId: event._id })
        .populate('userId', 'firstName lastName email phone')
        .sort({ registrationDate: -1 });
    const attendance = yield eventAttendance_model_1.default.find({ eventId: event._id })
        .populate('userId', 'firstName lastName email phone')
        .populate('markedBy', 'firstName lastName')
        .sort({ markedAt: -1 });
    // Mark as seen for current user
    const userId = req.user.id;
    yield eventNotification_model_1.default.findOneAndUpdate({ eventId: event._id, userId }, { seen: true, seenAt: new Date() }, { upsert: true });
    const eventObj = event.toObject();
    res.status(200).json({
        success: true,
        data: Object.assign(Object.assign({}, eventObj), { registrations,
            attendance, registrationCount: registrations.length, attendanceCount: attendance.filter((a) => a.attended).length }),
    });
}));
// @desc    Create new event
// @route   POST /api/events
// @access  Private (Admin only)
exports.createEvent = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    // Handle image upload if provided
    let imageUrl = '';
    if (req.body.image) {
        try {
            const uploadResponse = yield cloudinary_1.v2.uploader.upload(req.body.image, {
                folder: 'events',
                resource_type: 'image',
                quality: 'auto:best',
                format: 'webp',
            });
            imageUrl = uploadResponse.secure_url;
        }
        catch (error) {
            console.error('Image upload error:', error);
        }
    }
    const eventData = Object.assign(Object.assign({}, req.body), { createdBy: userId, imageUrl: imageUrl || undefined, 
        // Make sure these fields are set correctly
        eventType: req.body.eventType || event_model_1.EventType.OTHER, organizer: req.body.organizer || 'ACPN', status: req.body.status || event_model_1.EventStatus.DRAFT });
    const event = yield event_model_1.default.create(eventData);
    // Send notifications to all users
    yield sendEventNotifications(event._id.toString());
    const populatedEvent = yield event_model_1.default.findById(event._id).populate('createdBy', 'firstName lastName email');
    res.status(201).json({
        success: true,
        data: populatedEvent,
    });
}));
// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin only)
exports.updateEvent = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let event = yield event_model_1.default.findById(req.params.id);
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${req.params.id}`, 404));
    }
    // Handle image upload if provided
    if (req.body.image) {
        try {
            // Delete old image if exists
            if (event.imageUrl) {
                const publicId = (_a = event.imageUrl.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('.')[0];
                if (publicId) {
                    yield cloudinary_1.v2.uploader.destroy(`events/${publicId}`);
                }
            }
            const uploadResponse = yield cloudinary_1.v2.uploader.upload(req.body.image, {
                folder: 'events',
                resource_type: 'image',
                quality: 'auto:best',
                format: 'webp',
            });
            req.body.imageUrl = uploadResponse.secure_url;
        }
        catch (error) {
            console.error('Image upload error:', error);
        }
    }
    event = yield event_model_1.default.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    }).populate('createdBy', 'firstName lastName email');
    res.status(200).json({
        success: true,
        data: event,
    });
}));
// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin only)
exports.deleteEvent = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const event = yield event_model_1.default.findById(req.params.id);
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${req.params.id}`, 404));
    }
    // Delete associated records
    yield eventRegistration_model_1.default.deleteMany({ eventId: event._id });
    yield eventAttendance_model_1.default.deleteMany({ eventId: event._id });
    yield eventNotification_model_1.default.deleteMany({ eventId: event._id });
    // Delete image if exists
    if (event.imageUrl) {
        try {
            const publicId = (_a = event.imageUrl.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('.')[0];
            if (publicId) {
                yield cloudinary_1.v2.uploader.destroy(`events/${publicId}`);
            }
        }
        catch (error) {
            console.error('Image deletion error:', error);
        }
    }
    yield event.deleteOne();
    res.status(200).json({
        success: true,
        data: {},
    });
}));
// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private
exports.registerForEvent = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const eventId = req.params.id;
    const userId = req.user.id;
    const event = yield event_model_1.default.findById(eventId);
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${eventId}`, 404));
    }
    // Check if registration is required
    if (!event.requiresRegistration) {
        return next(new errorResponse_1.default('This event does not require registration', 400));
    }
    // Check if registration deadline has passed
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
        return next(new errorResponse_1.default('Registration deadline has passed', 400));
    }
    // Check if already registered
    const existingRegistration = yield eventRegistration_model_1.default.findOne({
        eventId,
        userId,
    });
    if (existingRegistration) {
        return next(new errorResponse_1.default('You are already registered for this event', 400));
    }
    // Check capacity
    if (event.capacity) {
        const currentRegistrations = yield eventRegistration_model_1.default.countDocuments({
            eventId,
            status: {
                $in: [eventRegistration_model_1.RegistrationStatus.REGISTERED, eventRegistration_model_1.RegistrationStatus.CONFIRMED],
            },
        });
        if (currentRegistrations >= event.capacity) {
            // Add to waitlist
            yield eventRegistration_model_1.default.create({
                eventId,
                userId,
                status: eventRegistration_model_1.RegistrationStatus.WAITLIST,
                paymentStatus: event.registrationFee ? 'pending' : 'waived',
            });
            res.status(200).json({
                success: true,
                message: 'Added to waitlist',
                data: { status: 'waitlist' },
            });
            return;
        }
    }
    // Create registration
    const registration = yield eventRegistration_model_1.default.create(Object.assign({ eventId,
        userId, status: eventRegistration_model_1.RegistrationStatus.REGISTERED, paymentStatus: event.registrationFee ? 'pending' : 'waived' }, req.body));
    const populatedRegistration = yield eventRegistration_model_1.default.findById(registration._id)
        .populate('eventId', 'title startDate location')
        .populate('userId', 'firstName lastName email');
    res.status(201).json({
        success: true,
        data: populatedRegistration,
    });
}));
// @desc    Cancel event registration
// @route   DELETE /api/events/:id/register
// @access  Private
exports.cancelRegistration = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const eventId = req.params.id;
    const userId = req.user.id;
    const registration = yield eventRegistration_model_1.default.findOne({
        eventId,
        userId,
    });
    if (!registration) {
        return next(new errorResponse_1.default('Registration not found', 404));
    }
    yield registration.deleteOne();
    // If there's a waitlist, promote the next person
    const waitlistRegistration = yield eventRegistration_model_1.default.findOne({
        eventId,
        status: eventRegistration_model_1.RegistrationStatus.WAITLIST,
    }).sort({ registrationDate: 1 });
    if (waitlistRegistration) {
        waitlistRegistration.status = eventRegistration_model_1.RegistrationStatus.REGISTERED;
        yield waitlistRegistration.save();
        // Send notification to promoted user
        // Implementation depends on notification system
    }
    res.status(200).json({
        success: true,
        data: {},
    });
}));
// @desc    Get event attendance
// @route   GET /api/events/:id/attendance
// @access  Private (Admin, Superadmin, Secretary)
exports.getEventAttendance = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const eventId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // Check if event exists
    const event = yield event_model_1.default.findById(eventId);
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${eventId}`, 404));
    }
    // Build query for attendance records
    const query = { eventId };
    // Filter by attendance status if provided
    if (req.query.attended !== undefined) {
        query.attended = req.query.attended === 'true';
    }
    // Get total count for pagination
    const total = yield eventAttendance_model_1.default.countDocuments(query);
    // Get attendance records with pagination
    const attendanceRecords = yield eventAttendance_model_1.default.find(query)
        .populate('userId', 'firstName lastName email phoneNumber profileImage')
        .populate('markedBy', 'firstName lastName email')
        .sort({ markedAt: -1 })
        .skip(startIndex)
        .limit(limit);
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    res.status(200).json({
        success: true,
        count: attendanceRecords.length,
        total,
        page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        data: attendanceRecords,
    });
}));
// @desc    Mark attendance for event
// @route   POST /api/events/:id/attendance
// @access  Private (Admin only)
exports.markAttendance = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const eventId = req.params.id;
    const adminId = req.user.id;
    const { attendanceList } = req.body; // Array of { userId, attended, notes? }
    // Validate attendanceList
    if (!attendanceList || !Array.isArray(attendanceList)) {
        return next(new errorResponse_1.default('attendanceList must be provided as an array', 400));
    }
    if (attendanceList.length === 0) {
        return next(new errorResponse_1.default('attendanceList cannot be empty', 400));
    }
    const event = yield event_model_1.default.findById(eventId);
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${eventId}`, 404));
    }
    // Allow attendance marking at any time for meetings
    // Admins should be able to mark attendance retroactively
    // The time restriction has been removed to support better admin workflow
    const attendanceRecords = [];
    for (const attendance of attendanceList) {
        const existingAttendance = yield eventAttendance_model_1.default.findOne({
            eventId,
            userId: attendance.userId,
        });
        if (existingAttendance) {
            // Update existing record
            existingAttendance.attended = attendance.attended;
            existingAttendance.markedBy = adminId;
            existingAttendance.markedAt = new Date();
            if (attendance.notes) {
                existingAttendance.notes = attendance.notes;
            }
            yield existingAttendance.save();
            attendanceRecords.push(existingAttendance);
        }
        else {
            // Create new record
            const newAttendance = yield eventAttendance_model_1.default.create({
                eventId,
                userId: attendance.userId,
                attended: attendance.attended,
                markedBy: adminId,
                notes: attendance.notes,
            });
            attendanceRecords.push(newAttendance);
        }
    }
    // If this is a meeting, calculate penalties and send warnings after attendance is marked
    if (event.eventType === event_model_1.EventType.MEETING) {
        const currentYear = new Date().getFullYear();
        yield calculateMeetingPenalties(currentYear);
        // Also send attendance warnings to help members avoid future penalties
        try {
            yield sendAttendanceWarnings(currentYear);
        }
        catch (warningError) {
            console.error('Error sending attendance warnings:', warningError);
            // Don't fail the main operation if warnings fail
        }
    }
    const populatedRecords = yield eventAttendance_model_1.default.find({
        _id: { $in: attendanceRecords.map((r) => r._id) },
    })
        .populate('userId', 'firstName lastName email')
        .populate('markedBy', 'firstName lastName');
    res.status(200).json({
        success: true,
        data: populatedRecords,
    });
}));
// @desc    Get user's events (for member dashboard)
// @route   GET /api/events/my-events
// @access  Private
exports.getMyEvents = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // Get all events
    const eventsQuery = {};
    // Filter by status if provided
    if (req.query.status) {
        eventsQuery.status = req.query.status;
    }
    // Filter by event type if provided
    if (req.query.eventType) {
        eventsQuery.eventType = req.query.eventType;
    }
    // Filter for upcoming events only by default
    if (req.query.includeAll !== 'true') {
        eventsQuery.endDate = { $gte: new Date() };
    }
    const total = yield event_model_1.default.countDocuments(eventsQuery);
    const events = yield event_model_1.default.find(eventsQuery)
        .populate('createdBy', 'firstName lastName email')
        .sort({ startDate: 1 })
        .skip(startIndex)
        .limit(limit);
    // For each event, get user's registration and attendance status
    const eventsWithUserStatus = yield Promise.all(events.map((event) => __awaiter(void 0, void 0, void 0, function* () {
        const registration = yield eventRegistration_model_1.default.findOne({
            eventId: event._id,
            userId,
        });
        const attendance = yield eventAttendance_model_1.default.findOne({
            eventId: event._id,
            userId,
        });
        const notification = yield eventNotification_model_1.default.findOne({
            eventId: event._id,
            userId,
        });
        return Object.assign(Object.assign({}, event.toObject()), { userRegistration: registration, userAttendance: attendance, notification: notification || { seen: false, acknowledged: false } });
    })));
    res.status(200).json({
        success: true,
        count: events.length,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            total,
        },
        data: eventsWithUserStatus,
    });
}));
// @desc    Acknowledge event notification
// @route   POST /api/events/:id/acknowledge
// @access  Private
exports.acknowledgeEvent = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const eventId = req.params.id;
    const userId = req.user.id;
    yield eventNotification_model_1.default.findOneAndUpdate({ eventId, userId }, {
        acknowledged: true,
        acknowledgedAt: new Date(),
        seen: true,
        seenAt: new Date(),
    }, { upsert: true });
    res.status(200).json({
        success: true,
        data: {},
    });
}));
// @desc    Get event statistics
// @route   GET /api/events/stats
// @access  Private (Admin only)
exports.getEventStats = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Only admin can view event statistics
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin') {
        throw new errorResponse_1.default(`User ${req.user._id} is not authorized to view event statistics`, 403);
    }
    // Get total events count
    const totalEvents = yield event_model_1.default.countDocuments();
    // Get upcoming events count
    const upcomingEvents = yield event_model_1.default.countDocuments({
        startDate: { $gt: new Date() },
        status: { $in: [event_model_1.EventStatus.DRAFT, event_model_1.EventStatus.PUBLISHED] },
    });
    // Get completed events count
    const completedEvents = yield event_model_1.default.countDocuments({
        status: event_model_1.EventStatus.COMPLETED,
    });
    // Get total registrations count
    const totalRegistrations = yield eventRegistration_model_1.default.countDocuments();
    // Get total attendees count (people who actually attended)
    const totalAttendees = yield eventAttendance_model_1.default.countDocuments({
        attended: true,
    });
    // Get events count by type
    const eventsByTypeData = yield event_model_1.default.aggregate([
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);
    // Convert to the expected format
    const eventsByType = {};
    eventsByTypeData.forEach((item) => {
        eventsByType[item._id] = item.count;
    });
    res.status(200).json({
        success: true,
        data: {
            totalEvents,
            upcomingEvents,
            completedEvents,
            totalRegistrations,
            totalAttendees,
            eventsByType,
        },
    });
}));
// @desc    Get user's penalties (for user dashboard)
// @route   GET /api/events/my-penalties
// @access  Private
exports.getUserPenalties = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    // Get penalty configuration for the year
    const penaltyConfig = yield meetingPenaltyConfig_model_1.default.findOne({
        year,
        isActive: true,
    });
    if (!penaltyConfig) {
        res.status(200).json({
            success: true,
            data: {
                year,
                meetingsAttended: 0,
                missedMeetings: 0,
                penaltyAmount: 0,
                totalPenalty: 0,
                penaltyType: 'none',
                isPaid: false,
            },
        });
        return;
    }
    // Get all meeting events for the year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    const meetings = yield event_model_1.default.find({
        eventType: event_model_1.EventType.MEETING,
        startDate: { $gte: startOfYear, $lte: endOfYear },
        status: { $in: [event_model_1.EventStatus.COMPLETED, event_model_1.EventStatus.PUBLISHED] },
    });
    // Count user's meeting attendance for the year
    const attendedMeetings = yield eventAttendance_model_1.default.countDocuments({
        eventId: { $in: meetings.map((m) => m._id) },
        userId,
        attended: true,
    });
    const totalMeetings = meetings.length;
    const missedMeetings = totalMeetings - attendedMeetings;
    // Find applicable penalty rule
    let applicablePenalty = penaltyConfig.defaultPenalty;
    let penaltyDescription = 'Default penalty';
    for (const rule of penaltyConfig.penaltyRules) {
        if (attendedMeetings >= rule.minAttendance &&
            attendedMeetings <= rule.maxAttendance) {
            applicablePenalty = {
                penaltyType: rule.penaltyType,
                penaltyValue: rule.penaltyValue,
            };
            penaltyDescription = rule.description;
            break;
        }
    }
    // Calculate penalty amount
    let penaltyAmount = 0;
    if (applicablePenalty.penaltyType === 'multiplier') {
        // Get user's annual dues
        const userAnnualDue = yield due_model_1.default.findOne({
            assignedTo: userId,
            dueTypeId: { $exists: true },
            year,
        }).populate('dueTypeId');
        if (userAnnualDue) {
            penaltyAmount = userAnnualDue.amount * applicablePenalty.penaltyValue;
        }
    }
    else {
        penaltyAmount = applicablePenalty.penaltyValue;
    }
    // Check if penalty has been paid
    const penaltyDue = yield due_model_1.default.findOne({
        assignedTo: userId,
        title: `Meeting Attendance Penalty ${year}`,
        year,
        isPenalty: true,
    });
    const isPaid = penaltyDue ? penaltyDue.paymentStatus === 'paid' : false;
    res.status(200).json({
        success: true,
        data: {
            year,
            meetingsAttended: attendedMeetings,
            totalMeetings,
            missedMeetings,
            penaltyAmount,
            totalPenalty: penaltyAmount,
            penaltyType: applicablePenalty.penaltyType,
            penaltyDescription,
            isPaid,
            penaltyDue: penaltyDue || null,
        },
    });
}));
// @desc    Get user's event registrations (for user dashboard)
// @route   GET /api/events/my-registrations
// @access  Private
exports.getUserRegistrations = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // Build query
    const query = { userId };
    // Filter by status if provided
    if (req.query.status) {
        query.status = req.query.status;
    }
    // Filter by date range if provided
    if (req.query.startDate || req.query.endDate) {
        const eventQuery = {};
        if (req.query.startDate) {
            eventQuery.startDate = {
                $gte: new Date(req.query.startDate),
            };
        }
        if (req.query.endDate) {
            eventQuery.endDate = { $lte: new Date(req.query.endDate) };
        }
        // Get event IDs that match the date criteria
        const matchingEvents = yield event_model_1.default.find(eventQuery).select('_id');
        query.eventId = { $in: matchingEvents.map((e) => e._id) };
    }
    const total = yield eventRegistration_model_1.default.countDocuments(query);
    const registrations = yield eventRegistration_model_1.default.find(query)
        .populate({
        path: 'eventId',
        select: 'title description startDate endDate location eventType status requiresRegistration registrationFee',
        populate: {
            path: 'createdBy',
            select: 'firstName lastName email',
        },
    })
        .populate('userId', 'firstName lastName email')
        .sort({ registrationDate: -1 })
        .skip(startIndex)
        .limit(limit);
    // For each registration, check if user attended
    const registrationsWithAttendance = yield Promise.all(registrations.map((registration) => __awaiter(void 0, void 0, void 0, function* () {
        const attendance = yield eventAttendance_model_1.default.findOne({
            eventId: registration.eventId,
            userId: registration.userId,
        });
        return Object.assign(Object.assign({}, registration.toObject()), { attended: attendance ? attendance.attended : false, attendanceMarkedAt: attendance ? attendance.markedAt : null });
    })));
    res.status(200).json({
        success: true,
        count: registrations.length,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            total,
        },
        data: registrationsWithAttendance,
    });
}));
// @desc    Get event registrations
// @route   GET /api/events/:id/registrations
// @access  Private
exports.getEventRegistrations = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const eventId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // Check if event exists
    const event = yield event_model_1.default.findById(eventId);
    if (!event) {
        res.status(404).json({
            success: false,
            message: 'Event not found',
        });
        return;
    }
    // Build query
    const query = { eventId: eventId };
    // Filter by registration status if provided
    if (req.query.status) {
        query.status = req.query.status;
    }
    // Get total count for pagination
    const total = yield eventRegistration_model_1.default.countDocuments(query);
    // Get registrations with pagination
    const registrations = yield eventRegistration_model_1.default.find(query)
        .populate('userId', 'firstName lastName email profileImage phoneNumber')
        .populate('eventId', 'title eventType startDate endDate')
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);
    // Get all attendance data for this event in a single query
    const userIds = registrations.map((reg) => reg.userId._id || reg.userId);
    const attendanceRecords = yield eventAttendance_model_1.default.find({
        eventId: eventId,
        userId: { $in: userIds },
    });
    // Create a map for quick attendance lookup
    const attendanceMap = new Map();
    attendanceRecords.forEach((attendance) => {
        attendanceMap.set(attendance.userId.toString(), {
            present: attendance.attended,
            checkedInAt: attendance.markedAt,
            notes: attendance.notes,
        });
    });
    // Combine registrations with attendance data
    const registrationsWithAttendance = registrations.map((registration) => {
        const userId = registration.userId._id || registration.userId;
        const attendance = attendanceMap.get(userId.toString()) || null;
        return Object.assign(Object.assign({}, registration.toObject()), { attendance });
    });
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    res.status(200).json({
        success: true,
        count: registrations.length,
        total,
        page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        data: registrationsWithAttendance,
    });
}));
// @desc    Get user's event history (for attendance tracking)
// @route   GET /api/events/my-history
// @access  Private
exports.getUserEventHistory = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // Get user's event registrations with attendance data
    const registrations = yield eventRegistration_model_1.default.find({ userId })
        .populate({
        path: 'eventId',
        select: 'title description startDate endDate location eventType status',
        populate: {
            path: 'createdBy',
            select: 'firstName lastName email',
        },
    })
        .sort({ registrationDate: -1 })
        .skip(startIndex)
        .limit(limit);
    // Get ALL attendance records for the user (not just for registered events)
    // This ensures admin-marked attendance is included even without registration
    const attendanceRecords = yield eventAttendance_model_1.default.find({
        userId,
    }).populate({
        path: 'eventId',
        select: 'title description startDate endDate location eventType status',
    });
    // Create attendance map for quick lookup
    const attendanceMap = new Map();
    attendanceRecords.forEach((record) => {
        attendanceMap.set(record.eventId.toString(), {
            eventId: record.eventId,
            attended: record.attended,
            attendedAt: record.markedAt,
            notes: record.notes,
        });
    });
    // Get all unique event IDs (from both registrations and attendance)
    const registrationEventIds = registrations.map((reg) => reg.eventId._id.toString());
    const attendanceEventIds = attendanceRecords.map((att) => att.eventId._id.toString());
    const allEventIds = [
        ...new Set([...registrationEventIds, ...attendanceEventIds]),
    ];
    // Get all events for complete event history
    const allEvents = yield event_model_1.default.find({
        _id: { $in: allEventIds },
    }).populate('createdBy', 'firstName lastName email');
    // Create a map of registrations by event ID
    const registrationMap = new Map();
    registrations.forEach((reg) => {
        registrationMap.set(reg.eventId._id.toString(), reg.toObject());
    });
    // Combine registration and attendance data for all events
    const eventHistory = allEvents.map((event) => {
        const eventIdStr = event._id.toString();
        const registration = registrationMap.get(eventIdStr);
        const attendance = attendanceMap.get(eventIdStr);
        return {
            event: event.toObject(),
            registration: registration || null,
            attendance: attendance || null,
        };
    });
    // Get total count for pagination (based on all events with attendance or registration)
    const totalUniqueEvents = allEventIds.length;
    res.status(200).json({
        success: true,
        count: eventHistory.length,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalUniqueEvents / limit),
            total: totalUniqueEvents,
        },
        data: {
            registrations: registrations,
            attendance: attendanceRecords,
            eventHistory,
            // Include summary for easy frontend access
            summary: {
                totalEvents: allEvents.length,
                totalRegistrations: registrations.length,
                totalAttendedEvents: attendanceRecords.filter((att) => att.attended)
                    .length,
            },
        },
    });
}));
// Helper function to send notifications to all users
function sendEventNotifications(eventId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const event = yield event_model_1.default.findById(eventId).populate('createdBy', 'firstName lastName');
            if (!event)
                return;
            const users = yield user_model_1.default.find({
                role: { $in: ['member', 'pharmacy'] },
                isActive: true,
            });
            // Create notification records for all users
            const notifications = users.map((user) => ({
                eventId: event._id,
                userId: user._id,
                seen: false,
                acknowledged: false,
                emailSent: false,
            }));
            yield eventNotification_model_1.default.insertMany(notifications);
            // Send email notifications
            for (const user of users) {
                try {
                    yield email_service_1.default.sendEmail({
                        to: user.email,
                        subject: `New Event: ${event.title}`,
                        template: 'event-notification',
                        context: {
                            firstName: user.firstName,
                            lastName: user.lastName,
                            eventTitle: event.title,
                            eventDescription: event.description,
                            eventType: event.eventType.toUpperCase(),
                            eventDate: event.startDate.toLocaleDateString(),
                            eventTime: event.startDate.toLocaleTimeString(),
                            eventLocation: event.location,
                            organizer: event.organizer,
                            requiresRegistration: event.requiresRegistration,
                            registrationDeadline: (_a = event.registrationDeadline) === null || _a === void 0 ? void 0 : _a.toLocaleDateString(),
                            registrationFee: event.registrationFee,
                            isMeeting: event.eventType === event_model_1.EventType.MEETING,
                            dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
                        },
                    });
                    // Mark email as sent
                    yield eventNotification_model_1.default.findOneAndUpdate({ eventId: event._id, userId: user._id }, { emailSent: true, emailSentAt: new Date() });
                }
                catch (emailError) {
                    console.error(`Failed to send email to ${user.email}:`, emailError);
                }
            }
        }
        catch (error) {
            console.error('Error sending event notifications:', error);
        }
    });
}
// Meeting Penalty Configuration Controllers
// @desc    Get penalty configuration for a year
// @route   GET /api/events/penalty-config/:year
// @access  Private (Admin only)
exports.getPenaltyConfig = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const year = parseInt(req.params.year);
    const config = yield meetingPenaltyConfig_model_1.default.findOne({ year }).populate('createdBy', 'firstName lastName email');
    if (!config) {
        return next(new errorResponse_1.default(`Penalty configuration not found for year ${year}`, 404));
    }
    res.status(200).json({
        success: true,
        data: config,
    });
}));
// @desc    Create or update penalty configuration
// @route   POST /api/events/penalty-config
// @access  Private (Admin only)
exports.createPenaltyConfig = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const config = yield meetingPenaltyConfig_model_1.default.findOneAndUpdate({ year: req.body.year }, Object.assign(Object.assign({}, req.body), { createdBy: userId }), {
        new: true,
        upsert: true,
        runValidators: true,
    }).populate('createdBy', 'firstName lastName email');
    res.status(200).json({
        success: true,
        data: config,
    });
}));
// @desc    Get all penalty configurations
// @route   GET /api/events/penalty-configs
// @access  Private (Admin only)
exports.getAllPenaltyConfigs = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const configs = yield meetingPenaltyConfig_model_1.default.find()
        .populate('createdBy', 'firstName lastName email')
        .sort({ year: -1 });
    res.status(200).json({
        success: true,
        count: configs.length,
        data: configs,
    });
}));
// Helper function to send attendance warning notifications
function sendAttendanceWarnings(year) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get all meeting events for the year
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year, 11, 31);
            const meetings = yield event_model_1.default.find({
                eventType: event_model_1.EventType.MEETING,
                startDate: { $gte: startOfYear, $lte: endOfYear },
                status: { $in: [event_model_1.EventStatus.COMPLETED, event_model_1.EventStatus.PUBLISHED] },
            });
            // Get remaining meetings for the year
            const now = new Date();
            const remainingMeetings = yield event_model_1.default.find({
                eventType: event_model_1.EventType.MEETING,
                startDate: { $gte: now, $lte: endOfYear },
                status: { $in: [event_model_1.EventStatus.PUBLISHED, event_model_1.EventStatus.DRAFT] },
            });
            if (meetings.length === 0) {
                console.log(`No meetings found for ${year}. Skipping attendance warnings.`);
                return;
            }
            const totalMeetings = meetings.length;
            const attendanceThreshold = 0.5; // 50% threshold
            // Get all active members
            const users = yield user_model_1.default.find({
                role: { $in: ['member', 'pharmacy'] },
                isActive: true,
            });
            console.log(`Checking attendance for ${users.length} users to send warnings for ${year}`);
            for (const user of users) {
                // Count user's meeting attendance for the year
                const attendanceRecords = yield eventAttendance_model_1.default.find({
                    eventId: { $in: meetings.map((m) => m._id) },
                    userId: user._id,
                });
                const attendedMeetings = attendanceRecords.filter((record) => record.attended).length;
                const attendancePercentage = totalMeetings > 0 ? attendedMeetings / totalMeetings : 0;
                // Send warning if attendance is below 50% and there are still meetings left in the year
                if (attendancePercentage < attendanceThreshold &&
                    remainingMeetings.length > 0) {
                    const missedMeetings = totalMeetings - attendedMeetings;
                    try {
                        yield email_service_1.default.sendEmail({
                            to: user.email,
                            subject: `⚠️ Meeting Attendance Warning - ACPN OTA Zone`,
                            template: 'attendance-warning',
                            context: {
                                firstName: user.firstName,
                                lastName: user.lastName,
                                year,
                                nextYear: year + 1,
                                totalMeetings,
                                attendedMeetings,
                                missedMeetings,
                                attendancePercentage: Math.round(attendancePercentage * 100),
                                remainingMeetings: remainingMeetings.length,
                                dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
                            },
                        });
                        console.log(`Sent attendance warning to ${user.email} (${Math.round(attendancePercentage * 100)}% attendance)`);
                    }
                    catch (emailError) {
                        console.error(`Failed to send attendance warning to ${user.email}:`, emailError);
                    }
                }
            }
            console.log(`Attendance warning notifications for ${year} completed successfully`);
        }
        catch (error) {
            console.error('Error sending attendance warnings:', error);
            throw error;
        }
    });
}
// Helper function to calculate meeting penalties based on 50% threshold
function calculateMeetingPenalties(year) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get all meeting events for the year
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year, 11, 31);
            const meetings = yield event_model_1.default.find({
                eventType: event_model_1.EventType.MEETING,
                startDate: { $gte: startOfYear, $lte: endOfYear },
                status: { $in: [event_model_1.EventStatus.COMPLETED, event_model_1.EventStatus.PUBLISHED] },
            });
            if (meetings.length === 0) {
                console.log(`No meetings found for ${year}. Skipping penalty calculation.`);
                return;
            }
            const totalMeetings = meetings.length;
            const attendanceThreshold = 0.5; // 50% threshold
            // Get all active members
            const users = yield user_model_1.default.find({
                role: { $in: ['member', 'pharmacy'] },
                isActive: true,
            });
            console.log(`Calculating penalties for ${users.length} users based on ${totalMeetings} meetings in ${year}`);
            for (const user of users) {
                // Count user's meeting attendance for the year
                const attendanceRecords = yield eventAttendance_model_1.default.find({
                    eventId: { $in: meetings.map((m) => m._id) },
                    userId: user._id,
                });
                const attendedMeetings = attendanceRecords.filter((record) => record.attended).length;
                const attendancePercentage = totalMeetings > 0 ? attendedMeetings / totalMeetings : 0;
                // Only apply penalty if attendance is below 50%
                if (attendancePercentage < attendanceThreshold) {
                    // Get user's annual dues
                    const userAnnualDues = yield due_model_1.default.find({
                        assignedTo: user._id,
                        year,
                        isPenalty: false, // Exclude existing penalties
                    });
                    // Calculate total annual dues
                    const totalAnnualDues = userAnnualDues.reduce((sum, due) => sum + due.amount, 0);
                    // Penalty is half of the annual dues
                    const penaltyAmount = totalAnnualDues * 0.5;
                    if (penaltyAmount > 0) {
                        // Create or update penalty due
                        yield due_model_1.default.findOneAndUpdate({
                            assignedTo: user._id,
                            title: `Meeting Attendance Penalty ${year}`,
                            year,
                            isPenalty: true,
                        }, {
                            assignedTo: user._id,
                            title: `Meeting Attendance Penalty ${year}`,
                            description: `Penalty for attending only ${attendedMeetings} out of ${totalMeetings} meetings (${Math.round(attendancePercentage * 100)}%) in ${year}`,
                            amount: penaltyAmount,
                            dueDate: new Date(year + 1, 2, 31), // March 31st of next year
                            status: 'pending',
                            year,
                            isPenalty: true,
                        }, { upsert: true });
                        console.log(`Applied penalty of ${penaltyAmount} to user ${user.email} (${Math.round(attendancePercentage * 100)}% attendance)`);
                    }
                }
                else {
                    // Remove any existing penalty if the user now meets the threshold
                    const existingPenalty = yield due_model_1.default.findOne({
                        assignedTo: user._id,
                        title: `Meeting Attendance Penalty ${year}`,
                        year,
                        isPenalty: true,
                    });
                    if (existingPenalty) {
                        yield due_model_1.default.findByIdAndDelete(existingPenalty._id);
                        console.log(`Removed penalty for user ${user.email} as they now meet the attendance threshold`);
                    }
                }
            }
            console.log(`Penalty calculation for ${year} completed successfully`);
        }
        catch (error) {
            console.error('Error calculating meeting penalties:', error);
            throw error;
        }
    });
}
// @desc    Calculate meeting penalties for a year
// @route   POST /api/events/calculate-penalties/:year
// @access  Private (Admin only)
exports.calculatePenalties = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const year = parseInt(req.params.year);
    if (!year || isNaN(year)) {
        throw new errorResponse_1.default('Invalid year provided', 400);
    }
    yield calculateMeetingPenalties(year);
    res.status(200).json({
        success: true,
        message: `Penalties for ${year} have been calculated successfully.`,
    });
}));
// @desc    Send attendance warnings for a year
// @route   POST /api/events/send-warnings/:year
// @access  Private (Admin only)
exports.sendAttendanceWarningsForYear = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const year = parseInt(req.params.year);
    if (!year || isNaN(year)) {
        throw new errorResponse_1.default('Invalid year provided', 400);
    }
    yield sendAttendanceWarnings(year);
    res.status(200).json({
        success: true,
        message: `Attendance warnings for ${year} have been sent successfully.`,
    });
}));
// @desc    Publish an event (change status from draft to published)
// @route   PATCH /api/events/:id/publish
// @access  Private (Admin, Superadmin, Secretary)
exports.publishEvent = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield event_model_1.default.findById(req.params.id);
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${req.params.id}`, 404));
    }
    console.log(`Attempting to publish event ${req.params.id} with current status: ${event.status}`);
    // Allow publishing from draft or completed states
    // Only don't allow re-publishing already published events
    if (event.status === event_model_1.EventStatus.PUBLISHED) {
        return next(new errorResponse_1.default(`This event is already published. Current status: ${event.status}`, 400));
    }
    // Update event status to published
    event.status = event_model_1.EventStatus.PUBLISHED;
    yield event.save();
    res.status(200).json({
        success: true,
        data: event,
    });
}));
// @desc    Cancel an event (change status to cancelled)
// @route   PATCH /api/events/:id/cancel
// @access  Private (Admin, Superadmin, Secretary)
exports.cancelEvent = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield event_model_1.default.findById(req.params.id);
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${req.params.id}`, 404));
    }
    // Only published or draft events can be cancelled
    if (![event_model_1.EventStatus.PUBLISHED, event_model_1.EventStatus.DRAFT].includes(event.status)) {
        return next(new errorResponse_1.default(`Only published or draft events can be cancelled. Current status: ${event.status}`, 400));
    }
    // Update event status to cancelled
    event.status = event_model_1.EventStatus.CANCELLED;
    yield event.save();
    res.status(200).json({
        success: true,
        data: event,
    });
}));
// @desc    Bulk register all members for an event
// @route   POST /api/events/:id/bulk-register
// @access  Private (Admin only)
exports.bulkRegisterAllMembers = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const eventId = req.params.id;
    const event = yield event_model_1.default.findById(eventId);
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${eventId}`, 404));
    }
    // Find all users with role 'member'
    const members = yield user_model_1.default.find({ role: 'member', isActive: true });
    let createdCount = 0;
    let alreadyRegisteredCount = 0;
    let errors = [];
    for (const member of members) {
        const existing = yield eventRegistration_model_1.default.findOne({ eventId, userId: member._id });
        if (existing) {
            alreadyRegisteredCount++;
            continue;
        }
        try {
            yield eventRegistration_model_1.default.create({
                eventId,
                userId: member._id,
                status: eventRegistration_model_1.RegistrationStatus.REGISTERED,
                paymentStatus: event.registrationFee ? 'pending' : 'waived',
            });
            createdCount++;
        }
        catch (err) {
            let errorMsg = 'Unknown error';
            if (err instanceof Error) {
                errorMsg = err.message;
            }
            else if (typeof err === 'string') {
                errorMsg = err;
            }
            errors.push({ userId: member._id, error: errorMsg });
        }
    }
    res.status(200).json({
        success: true,
        message: `Bulk registration complete. ${createdCount} new registrations, ${alreadyRegisteredCount} already registered.`,
        createdCount,
        alreadyRegisteredCount,
        errors,
    });
}));
