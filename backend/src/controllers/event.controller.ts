import { Request, Response, NextFunction } from 'express';
import Event, { EventStatus } from '../models/event.model';
import EventAttendee, {
  AttendanceStatus,
  PaymentStatus,
} from '../models/eventAttendee.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all events
// @route   GET /api/events
// @access  Private
export const getAllEvents = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Implement pagination, filtering and sorting
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by date range if provided
    if (req.query.startDate) {
      query.startDate = { $gte: new Date(req.query.startDate as string) };
    }

    if (req.query.endDate) {
      query.endDate = { $lte: new Date(req.query.endDate as string) };
    }

    // Search by title or description
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
      ];
    }

    const events = await Event.find(query)
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
    const total = await Event.countDocuments(query);

    // For each event, get the attendee count
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const attendeeCount = await EventAttendee.countDocuments({
          eventId: event._id,
        });

        const eventObj = event.toObject();
        return {
          ...eventObj,
          attendeeCount,
        };
      })
    );

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
  }
);

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
export const getEvent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const event = await Event.findById(req.params.id)
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
      return next(
        new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
      );
    }

    // Get attendee count
    const attendeeCount = await EventAttendee.countDocuments({
      eventId: event._id,
    });

    // Check if the user is registered for this event
    const isRegistered = await EventAttendee.findOne({
      eventId: event._id,
      userId: req.user._id,
    });

    const eventObj = event.toObject();

    res.status(200).json({
      success: true,
      data: {
        ...eventObj,
        attendeeCount,
        isUserRegistered: !!isRegistered,
        userRegistration: isRegistered || null,
      },
    });
  }
);

// @desc    Create new event
// @route   POST /api/events
// @access  Private/Admin/Secretary
export const createEvent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only admin and secretary can create events
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to create events`,
          403
        )
      );
    }

    // Add user to req.body
    req.body.createdBy = req.user._id;

    // Validate dates
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    if (startDate > endDate) {
      return next(new ErrorResponse('End date must be after start date', 400));
    }

    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      data: event,
    });
  }
);

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin/Secretary
export const updateEvent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return next(
        new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is admin or the secretary
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to update events`,
          403
        )
      );
    }

    // Validate dates if they are being updated
    if (req.body.startDate && req.body.endDate) {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);

      if (startDate > endDate) {
        return next(
          new ErrorResponse('End date must be after start date', 400)
        );
      }
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: event,
    });
  }
);

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin/Secretary
export const deleteEvent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return next(
        new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is admin or the secretary
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to delete events`,
          403
        )
      );
    }

    // Check if there are attendees
    const attendeeCount = await EventAttendee.countDocuments({
      eventId: event._id,
    });

    if (attendeeCount > 0 && event.status !== EventStatus.CANCELLED) {
      return next(
        new ErrorResponse(
          `Cannot delete an event with registered attendees. Consider cancelling it instead.`,
          400
        )
      );
    }

    // Remove all attendees if any
    await EventAttendee.deleteMany({ eventId: event._id });

    // Then delete the event
    await event.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Cancel event
// @route   PUT /api/events/:id/cancel
// @access  Private/Admin/Secretary
export const cancelEvent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return next(
        new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is admin or the secretary
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to cancel events`,
          403
        )
      );
    }

    // Set status to cancelled
    event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: EventStatus.CANCELLED },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: event,
    });
  }
);

// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private
export const registerForEvent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return next(
        new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
      );
    }

    if (event.status === EventStatus.CANCELLED) {
      return next(
        new ErrorResponse(`Cannot register for a cancelled event`, 400)
      );
    }

    if (event.status === EventStatus.COMPLETED) {
      return next(
        new ErrorResponse(`Cannot register for a completed event`, 400)
      );
    }

    // Check if event has maximum attendees limit and if it's reached
    if (event.maxAttendees) {
      const currentAttendees = await EventAttendee.countDocuments({
        eventId: event._id,
      });

      if (currentAttendees >= event.maxAttendees) {
        return next(
          new ErrorResponse(`Event has reached maximum capacity`, 400)
        );
      }
    }

    // Check if user is already registered
    const existingRegistration = await EventAttendee.findOne({
      eventId: event._id,
      userId: req.user._id,
    });

    if (existingRegistration) {
      return next(
        new ErrorResponse(`You are already registered for this event`, 400)
      );
    }

    // Set payment status based on whether the event requires payment
    const paymentStatus = event.requiresPayment
      ? PaymentStatus.PENDING
      : PaymentStatus.NOT_REQUIRED;

    // Create attendee record
    const attendee = await EventAttendee.create({
      eventId: event._id,
      userId: req.user._id,
      paymentStatus,
      attendanceStatus: AttendanceStatus.REGISTERED,
    });

    res.status(201).json({
      success: true,
      data: attendee,
    });
  }
);

