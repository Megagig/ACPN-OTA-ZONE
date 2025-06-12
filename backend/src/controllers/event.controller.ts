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

// @desc    Get event attendance
// @route   GET /api/events/:id/attendance
// @access  Private (Admin, Superadmin, Secretary)
export const getEventAttendance = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const eventId = req.params.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return next(
        new ErrorResponse(`Event not found with id of ${eventId}`, 404)
      );
    }

    // Build query for attendance records
    const query: any = { eventId };

    // Filter by attendance status if provided
    if (req.query.attended !== undefined) {
      query.attended = req.query.attended === 'true';
    }

    // Get total count for pagination
    const total = await EventAttendance.countDocuments(query);

    // Get attendance records with pagination
    const attendanceRecords = await EventAttendance.find(query)
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

    // Validate attendanceList
    if (!attendanceList || !Array.isArray(attendanceList)) {
      return next(
        new ErrorResponse('attendanceList must be provided as an array', 400)
      );
    }

    if (attendanceList.length === 0) {
      return next(new ErrorResponse('attendanceList cannot be empty', 400));
    }

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

    // If this is a meeting, calculate penalties and send warnings after attendance is marked
    if (event.eventType === EventType.MEETING) {
      const currentYear = new Date().getFullYear();
      await calculateMeetingPenalties(currentYear);

      // Also send attendance warnings to help members avoid future penalties
      try {
        await sendAttendanceWarnings(currentYear);
      } catch (warningError) {
        console.error('Error sending attendance warnings:', warningError);
        // Don't fail the main operation if warnings fail
      }
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

    // Get all attendance data for this event in a single query
    const userIds = registrations.map((reg) => reg.userId._id || reg.userId);
    const attendanceRecords = await EventAttendance.find({
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

      return {
        ...registration.toObject(),
        attendance,
      };
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
  }
);

// @desc    Get user's event history (for attendance tracking)
// @route   GET /api/events/my-history
// @access  Private
export const getUserEventHistory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    // Get user's event registrations with attendance data
    const registrations = await EventRegistration.find({ userId })
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

    // Get attendance records for the user
    const eventIds = registrations.map((reg) => reg.eventId);
    const attendanceRecords = await EventAttendance.find({
      userId,
      eventId: { $in: eventIds },
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

    // Combine registration and attendance data
    const eventHistory = registrations.map((registration) => {
      const eventIdStr = registration.eventId._id.toString();
      const attendance = attendanceMap.get(eventIdStr);

      return {
        registration: registration.toObject(),
        attendance: attendance || null,
      };
    });

    // Get total count for pagination
    const total = await EventRegistration.countDocuments({ userId });

    res.status(200).json({
      success: true,
      count: eventHistory.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
      },
      data: {
        registrations: registrations,
        attendance: attendanceRecords,
        eventHistory,
      },
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

// Helper function to send attendance warning notifications
async function sendAttendanceWarnings(year: number) {
  try {
    // Get all meeting events for the year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const meetings = await Event.find({
      eventType: EventType.MEETING,
      startDate: { $gte: startOfYear, $lte: endOfYear },
      status: { $in: [EventStatus.COMPLETED, EventStatus.PUBLISHED] },
    });

    // Get remaining meetings for the year
    const now = new Date();
    const remainingMeetings = await Event.find({
      eventType: EventType.MEETING,
      startDate: { $gte: now, $lte: endOfYear },
      status: { $in: [EventStatus.PUBLISHED, EventStatus.DRAFT] },
    });

    if (meetings.length === 0) {
      console.log(
        `No meetings found for ${year}. Skipping attendance warnings.`
      );
      return;
    }

    const totalMeetings = meetings.length;
    const attendanceThreshold = 0.5; // 50% threshold

    // Get all active members
    const users = await User.find({
      role: { $in: ['member', 'pharmacy'] },
      isActive: true,
    });

    console.log(
      `Checking attendance for ${users.length} users to send warnings for ${year}`
    );

    for (const user of users) {
      // Count user's meeting attendance for the year
      const attendanceRecords = await EventAttendance.find({
        eventId: { $in: meetings.map((m) => m._id) },
        userId: user._id,
      });

      const attendedMeetings = attendanceRecords.filter(
        (record) => record.attended
      ).length;
      const attendancePercentage =
        totalMeetings > 0 ? attendedMeetings / totalMeetings : 0;

      // Send warning if attendance is below 50% and there are still meetings left in the year
      if (
        attendancePercentage < attendanceThreshold &&
        remainingMeetings.length > 0
      ) {
        const missedMeetings = totalMeetings - attendedMeetings;

        try {
          await emailService.sendEmail({
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

          console.log(
            `Sent attendance warning to ${user.email} (${Math.round(attendancePercentage * 100)}% attendance)`
          );
        } catch (emailError) {
          console.error(
            `Failed to send attendance warning to ${user.email}:`,
            emailError
          );
        }
      }
    }

    console.log(
      `Attendance warning notifications for ${year} completed successfully`
    );
  } catch (error) {
    console.error('Error sending attendance warnings:', error);
    throw error;
  }
}

// Helper function to calculate meeting penalties based on 50% threshold
async function calculateMeetingPenalties(year: number) {
  try {
    // Get all meeting events for the year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const meetings = await Event.find({
      eventType: EventType.MEETING,
      startDate: { $gte: startOfYear, $lte: endOfYear },
      status: { $in: [EventStatus.COMPLETED, EventStatus.PUBLISHED] },
    });

    if (meetings.length === 0) {
      console.log(
        `No meetings found for ${year}. Skipping penalty calculation.`
      );
      return;
    }

    const totalMeetings = meetings.length;
    const attendanceThreshold = 0.5; // 50% threshold

    // Get all active members
    const users = await User.find({
      role: { $in: ['member', 'pharmacy'] },
      isActive: true,
    });

    console.log(
      `Calculating penalties for ${users.length} users based on ${totalMeetings} meetings in ${year}`
    );

    for (const user of users) {
      // Count user's meeting attendance for the year
      const attendanceRecords = await EventAttendance.find({
        eventId: { $in: meetings.map((m) => m._id) },
        userId: user._id,
      });

      const attendedMeetings = attendanceRecords.filter(
        (record) => record.attended
      ).length;
      const attendancePercentage =
        totalMeetings > 0 ? attendedMeetings / totalMeetings : 0;

      // Only apply penalty if attendance is below 50%
      if (attendancePercentage < attendanceThreshold) {
        // Get user's annual dues
        const userAnnualDues = await Due.find({
          assignedTo: user._id,
          year,
          isPenalty: false, // Exclude existing penalties
        });

        // Calculate total annual dues
        const totalAnnualDues = userAnnualDues.reduce(
          (sum, due) => sum + due.amount,
          0
        );

        // Penalty is half of the annual dues
        const penaltyAmount = totalAnnualDues * 0.5;

        if (penaltyAmount > 0) {
          // Create or update penalty due
          await Due.findOneAndUpdate(
            {
              assignedTo: user._id,
              title: `Meeting Attendance Penalty ${year}`,
              year,
              isPenalty: true,
            },
            {
              assignedTo: user._id,
              title: `Meeting Attendance Penalty ${year}`,
              description: `Penalty for attending only ${attendedMeetings} out of ${totalMeetings} meetings (${Math.round(attendancePercentage * 100)}%) in ${year}`,
              amount: penaltyAmount,
              dueDate: new Date(year + 1, 2, 31), // March 31st of next year
              status: 'pending',
              year,
              isPenalty: true,
            },
            { upsert: true }
          );

          console.log(
            `Applied penalty of ${penaltyAmount} to user ${user.email} (${Math.round(attendancePercentage * 100)}% attendance)`
          );
        }
      } else {
        // Remove any existing penalty if the user now meets the threshold
        const existingPenalty = await Due.findOne({
          assignedTo: user._id,
          title: `Meeting Attendance Penalty ${year}`,
          year,
          isPenalty: true,
        });

        if (existingPenalty) {
          await Due.findByIdAndDelete(existingPenalty._id);
          console.log(
            `Removed penalty for user ${user.email} as they now meet the attendance threshold`
          );
        }
      }
    }

    console.log(`Penalty calculation for ${year} completed successfully`);
  } catch (error) {
    console.error('Error calculating meeting penalties:', error);
    throw error;
  }
}

// @desc    Calculate meeting penalties for a year
// @route   POST /api/events/calculate-penalties/:year
// @access  Private (Admin only)
export const calculatePenalties = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const year = parseInt(req.params.year);

    if (!year || isNaN(year)) {
      throw new ErrorResponse('Invalid year provided', 400);
    }

    await calculateMeetingPenalties(year);

    res.status(200).json({
      success: true,
      message: `Penalties for ${year} have been calculated successfully.`,
    });
  }
);

