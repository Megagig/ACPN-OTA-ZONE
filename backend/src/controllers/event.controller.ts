import { Request, Response, NextFunction } from 'express';
import Event, { EventStatus, EventType } from '../models/event.model';
import EventRegistration, {
  RegistrationStatus,
} from '../models/eventRegistration.model';
import EventAttendance from '../models/eventAttendance.model';
import EventNotification from '../models/eventNotification.model';
import MeetingPenaltyConfig from '../models/meetingPenaltyConfig.model';
import User from '../models/user.model';
import Due from '../models/due.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';
import emailService from '../services/email.service';
import { v2 as cloudinary } from 'cloudinary';

// @desc    Get all events
// @route   GET /api/events
// @access  Private
export const getAllEvents = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    const query: any = {};

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
      query.startDate = { $gte: new Date(req.query.startDate as string) };
    }

    if (req.query.endDate) {
      query.endDate = { $lte: new Date(req.query.endDate as string) };
    }

    // Search by title, description, or location
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { organizer: searchRegex },
      ];
    }

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .populate({
        path: 'createdBy',
        select: 'firstName lastName email',
      })
      .sort({ startDate: 1 })
      .skip(startIndex)
      .limit(limit);

    // For each event, get registration and attendance counts
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await EventRegistration.countDocuments({
          eventId: event._id,
        });
        const attendanceCount = await EventAttendance.countDocuments({
          eventId: event._id,
          attended: true,
        });

        const eventObj = event.toObject();
        return {
          ...eventObj,
          registrationCount,
          attendanceCount,
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
    const event = await Event.findById(req.params.id).populate({
      path: 'createdBy',
      select: 'firstName lastName email',
    });

    if (!event) {
      return next(
        new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
      );
    }

    // Get registrations and attendance
    const registrations = await EventRegistration.find({ eventId: event._id })
      .populate('userId', 'firstName lastName email phone')
      .sort({ registrationDate: -1 });

    const attendance = await EventAttendance.find({ eventId: event._id })
      .populate('userId', 'firstName lastName email phone')
      .populate('markedBy', 'firstName lastName')
      .sort({ markedAt: -1 });

    // Mark as seen for current user
    const userId = (req as any).user.id;
    await EventNotification.findOneAndUpdate(
      { eventId: event._id, userId },
      { seen: true, seenAt: new Date() },
      { upsert: true }
    );

    const eventObj = event.toObject();
    res.status(200).json({
      success: true,
      data: {
        ...eventObj,
        registrations,
        attendance,
        registrationCount: registrations.length,
        attendanceCount: attendance.filter((a) => a.attended).length,
      },
    });
  }
);

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Admin only)
export const createEvent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;

    // Handle image upload if provided
    let imageUrl = '';
    if (req.body.image) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(
          req.body.image,
          {
            folder: 'events',
            resource_type: 'image',
            quality: 'auto:best',
            format: 'webp',
          }
        );
        imageUrl = uploadResponse.secure_url;
      } catch (error) {
        console.error('Image upload error:', error);
      }
    }

    const eventData = {
      ...req.body,
      createdBy: userId,
      imageUrl: imageUrl || undefined,
      // Make sure these fields are set correctly
      eventType: req.body.eventType || EventType.OTHER,
      organizer: req.body.organizer || 'ACPN',
      status: req.body.status || EventStatus.DRAFT,
    };

    const event = await Event.create(eventData);

    // Send notifications to all users
    await sendEventNotifications((event._id as string).toString());

    const populatedEvent = await Event.findById(event._id).populate(
      'createdBy',
      'firstName lastName email'
    );

    res.status(201).json({
      success: true,
      data: populatedEvent,
    });
  }
);

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin only)
export const updateEvent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return next(
        new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
      );
    }

    // Handle image upload if provided
    if (req.body.image) {
      try {
        // Delete old image if exists
        if (event.imageUrl) {
          const publicId = event.imageUrl.split('/').pop()?.split('.')[0];
          if (publicId) {
            await cloudinary.uploader.destroy(`events/${publicId}`);
          }
        }

        const uploadResponse = await cloudinary.uploader.upload(
          req.body.image,
          {
            folder: 'events',
            resource_type: 'image',
            quality: 'auto:best',
            format: 'webp',
          }
        );
        req.body.imageUrl = uploadResponse.secure_url;
      } catch (error) {
        console.error('Image upload error:', error);
      }
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: event,
    });
  }
);

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin only)
export const deleteEvent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return next(
        new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
      );
    }

    // Delete associated records
    await EventRegistration.deleteMany({ eventId: event._id });
    await EventAttendance.deleteMany({ eventId: event._id });
    await EventNotification.deleteMany({ eventId: event._id });

    // Delete image if exists
    if (event.imageUrl) {
      try {
        const publicId = event.imageUrl.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`events/${publicId}`);
        }
      } catch (error) {
        console.error('Image deletion error:', error);
      }
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private
export const registerForEvent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const eventId = req.params.id;
    const userId = (req as any).user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return next(
        new ErrorResponse(`Event not found with id of ${eventId}`, 404)
      );
    }

    // Check if registration is required
    if (!event.requiresRegistration) {
      return next(
        new ErrorResponse('This event does not require registration', 400)
      );
    }

    // Check if registration deadline has passed
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return next(new ErrorResponse('Registration deadline has passed', 400));
    }

    // Check if already registered
    const existingRegistration = await EventRegistration.findOne({
      eventId,
      userId,
    });

    if (existingRegistration) {
      return next(
        new ErrorResponse('You are already registered for this event', 400)
      );
    }

    // Check capacity
    if (event.capacity) {
      const currentRegistrations = await EventRegistration.countDocuments({
        eventId,
        status: {
          $in: [RegistrationStatus.REGISTERED, RegistrationStatus.CONFIRMED],
        },
      });

      if (currentRegistrations >= event.capacity) {
        // Add to waitlist
        await EventRegistration.create({
          eventId,
          userId,
          status: RegistrationStatus.WAITLIST,
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
    const registration = await EventRegistration.create({
      eventId,
      userId,
      status: RegistrationStatus.REGISTERED,
      paymentStatus: event.registrationFee ? 'pending' : 'waived',
      ...req.body,
    });

    const populatedRegistration = await EventRegistration.findById(
      registration._id
    )
      .populate('eventId', 'title startDate location')
      .populate('userId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: populatedRegistration,
    });
  }
);

// @desc    Cancel event registration
// @route   DELETE /api/events/:id/register
// @access  Private
export const cancelRegistration = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const eventId = req.params.id;
    const userId = (req as any).user.id;

    const registration = await EventRegistration.findOne({
      eventId,
      userId,
    });

    if (!registration) {
      return next(new ErrorResponse('Registration not found', 404));
    }

    await registration.deleteOne();

    // If there's a waitlist, promote the next person
    const waitlistRegistration = await EventRegistration.findOne({
      eventId,
      status: RegistrationStatus.WAITLIST,
    }).sort({ registrationDate: 1 });

    if (waitlistRegistration) {
      waitlistRegistration.status = RegistrationStatus.REGISTERED;
      await waitlistRegistration.save();

      // Send notification to promoted user
      // Implementation depends on notification system
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Mark attendance for event
// @route   POST /api/events/:id/attendance
// @access  Private (Admin only)
export const markAttendance = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const eventId = req.params.id;
    const adminId = (req as any).user.id;
    const { attendanceList } = req.body; // Array of { userId, attended, notes? }

    const event = await Event.findById(eventId);
    if (!event) {
      return next(
        new ErrorResponse(`Event not found with id of ${eventId}`, 404)
      );
    }

    // Check if event is ongoing (for meetings, only during meetings)
    if (event.eventType === EventType.MEETING) {
      const now = new Date();
      if (now < event.startDate || now > event.endDate) {
        return next(
          new ErrorResponse(
            'Attendance can only be marked during the meeting',
            400
          )
        );
      }
    }

    const attendanceRecords = [];

    for (const attendance of attendanceList) {
      const existingAttendance = await EventAttendance.findOne({
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
        await existingAttendance.save();
        attendanceRecords.push(existingAttendance);
      } else {
        // Create new record
        const newAttendance = await EventAttendance.create({
          eventId,
          userId: attendance.userId,
          attended: attendance.attended,
          markedBy: adminId,
          notes: attendance.notes,
        });
        attendanceRecords.push(newAttendance);
      }
    }

    // If this is a meeting, calculate penalties after attendance is marked
    if (event.eventType === EventType.MEETING) {
      await calculateMeetingPenalties(new Date().getFullYear());
    }

    const populatedRecords = await EventAttendance.find({
      _id: { $in: attendanceRecords.map((r) => r._id) },
    })
      .populate('userId', 'firstName lastName email')
      .populate('markedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: populatedRecords,
    });
  }
);