// @desc    Unregister from event
// @route   DELETE /api/events/:id/register
// @access  Private
export const unregisterFromEvent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return next(
        new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
      );
    }

    if (event.status === EventStatus.COMPLETED) {
      return next(
        new ErrorResponse(`Cannot unregister from a completed event`, 400)
      );
    }

    const registration = await EventAttendee.findOne({
      eventId: event._id,
      userId: req.user._id,
    });

    if (!registration) {
      return next(
        new ErrorResponse(`You are not registered for this event`, 404)
      );
    }

    // Only allow unregistering if payment status is not 'paid'
    if (
      event.requiresPayment &&
      registration.paymentStatus === PaymentStatus.PAID
    ) {
      return next(
        new ErrorResponse(
          `Cannot unregister from an event you've already paid for. Please contact the administrator.`,
          400
        )
      );
    }

    await registration.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Mark attendance
// @route   PUT /api/events/:id/attendance/:userId
// @access  Private/Admin/Secretary
export const markAttendance = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return next(
        new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is admin or the secretary
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to mark attendance`,
          403
        )
      );
    }

    let registration = await EventAttendee.findOne({
      eventId: event._id,
      userId: req.params.userId,
    });

    if (!registration) {
      return next(
        new ErrorResponse(`User is not registered for this event`, 404)
      );
    }

    // Update attendance status
    const { attendanceStatus } = req.body;

    if (
      !attendanceStatus ||
      !Object.values(AttendanceStatus).includes(attendanceStatus)
    ) {
      return next(
        new ErrorResponse(
          `Invalid attendance status. Must be one of: ${Object.values(
            AttendanceStatus
          ).join(', ')}`,
          400
        )
      );
    }

    registration = await EventAttendee.findOneAndUpdate(
      {
        eventId: event._id,
        userId: req.params.userId,
      },
      { attendanceStatus },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: registration,
    });
  }
);

// @desc    Update payment status
// @route   PUT /api/events/:id/payment/:userId
// @access  Private/Admin/Treasurer
export const updatePaymentStatus = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return next(
        new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is admin or treasurer
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to update payment status`,
          403
        )
      );
    }

    if (!event.requiresPayment) {
      return next(
        new ErrorResponse(`This event does not require payment`, 400)
      );
    }

    let registration = await EventAttendee.findOne({
      eventId: event._id,
      userId: req.params.userId,
    });

    if (!registration) {
      return next(
        new ErrorResponse(`User is not registered for this event`, 404)
      );
    }

    // Update payment status
    const { paymentStatus, paymentReference } = req.body;

    if (
      !paymentStatus ||
      !Object.values(PaymentStatus).includes(paymentStatus)
    ) {
      return next(
        new ErrorResponse(
          `Invalid payment status. Must be one of: ${Object.values(
            PaymentStatus
          ).join(', ')}`,
          400
        )
      );
    }

    registration = await EventAttendee.findOneAndUpdate(
      {
        eventId: event._id,
        userId: req.params.userId,
      },
      { paymentStatus, paymentReference },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: registration,
    });
  }
);

// @desc    Get event attendees
// @route   GET /api/events/:id/attendees
// @access  Private/Admin/Secretary
export const getEventAttendees = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return next(
        new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is admin or secretary
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to view attendees`,
          403
        )
      );
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const startIndex = (page - 1) * limit;

    // Build query
    const query: any = { eventId: event._id };

    // Filter by attendance status if provided
    if (req.query.attendanceStatus) {
      query.attendanceStatus = req.query.attendanceStatus;
    }

    // Filter by payment status if provided
    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus;
    }

    const attendees = await EventAttendee.find(query)
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
    const total = await EventAttendee.countDocuments(query);

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
  }
);

// @desc    Get event statistics
// @route   GET /api/events/stats
// @access  Private/Admin
export const getEventStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Only admin can view event statistics
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      throw new ErrorResponse(
        `User ${req.user._id} is not authorized to view event statistics`,
        403
      );
    }

    // Count events by status
    const eventsByStatus = await Event.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Count registration by attendance status
    const byAttendanceStatus = await EventAttendee.aggregate([
      { $group: { _id: '$attendanceStatus', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Count registration by payment status
    const byPaymentStatus = await EventAttendee.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Get monthly events count (for current year)
    const currentYear = new Date().getFullYear();
    const monthlyEvents = await Event.aggregate([
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
    const upcomingEvents = await Event.find({
      status: EventStatus.UPCOMING,
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
  }
);
