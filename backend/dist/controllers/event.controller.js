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
exports.getEventStats = exports.getEventAttendees = exports.updatePaymentStatus = exports.markAttendance = exports.unregisterFromEvent = exports.registerForEvent = exports.cancelEvent = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEvent = exports.getAllEvents = void 0;
const event_model_1 = __importStar(require("../models/event.model"));
const eventAttendee_model_1 = __importStar(require("../models/eventAttendee.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
// @desc    Get all events
// @route   GET /api/events
// @access  Private
exports.getAllEvents = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Implement pagination, filtering and sorting
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // Build query
    const query = {};
    // Filter by status if provided
    if (req.query.status) {
        query.status = req.query.status;
    }
    // Filter by date range if provided
    if (req.query.startDate) {
        query.startDate = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
        query.endDate = { $lte: new Date(req.query.endDate) };
    }
    // Search by title or description
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        query.$or = [
            { title: searchRegex },
            { description: searchRegex },
            { location: searchRegex },
        ];
    }
    const events = yield event_model_1.default.find(query)
        .populate({
        path: 'createdBy',
        select: 'firstName lastName email',
    })
        .populate({
        path: 'attendees',
        select: 'userId attendanceStatus paymentStatus',
        options: { limit: 5 }, // Just get a sample of attendees
    })
        .skip(startIndex)
        .limit(limit)
        .sort({ startDate: -1 });
    // Get total count
    const total = yield event_model_1.default.countDocuments(query);
    // For each event, get the attendee count
    const eventsWithCounts = yield Promise.all(events.map((event) => __awaiter(void 0, void 0, void 0, function* () {
        const attendeeCount = yield eventAttendee_model_1.default.countDocuments({
            eventId: event._id,
        });
        const eventObj = event.toObject();
        return Object.assign(Object.assign({}, eventObj), { attendeeCount });
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
    const event = yield event_model_1.default.findById(req.params.id)
        .populate({
        path: 'createdBy',
        select: 'firstName lastName email',
    })
        .populate({
        path: 'attendees',
        select: 'userId attendanceStatus paymentStatus registrationDate',
        populate: {
            path: 'userId',
            select: 'firstName lastName email phone',
        },
    });
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${req.params.id}`, 404));
    }
    // Get attendee count
    const attendeeCount = yield eventAttendee_model_1.default.countDocuments({
        eventId: event._id,
    });
    // Check if the user is registered for this event
    const isRegistered = yield eventAttendee_model_1.default.findOne({
        eventId: event._id,
        userId: req.user._id,
    });
    const eventObj = event.toObject();
    res.status(200).json({
        success: true,
        data: Object.assign(Object.assign({}, eventObj), { attendeeCount, isUserRegistered: !!isRegistered, userRegistration: isRegistered || null }),
    });
}));
// @desc    Create new event
// @route   POST /api/events
// @access  Private/Admin/Secretary
exports.createEvent = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Only admin and secretary can create events
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to create events`, 403));
    }
    // Add user to req.body
    req.body.createdBy = req.user._id;
    // Validate dates
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    if (startDate > endDate) {
        return next(new errorResponse_1.default('End date must be after start date', 400));
    }
    const event = yield event_model_1.default.create(req.body);
    res.status(201).json({
        success: true,
        data: event,
    });
}));
// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin/Secretary
exports.updateEvent = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let event = yield event_model_1.default.findById(req.params.id);
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${req.params.id}`, 404));
    }
    // Check if user is admin or the secretary
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to update events`, 403));
    }
    // Validate dates if they are being updated
    if (req.body.startDate && req.body.endDate) {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);
        if (startDate > endDate) {
            return next(new errorResponse_1.default('End date must be after start date', 400));
        }
    }
    event = yield event_model_1.default.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: event,
    });
}));
// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin/Secretary
exports.deleteEvent = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield event_model_1.default.findById(req.params.id);
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${req.params.id}`, 404));
    }
    // Check if user is admin or the secretary
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to delete events`, 403));
    }
    // Check if there are attendees
    const attendeeCount = yield eventAttendee_model_1.default.countDocuments({
        eventId: event._id,
    });
    if (attendeeCount > 0 && event.status !== event_model_1.EventStatus.CANCELLED) {
        return next(new errorResponse_1.default(`Cannot delete an event with registered attendees. Consider cancelling it instead.`, 400));
    }
    // Remove all attendees if any
    yield eventAttendee_model_1.default.deleteMany({ eventId: event._id });
    // Then delete the event
    yield event.deleteOne();
    res.status(200).json({
        success: true,
        data: {},
    });
}));
// @desc    Cancel event
// @route   PUT /api/events/:id/cancel
// @access  Private/Admin/Secretary
exports.cancelEvent = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let event = yield event_model_1.default.findById(req.params.id);
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${req.params.id}`, 404));
    }
    // Check if user is admin or the secretary
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to cancel events`, 403));
    }
    // Set status to cancelled
    event = yield event_model_1.default.findByIdAndUpdate(req.params.id, { status: event_model_1.EventStatus.CANCELLED }, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: event,
    });
}));
// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private
exports.registerForEvent = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield event_model_1.default.findById(req.params.id);
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${req.params.id}`, 404));
    }
    if (event.status === event_model_1.EventStatus.CANCELLED) {
        return next(new errorResponse_1.default(`Cannot register for a cancelled event`, 400));
    }
    if (event.status === event_model_1.EventStatus.COMPLETED) {
        return next(new errorResponse_1.default(`Cannot register for a completed event`, 400));
    }
    // Check if event has maximum attendees limit and if it's reached
    if (event.maxAttendees) {
        const currentAttendees = yield eventAttendee_model_1.default.countDocuments({
            eventId: event._id,
        });
        if (currentAttendees >= event.maxAttendees) {
            return next(new errorResponse_1.default(`Event has reached maximum capacity`, 400));
        }
    }
    // Check if user is already registered
    const existingRegistration = yield eventAttendee_model_1.default.findOne({
        eventId: event._id,
        userId: req.user._id,
    });
    if (existingRegistration) {
        return next(new errorResponse_1.default(`You are already registered for this event`, 400));
    }
    // Set payment status based on whether the event requires payment
    const paymentStatus = event.requiresPayment
        ? eventAttendee_model_1.PaymentStatus.PENDING
        : eventAttendee_model_1.PaymentStatus.NOT_REQUIRED;
    // Create attendee record
    const attendee = yield eventAttendee_model_1.default.create({
        eventId: event._id,
        userId: req.user._id,
        paymentStatus,
        attendanceStatus: eventAttendee_model_1.AttendanceStatus.REGISTERED,
    });
    res.status(201).json({
        success: true,
        data: attendee,
    });
}));
// @desc    Unregister from event
// @route   DELETE /api/events/:id/register
// @access  Private
exports.unregisterFromEvent = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield event_model_1.default.findById(req.params.id);
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${req.params.id}`, 404));
    }
    if (event.status === event_model_1.EventStatus.COMPLETED) {
        return next(new errorResponse_1.default(`Cannot unregister from a completed event`, 400));
    }
    const registration = yield eventAttendee_model_1.default.findOne({
        eventId: event._id,
        userId: req.user._id,
    });
    if (!registration) {
        return next(new errorResponse_1.default(`You are not registered for this event`, 404));
    }
    // Only allow unregistering if payment status is not 'paid'
    if (event.requiresPayment &&
        registration.paymentStatus === eventAttendee_model_1.PaymentStatus.PAID) {
        return next(new errorResponse_1.default(`Cannot unregister from an event you've already paid for. Please contact the administrator.`, 400));
    }
    yield registration.deleteOne();
    res.status(200).json({
        success: true,
        data: {},
    });
}));
// @desc    Mark attendance
// @route   PUT /api/events/:id/attendance/:userId
// @access  Private/Admin/Secretary
exports.markAttendance = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield event_model_1.default.findById(req.params.id);
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${req.params.id}`, 404));
    }
    // Check if user is admin or the secretary
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to mark attendance`, 403));
    }
    let registration = yield eventAttendee_model_1.default.findOne({
        eventId: event._id,
        userId: req.params.userId,
    });
    if (!registration) {
        return next(new errorResponse_1.default(`User is not registered for this event`, 404));
    }
    // Update attendance status
    const { attendanceStatus } = req.body;
    if (!attendanceStatus ||
        !Object.values(eventAttendee_model_1.AttendanceStatus).includes(attendanceStatus)) {
        return next(new errorResponse_1.default(`Invalid attendance status. Must be one of: ${Object.values(eventAttendee_model_1.AttendanceStatus).join(', ')}`, 400));
    }
    registration = yield eventAttendee_model_1.default.findOneAndUpdate({
        eventId: event._id,
        userId: req.params.userId,
    }, { attendanceStatus }, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: registration,
    });
}));
// @desc    Update payment status
// @route   PUT /api/events/:id/payment/:userId
// @access  Private/Admin/Treasurer
exports.updatePaymentStatus = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield event_model_1.default.findById(req.params.id);
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${req.params.id}`, 404));
    }
    // Check if user is admin or treasurer
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to update payment status`, 403));
    }
    if (!event.requiresPayment) {
        return next(new errorResponse_1.default(`This event does not require payment`, 400));
    }
    let registration = yield eventAttendee_model_1.default.findOne({
        eventId: event._id,
        userId: req.params.userId,
    });
    if (!registration) {
        return next(new errorResponse_1.default(`User is not registered for this event`, 404));
    }
    // Update payment status
    const { paymentStatus, paymentReference } = req.body;
    if (!paymentStatus ||
        !Object.values(eventAttendee_model_1.PaymentStatus).includes(paymentStatus)) {
        return next(new errorResponse_1.default(`Invalid payment status. Must be one of: ${Object.values(eventAttendee_model_1.PaymentStatus).join(', ')}`, 400));
    }
    registration = yield eventAttendee_model_1.default.findOneAndUpdate({
        eventId: event._id,
        userId: req.params.userId,
    }, { paymentStatus, paymentReference }, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: registration,
    });
}));
// @desc    Get event attendees
// @route   GET /api/events/:id/attendees
// @access  Private/Admin/Secretary
exports.getEventAttendees = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield event_model_1.default.findById(req.params.id);
    if (!event) {
        return next(new errorResponse_1.default(`Event not found with id of ${req.params.id}`, 404));
    }
    // Check if user is admin or secretary
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to view attendees`, 403));
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const startIndex = (page - 1) * limit;
    // Build query
    const query = { eventId: event._id };
    // Filter by attendance status if provided
    if (req.query.attendanceStatus) {
        query.attendanceStatus = req.query.attendanceStatus;
    }
    // Filter by payment status if provided
    if (req.query.paymentStatus) {
        query.paymentStatus = req.query.paymentStatus;
    }
    const attendees = yield eventAttendee_model_1.default.find(query)
        .populate({
        path: 'userId',
        select: 'firstName lastName email phone',
        populate: {
            path: 'pharmacy',
            select: 'name registrationNumber',
        },
    })
        .skip(startIndex)
        .limit(limit)
        .sort({ registrationDate: -1 });
    // Get total count
    const total = yield eventAttendee_model_1.default.countDocuments(query);
    res.status(200).json({
        success: true,
        count: attendees.length,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            total,
        },
        data: attendees,
    });
}));
// @desc    Get event statistics
// @route   GET /api/events/stats
// @access  Private/Admin
exports.getEventStats = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Only admin can view event statistics
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        throw new errorResponse_1.default(`User ${req.user._id} is not authorized to view event statistics`, 403);
    }
    // Count events by status
    const eventsByStatus = yield event_model_1.default.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);
    // Count registration by attendance status
    const byAttendanceStatus = yield eventAttendee_model_1.default.aggregate([
        { $group: { _id: '$attendanceStatus', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);
    // Count registration by payment status
    const byPaymentStatus = yield eventAttendee_model_1.default.aggregate([
        { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);
    // Get monthly events count (for current year)
    const currentYear = new Date().getFullYear();
    const monthlyEvents = yield event_model_1.default.aggregate([
        {
            $match: {
                startDate: {
                    $gte: new Date(`${currentYear}-01-01`),
                    $lte: new Date(`${currentYear}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: '$startDate' },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);
    // Get upcoming events
    const upcomingEvents = yield event_model_1.default.find({
        status: event_model_1.EventStatus.UPCOMING,
    })
        .select('title startDate location')
        .sort({ startDate: 1 })
        .limit(5);
    res.status(200).json({
        success: true,
        data: {
            eventsByStatus,
            byAttendanceStatus,
            byPaymentStatus,
            monthlyEvents,
            upcomingEvents,
        },
    });
}));