// @desc    Get user's events (for member dashboard)
// @route   GET /api/events/my-events
// @access  Private
export const getMyEvents = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    // Get all events
    const eventsQuery: any = {};

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

    const total = await Event.countDocuments(eventsQuery);
    const events = await Event.find(eventsQuery)
      .populate('createdBy', 'firstName lastName email')
      .sort({ startDate: 1 })
      .skip(startIndex)
      .limit(limit);

    // For each event, get user's registration and attendance status
    const eventsWithUserStatus = await Promise.all(
      events.map(async (event) => {
        const registration = await EventRegistration.findOne({
          eventId: event._id,
          userId,
        });

        const attendance = await EventAttendance.findOne({
          eventId: event._id,
          userId,
        });

        const notification = await EventNotification.findOne({
          eventId: event._id,
          userId,
        });

        return {
          ...event.toObject(),
          userRegistration: registration,
          userAttendance: attendance,
          notification: notification || { seen: false, acknowledged: false },
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
      data: eventsWithUserStatus,
    });
  }
);

// @desc    Acknowledge event notification
// @route   POST /api/events/:id/acknowledge
// @access  Private
export const acknowledgeEvent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const eventId = req.params.id;
    const userId = (req as any).user.id;

    await EventNotification.findOneAndUpdate(
      { eventId, userId },
      {
        acknowledged: true,
        acknowledgedAt: new Date(),
        seen: true,
        seenAt: new Date(),
      },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Get event statistics
// @route   GET /api/events/stats
// @access  Private (Admin only)
export const getEventStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Only admin can view event statistics
    if (
      (req as any).user.role !== 'admin' &&
      (req as any).user.role !== 'superadmin'
    ) {
      throw new ErrorResponse(
        `User ${(req as any).user._id} is not authorized to view event statistics`,
        403
      );
    }

    // Get total events count
    const totalEvents = await Event.countDocuments();

    // Get upcoming events count
    const upcomingEvents = await Event.countDocuments({
      startDate: { $gt: new Date() },
      status: { $in: [EventStatus.DRAFT, EventStatus.PUBLISHED] },
    });

    // Get completed events count
    const completedEvents = await Event.countDocuments({
      status: EventStatus.COMPLETED,
    });

    // Get total registrations count
    const totalRegistrations = await EventRegistration.countDocuments();

    // Get total attendees count (people who actually attended)
    const totalAttendees = await EventAttendance.countDocuments({
      attended: true,
    });

    // Get events count by type
    const eventsByTypeData = await Event.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Convert to the expected format
    const eventsByType: Record<string, number> = {};
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
  }
);