// @desc    Send attendance warnings for a year
// @route   POST /api/events/send-warnings/:year
// @access  Private (Admin only)
export const sendAttendanceWarningsForYear = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const year = parseInt(req.params.year);

    if (!year || isNaN(year)) {
      throw new ErrorResponse('Invalid year provided', 400);
    }

    await sendAttendanceWarnings(year);

    res.status(200).json({
      success: true,
      message: `Attendance warnings for ${year} have been sent successfully.`,
    });
  }
);

// @desc    Publish an event (change status from draft to published)
// @route   PATCH /api/events/:id/publish
// @access  Private (Admin, Superadmin, Secretary)
export const publishEvent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return next(
        new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
      );
    }

    console.log(
      `Attempting to publish event ${req.params.id} with current status: ${event.status}`
    );

    // Allow publishing from draft or completed states
    // Only don't allow re-publishing already published events
    if (event.status === EventStatus.PUBLISHED) {
      return next(
        new ErrorResponse(
          `This event is already published. Current status: ${event.status}`,
          400
        )
      );
    }

    // Update event status to published
    event.status = EventStatus.PUBLISHED;
    await event.save();

    res.status(200).json({
      success: true,
      data: event,
    });
  }
);

// @desc    Cancel an event (change status to cancelled)
// @route   PATCH /api/events/:id/cancel
// @access  Private (Admin, Superadmin, Secretary)
export const cancelEvent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return next(
        new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
      );
    }

    // Only published or draft events can be cancelled
    if (![EventStatus.PUBLISHED, EventStatus.DRAFT].includes(event.status)) {
      return next(
        new ErrorResponse(
          `Only published or draft events can be cancelled. Current status: ${event.status}`,
          400
        )
      );
    }

    // Update event status to cancelled
    event.status = EventStatus.CANCELLED;
    await event.save();

    res.status(200).json({
      success: true,
      data: event,
    });
  }
);