// @desc    Get user's penalties (for user dashboard)
// @route   GET /api/events/my-penalties
// @access  Private
export const getUserPenalties = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    // Get penalty configuration for the year
    const penaltyConfig = await MeetingPenaltyConfig.findOne({
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

    const meetings = await Event.find({
      eventType: EventType.MEETING,
      startDate: { $gte: startOfYear, $lte: endOfYear },
      status: { $in: [EventStatus.COMPLETED, EventStatus.PUBLISHED] },
    });

    // Count user's meeting attendance for the year
    const attendedMeetings = await EventAttendance.countDocuments({
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
      if (
        attendedMeetings >= rule.minAttendance &&
        attendedMeetings <= rule.maxAttendance
      ) {
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
      const userAnnualDue = await Due.findOne({
        assignedTo: userId,
        dueTypeId: { $exists: true },
        year,
      }).populate('dueTypeId');

      if (userAnnualDue) {
        penaltyAmount = userAnnualDue.amount * applicablePenalty.penaltyValue;
      }
    } else {
      penaltyAmount = applicablePenalty.penaltyValue;
    }

    // Check if penalty has been paid
    const penaltyDue = await Due.findOne({
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
  }
);

// @desc    Get user's event registrations (for user dashboard)
// @route   GET /api/events/my-registrations
// @access  Private
export const getUserRegistrations = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    const query: any = { userId };

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by date range if provided
    if (req.query.startDate || req.query.endDate) {
      const eventQuery: any = {};
      if (req.query.startDate) {
        eventQuery.startDate = {
          $gte: new Date(req.query.startDate as string),
        };
      }
      if (req.query.endDate) {
        eventQuery.endDate = { $lte: new Date(req.query.endDate as string) };
      }

      // Get event IDs that match the date criteria
      const matchingEvents = await Event.find(eventQuery).select('_id');
      query.eventId = { $in: matchingEvents.map((e) => e._id) };
    }

    const total = await EventRegistration.countDocuments(query);
    const registrations = await EventRegistration.find(query)
      .populate({
        path: 'eventId',
        select:
          'title description startDate endDate location eventType status requiresRegistration registrationFee',
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
    const registrationsWithAttendance = await Promise.all(
      registrations.map(async (registration) => {
        const attendance = await EventAttendance.findOne({
          eventId: registration.eventId,
          userId: registration.userId,
        });

        return {
          ...registration.toObject(),
          attended: attendance ? attendance.attended : false,
          attendanceMarkedAt: attendance ? attendance.markedAt : null,
        };
      })
    );

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
  }
);

// @desc    Get event registrations
// @route   GET /api/events/:id/registrations
// @access  Private
export const getEventRegistrations = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
      });
      return;
    }

    // Build query
    const query: any = { eventId: eventId };

    // Filter by registration status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Get total count for pagination
    const total = await EventRegistration.countDocuments(query);

    // Get registrations with pagination
    const registrations = await EventRegistration.find(query)
      .populate('userId', 'firstName lastName email profileImage phoneNumber')
      .populate('eventId', 'title eventType startDate endDate')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Get attendance data for registered users
    const registrationsWithAttendance = await Promise.all(
      registrations.map(async (registration) => {
        const attendance = await EventAttendance.findOne({
          eventId: eventId,
          userId: registration.userId,
        });

        return {
          ...registration.toObject(),
          attendance: attendance
            ? {
                present: attendance.attended,
                checkedInAt: attendance.markedAt,
                notes: attendance.notes,
              }
            : null,
        };
      })
    );

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
  }
);

// Helper function to send notifications to all users
async function sendEventNotifications(eventId: string) {
  try {
    const event = await Event.findById(eventId).populate(
      'createdBy',
      'firstName lastName'
    );
    if (!event) return;

    const users = await User.find({
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

    await EventNotification.insertMany(notifications);

    // Send email notifications
    for (const user of users) {
      try {
        await emailService.sendEmail({
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
            registrationDeadline:
              event.registrationDeadline?.toLocaleDateString(),
            registrationFee: event.registrationFee,
            isMeeting: event.eventType === EventType.MEETING,
            dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
          },
        });

        // Mark email as sent
        await EventNotification.findOneAndUpdate(
          { eventId: event._id, userId: user._id },
          { emailSent: true, emailSentAt: new Date() }
        );
      } catch (emailError) {
        console.error(`Failed to send email to ${user.email}:`, emailError);
      }
    }
  } catch (error) {
    console.error('Error sending event notifications:', error);
  }
}

// Helper function to calculate meeting penalties
async function calculateMeetingPenalties(year: number) {
  try {
    const penaltyConfig = await MeetingPenaltyConfig.findOne({
      year,
      isActive: true,
    });

    if (!penaltyConfig) {
      console.warn(`No penalty configuration found for year ${year}`);
      return;
    }

    // Get all meeting events for the year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const meetings = await Event.find({
      eventType: EventType.MEETING,
      startDate: { $gte: startOfYear, $lte: endOfYear },
      status: { $in: [EventStatus.COMPLETED, EventStatus.PUBLISHED] },
    });

    if (meetings.length === 0) return;

    // Get all users
    const users = await User.find({
      role: { $in: ['member', 'pharmacy'] },
      isActive: true,
    });

    for (const user of users) {
      // Count user's meeting attendance for the year
      const attendanceCount = await EventAttendance.countDocuments({
        eventId: { $in: meetings.map((m) => m._id) },
        userId: user._id,
        attended: true,
      });

      // Find applicable penalty rule
      let applicablePenalty = penaltyConfig.defaultPenalty;

      for (const rule of penaltyConfig.penaltyRules) {
        if (
          attendanceCount >= rule.minAttendance &&
          attendanceCount <= rule.maxAttendance
        ) {
          applicablePenalty = {
            penaltyType: rule.penaltyType,
            penaltyValue: rule.penaltyValue,
          };
          break;
        }
      }

      // Calculate penalty amount
      let penaltyAmount = 0;
      if (applicablePenalty.penaltyType === 'multiplier') {
        // Get user's annual dues
        const userAnnualDue = await Due.findOne({
          assignedTo: user._id,
          dueTypeId: { $exists: true }, // Assuming annual dues have a specific type
          year,
        }).populate('dueTypeId');

        if (userAnnualDue) {
          penaltyAmount = userAnnualDue.amount * applicablePenalty.penaltyValue;
        }
      } else {
        penaltyAmount = applicablePenalty.penaltyValue;
      }

      // Create or update penalty due if amount > 0
      if (penaltyAmount > 0) {
        await Due.findOneAndUpdate(
          {
            assignedTo: user._id,
            title: `Meeting Attendance Penalty ${year}`,
            year,
          },
          {
            assignedTo: user._id,
            title: `Meeting Attendance Penalty ${year}`,
            description: `Penalty for attending ${attendanceCount} meetings in ${year}`,
            amount: penaltyAmount,
            dueDate: new Date(year + 1, 2, 31), // March 31st of next year
            status: 'pending',
            year,
            isPenalty: true,
          },
          { upsert: true }
        );
      }
    }
  } catch (error) {
    console.error('Error calculating meeting penalties:', error);
  }
}

// Meeting Penalty Configuration Controllers

// @desc    Get penalty configuration for a year
// @route   GET /api/events/penalty-config/:year
// @access  Private (Admin only)
export const getPenaltyConfig = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const year = parseInt(req.params.year);

    const config = await MeetingPenaltyConfig.findOne({ year }).populate(
      'createdBy',
      'firstName lastName email'
    );

    if (!config) {
      return next(
        new ErrorResponse(
          `Penalty configuration not found for year ${year}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  }
);

// @desc    Create or update penalty configuration
// @route   POST /api/events/penalty-config
// @access  Private (Admin only)
export const createPenaltyConfig = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;

    const config = await MeetingPenaltyConfig.findOneAndUpdate(
      { year: req.body.year },
      {
        ...req.body,
        createdBy: userId,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).populate('createdBy', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: config,
    });
  }
);

// @desc    Get all penalty configurations
// @route   GET /api/events/penalty-configs
// @access  Private (Admin only)
export const getAllPenaltyConfigs = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const configs = await MeetingPenaltyConfig.find()
      .populate('createdBy', 'firstName lastName email')
      .sort({ year: -1 });

    res.status(200).json({
      success: true,
      count: configs.length,
      data: configs,
    });
  }
);
