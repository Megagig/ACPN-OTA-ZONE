import { Request, Response, NextFunction } from 'express';
import { CommunicationRecipient, Communication, User, UserNotification } from '../models';
import { asyncHandler } from '../middleware';
import { ErrorResponse } from '../utils';
// @desc    Get all communications
// @route   GET /api/communications
// @access  Private
export const getCommunications = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { page = 1, limit = 10, status, messageType, recipientType, searchQuery, sortField = 'sentDate', sortDirection = 'desc' } = req.query;

    const isAdmin = ['admin', 'superadmin', 'secretary'].includes(req.user.role);
    const isSender = req.user.role === 'sender';
    const isRecipient = req.user.role === 'recipient';

    // Build query based on user role
    let query: any = {};
    if (isAdmin) {
      // Admin can see all communications
      query = {};
    } else if (isSender) {
      // Sender can see their own communications
      query = { senderUserId: req.user._id };
    } else if (isRecipient) {
      // Recipient can see communications they're part of
      query = {
        'recipients.userId': req.user._id,
      };
    } else {
      return next(
        new ErrorResponse('Unauthorized access', 403)
      );
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add message type filter if provided
    if (messageType) {
      query.messageType = messageType;
    }

    // Add recipient type filter if provided
    if (recipientType) {
      query.recipientType = recipientType;
    }

    // Add search query if provided
    if (searchQuery) {
      query.$text = { $search: searchQuery };
    }

    // Calculate pagination
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skipNumber = (pageNumber - 1) * limitNumber;

    // Get total count
    const total = await Communication.countDocuments(query);

    // Get communications with pagination and sorting
    const communications = await Communication.find(query)
      .populate({
        path: 'senderUserId',
        select: 'firstName lastName email',
      })
      .sort({ [sortField]: sortDirection === 'asc' ? 1 : -1 })
      .skip(skipNumber)
      .limit(limitNumber);

    // Get recipient counts for each communication
    const communicationIds = communications.map((comm) => comm._id);
    const recipientCounts = await CommunicationRecipient.aggregate([
        {
          $project: {
            messageType: '$_id',
            totalRecipients: 1,
            totalRead: {
              $sum: { $cond: [{ $eq: ['$readStatus', true], 1, 0] },
            },
            readRate: {
              $cond: [
                { $gt: ['$$totalRecipients', 0],
                { $multiply: [{ $divide: ['$totalRead', '$totalRecipients'], 100 },
              ],
            },
          },
        },
      },
      { $sort: { messageType: 1 } },
    ]);

    // Get read counts for each communication
    const readCounts = await CommunicationRecipient.aggregate([
      {
        $match: {
          communicationId: { $in: communicationIds },
          readStatus: true,
        },
      },
      {
        $group: {
          _id: '$communicationId',
          count: { $sum: 1,
        },
      },
    });

    // Create a map for recipient counts
    const recipientMap = recipientCounts.reduce(
      (acc, curr) => {
        acc[curr._id.toString()] = curr.count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Create a map for read counts
    const readMap = readCounts.reduce(
      (acc, curr) => {
        acc[curr._id.toString()] = curr.count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Format the response
    const formattedCommunications = await Promise.all(
      communications.map(async (communication) => {
        const recipientCount = recipientMap[communication._id.toString()] || 0;
        const readCount = readMap[communication._id.toString()] || 0;

        const communicationObj = communication.toObject();
        return {
          ...communicationObj,
          recipientCount,
          readCount,
          readPercentage:
            recipientCount > 0
              ? Math.round((readCount / recipientCount) * 100)
              : 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: formattedCommunications.length,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
        total,
      },
      data: formattedCommunications,
    });
  }
);

// @desc    Get single communication
// @route   GET /api/communications/:id
// @access  Private
export const getCommunication = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const communication = await Communication.findById(req.params.id).populate({
      path: 'senderUserId',
      select: 'firstName lastName email',
    });
    const { user } = req;
    if (!communication) {
      return next(
        new ErrorResponse(
          `Communication not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Check if user is the sender, an admin, or a recipient
    const isAdmin = ['admin', 'superadmin', 'secretary'].includes(req.user.role);
    const isSender =
      communication.senderUserId.toString() === req.user._id.toString();

    const recipientRecord = await CommunicationRecipient.findOne({
      communicationId: communication._id,
      userId: req.user._id,
    });

    const isRecipient = !!recipientRecord;

    if (!isAdmin && !isSender && !isRecipient) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to view this communication`,
          403
        )
      );
    }

    // If user is a recipient, mark as read if not already
    if (isRecipient && recipientRecord && !recipientRecord.readStatus) {
      recipientRecord.readStatus = true;
      recipientRecord.readTime = new Date();
      await recipientRecord.save();
    }

    // Get recipients if admin or sender
    let recipients: any[] = [];
    if (isAdmin || isSender) {
      recipients = await CommunicationRecipient.find({
        communicationId: communication._id,
      })
        .populate({
          path: 'userId',
          select: 'firstName lastName email',
        })
        .sort({ readStatus: 1, createdAt: 1 });
      recipientRecord.readStatus = true;
      recipientRecord.readTime = new Date();
      await recipientRecord.save();
    }
    }

    res.status(200).json({
      success: true,
      data: {
        communication,
        recipientRecord: isRecipient ? recipientRecord : null,
        recipients: isAdmin || isSender ? recipients : [],
      },
    });
  }
);

// @desc    Create new communication
// @route   POST /api/communications
// @access  Private/Admin/Secretary
export const createCommunication = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Validate user role
    if (
      req.body.messageType === 'announcement' &&
      !['admin', 'superadmin', 'secretary'].includes(req.user.role)
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to send announcements`,
          403
        )
      );
    }

    if (
      req.body.messageType === 'newsletter' &&
      !['admin', 'superadmin', 'secretary'].includes(req.user.role)
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to send newsletters`,
          403
        )
      );
    }

    // Add sender to request body
    req.body.senderUserId = req.user._id;

    // Create the communication
    const communication = await Communication.create(req.body);

    // Create recipients based on recipientType
    let recipientUsers = [];

    if (req.body.recipientType === 'all') {
      // Add all active users
      recipientUsers = await User.find({ isActive: true }).select('_id');
    } else if (req.body.recipientType === 'admin') {
      // Add only admin users
      recipientUsers = await User.find({
        isActive: true,
        role: { $in: ['admin', 'superadmin', 'secretary', 'treasurer'],
      }).select('_id');
    } else if (req.body.recipientType === 'specific') {
      // Add specific users
      if (
        !req.body.recipientIds ||
        !Array.isArray(req.body.recipientIds) ||
        req.body.recipientIds.length === 0
      ) {
        return next(
          new ErrorResponse('Recipient IDs are required for specific recipient type',
          400
        );
      }

      // Validate all recipients exist
      const existingUsers = await User.find({
        _id: { $in: req.body.recipientIds },
        isActive: true,
      }).select('_id');

      if (existingUsers.length !== req.body.recipientIds.length) {
        return next(new ErrorResponse('Some recipient IDs are invalid', 400));
      }

      // Save specific recipients to the communication document
      communication.specificRecipients = existingUsers.map(
        (user) => user._id as mongoose.Types.ObjectId
      );
      await communication.save();

      recipientUsers = existingUsers;
    }

    // Create recipient records
    if (recipientUsers.length > 0) {
      const recipientRecords = recipientUsers.map((user) => ({
        communicationId: communication._id,
        userId: user._id,
      }));

      await CommunicationRecipient.insertMany(recipientRecords);
    }

    res.status(201).json({
      success: true,
      data: {
        ...communication.toObject(),
        recipientCount: recipientUsers.length,
      },
    });
  }
);

// @desc    Mark communication as read
// @route   PUT /api/communications/:id/read
// @access  Private
export const markAsRead = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const communication = await Communication.findById(req.params.id);

    if (!communication) {
      return next(
        new ErrorResponse(
          `Communication not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Find recipient record
    const recipientRecord = await CommunicationRecipient.findOne({
      communicationId: communication._id,
      userId: req.user._id,
    });

    if (!recipientRecord) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not a recipient of this communication`,
          404
        )
      );
    }

    // Update read status
    recipientRecord.readStatus = true;
    recipientRecord.readTime = new Date();
    await recipientRecord.save();

    res.status(200).json({
      success: true,
      data: recipientRecord,
    });
  }
);

// @desc    Delete communication
// @route   DELETE /api/communications/:id
// @access  Private/Admin
export const deleteCommunication = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> > {
    const communication = await Communication.findById(req.params.id);

    if (!communication) {
      return next(
        new ErrorResponse(
          `Communication not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Check if user is admin or the sender
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isSender =
      communication.senderUserId.toString() === req.user._id.toString();

    if (!isAdmin && !isSender) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to delete this communication`,
          403
        )
      );
    }

    // Delete all recipient records first
    await CommunicationRecipient.deleteMany({
      communicationId: communication._id,
    });

    // Then delete the communication
    await communication.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Get communication statistics
// @route   GET /api/communications/stats
// @access  Private/Admin
export const getCommunicationStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Only admin can view communication statistics
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      throw new ErrorResponse(
        `User ${req.user._id} is not authorized to view communication statistics`,
        403
      );
    }

    // Get total counts by message type
    const messageTypeCounts = await Communication.aggregate([
      { $group: { _id: '$messageType', count: { $sum: 1 } },
      { $sort: { _id: 1 } },
    ]);

    // Get counts by status
    const statusCounts = await Communication.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } }
      { $sort: { _id: 1 } },
    ]);

    // Get monthly communication counts (for current year)
    const currentYear = new Date().getFullYear();
    const monthlyCommunications = await Communication.aggregate([
      {
        $match: {
          sentDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$sentDate' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get read rate statistics
    const readRateStats = await CommunicationRecipient.aggregate([
      {
        $group: {
          _id: 'total',
          totalRecipients: { $sum: 1 },
          totalRead: {
            $sum: { $cond: [{ $eq: ['$readStatus', true], $sum: 1, 0] },
          },
        },
      },
    ]);

    // Get read rate by communication type
    const readRateByType = await CommunicationRecipient.aggregate([
      {
        $lookup: {
          from: 'communications',
          localField: 'communicationId',
          foreignField: '_id',
          as: 'communication',
        },
      },
      { $unwind: '$communication' },
      {
        $group: {
          _id: '$communication.messageType',
          totalRecipients: { $sum: 1 },
          totalRead: {
            $sum: { $cond: [{ $eq: ['$readStatus', true], $sum: 1, 0] },
          },
        },
      },
      {
        $project: {
          messageType: '$_id',
          totalRecipients: 1,
          totalRead: 1,
          readRate: {
            $multiply: [{ $divide: ['$totalRead', '$totalRecipients'], $gt: ['$$totalRecipients', 0], $multiply: [{ $divide: ['$totalRead', '$totalRecipients'], 100 },
          },
        },
      },
      { $sort: { messageType: 1 } },
    ]);

    // Recent communications
    const recentCommunications = await Communication.find()
      .populate({
        path: 'senderUserId',
        select: 'firstName lastName',
      })
      .select('subject messageType sentDate senderUserId')
      .sort({ sentDate: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        messageTypeCounts,
        statusCounts,
        monthlyCommunications,
        readRateStats:
          readRateStats.length > 0
            ? {
                totalRecipients: readRateStats[0].totalRecipients,
                totalRead: readRateStats[0].totalRead,
                readRate:
                  readRateStats[0].totalRecipients > 0
                    ? Math.round(
                        (readRateStats[0].totalRead /
                          readRateStats[0].totalRecipients) *
                          100
                      )
                    : 0,
              }
            : {
                totalRecipients: 0,
                totalRead: 0,
                readRate: 0,
              },
        readRateByType,
        recentCommunications,
      },
    });
  }
);

// @desc    Send a draft communication
// @route   POST /api/communications/:id/send
// @access  Private/Admin/Secretary
export const sendCommunication = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const communication = await Communication.findById(req.params.id).populate({
      path: 'senderUserId',
      select: 'firstName lastName email',
    });

    if (!communication) {
      return next(
        new ErrorResponse(
          `Communication not found with id of ${req.params.id}`,
          404
    );

    // Check if user is authorized to send
    const isAdmin = ['admin', 'superadmin', 'secretary'].includes(req.user.role);
    const isSender =
      communication.senderUserId.toString() === req.user._id.toString();

    if (!isAdmin && !isSender) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to send this communication`,
          403
        )
      );
    }

    // Check if communication is in draft status
    if (communication.status !== 'draft') {
      return next(
        new ErrorResponse(
          `Communication is already ${communication.status}`,
          400
        )
      );
    }

    // Update communication status and send date
    communication.status = 'sent' as any;
    communication.sentDate = new Date();
    await communication.save();

    try {
      // Get all recipients with populated user details
      const recipients = await CommunicationRecipient.find({
        communicationId: communication._id,
      }).populate('userId', 'firstName lastName email role');

      if (recipients.length === 0) {
        // If no recipients exist, create them based on recipientType
        let userQuery: any = { isActive: true };

        if (communication.recipientType === 'all') {
          userQuery = { isActive: true };
        } else if (communication.recipientType === 'admin') {
          userQuery = {
            isActive: true,
            role: { $in: ['admin', 'superadmin', 'secretary', 'treasurer'],
          };
        } else if (
          communication.recipientType === 'specific' &&
          communication.specificRecipients?.length
        ) {
          userQuery = {
            isActive: true,
            _id: { $in: communication.specificRecipients,
          };
        }

        // Get users with all necessary fields
        const recipientUsers = await User.find(userQuery).select(
          '_id firstName lastName email role'
        );

        if (recipientUsers.length > 0) {
          // Create recipient records
          const recipientRecords = recipientUsers.map((user) => ({
            communicationId: communication._id,
            userId: user._id,
          }));

          await CommunicationRecipient.insertMany(recipientRecords);

          // Refresh recipients list with populated user data
          const refreshedRecipients = await CommunicationRecipient.find({
            communicationId: communication._id,
          }).populate('userId', 'firstName lastName email role');

          recipients.push(...refreshedRecipients);
        }
      }

      if (recipients.length > 0) {
        // Get sender info
        const senderInfo = communication.senderUserId
          ? `${(communication.senderUserId as any).firstName || ''} ${(communication.senderUserId as any).lastName || ''}`.trim()
          : 'System';

        // Delete any existing notifications to avoid duplicates
        await UserNotification.deleteMany({
          communicationId: communication._id,
        });

        // Create notifications for each recipient
        const notifications = recipients.map((recipient) => ({
          userId: recipient.userId._id,
          communicationId: communication._id,
          type:
            communication.messageType === 'announcement'
              ? 'announcement'
              : 'communication',
          title: communication.subject,
          message: communication.content.substring(0, 500),
          priority: communication.priority || 'normal',
          isRead: false,
          isDisplayed: false,
          data: {
            senderName: senderInfo,
            messageType: communication.messageType,
            sentDate: communication.sentDate,
          },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }));

        // Create notifications in the database
        const createdNotifications =
          await UserNotification.insertMany(notifications);

        // Send real-time notifications via socket
        if (global.socketService) {
          recipients.forEach((recipient) => {
            const notification = createdNotifications.find(
              (n) => n.userId.toString() === recipient.userId._id.toString()
            );
            if (notification) {
              global.socketService.emitToUser(
                recipient.userId._id.toString(),
                'new_notification',
                notification
              );
            }
          });
        }

        // Return success response
        res.status(200).json({
          success: true,
          message: 'Communication sent successfully',
          data: {
            communication,
            recipientCount: recipients.length,
            notificationCount: createdNotifications.length,
          },
        });
      } else {
        // No recipients found
        res.status(200).json({
          success: true,
          message: 'Communication sent, but no recipients found',
          data: {
            communication,
            recipientCount: 0,
            notificationCount: 0,
          },
        });
      }
    } catch (error: any) {
      console.error('Error sending communication:', error);
      return next(
        new ErrorResponse(`Error sending communication: ${error.message}`,
        500
      );
    }
  }
);

// @desc    Update a communication
// @route   PUT /api/communications/:id
// @access  Private
export const updateCommunication = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let communication = await Communication.findById(req.params.id);

    if (!communication) {
      return next(
        new ErrorResponse(
          `Communication not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Check if user is authorized to update
    const isAdmin = ['admin', 'superadmin', 'secretary'].includes(req.user.role);
    const isSender =
      communication.senderUserId.toString() === req.user._id.toString();

    if (!isAdmin && !isSender) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to update this communication`,
          403
        )
      );
    }

    // Check if communication can be updated (only in draft status)
    if (communication.status !== 'draft') {
      return next(
        new ErrorResponse(
          `Cannot update a communication that has been ${communication.status}`,
          400
        )
      );
    }

    // Handle specific recipients update
    if (
      req.body.recipientType === 'specific' &&
      req.body.recipientIds &&
      Array.isArray(req.body.recipientIds)
    ) {
      // Validate all recipients exist
      const existingUsers = await User.find({
        _id: { $in: req.body.recipientIds },
        isActive: true,
      }).select('_id');

      if (existingUsers.length !== req.body.recipientIds.length) {
        return next(new ErrorResponse('Some recipient IDs are invalid', 400);
      }

      // Update specific recipients
      req.body.specificRecipients = existingUsers.map(
        (user) => user._id as mongoose.Types.ObjectId
      );
    }

    // Update communication
    communication = await Communication.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: communication,
    });
  }
);

// @desc    Schedule a communication for later sending
// @route   POST /api/communications/:id/schedule
// @access  Private
export const scheduleCommunication = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let communication = await Communication.findById(req.params.id);

    if (!communication) {
      return next(
        new ErrorResponse(
          `Communication not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Check if user is authorized to schedule
    const isAdmin = ['admin', 'superadmin', 'secretary'].includes(req.user.role);
    const isSender =
      communication.senderUserId.toString() === req.user._id.toString();

    if (!isAdmin && !isSender) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to schedule this communication`,
          403
        )
      );
    }

    // Check if communication is in draft status
    if (communication.status !== 'draft') {
      return next(
        new ErrorResponse(
          `Communication is already ${communication.status}`,
          400
        )
      );
    }

    // Validate scheduled date
    const { scheduledDate } = req.body;
    if (!scheduledDate) {
      return next(new ErrorResponse('Scheduled date is required', 400);
    }

    const scheduledFor = new Date(scheduledDate);
    if (scheduledFor <= new Date()) {
      return next(
        new ErrorResponse('Scheduled date must be in the future', 400
      );
    }

    // Update communication status and scheduled date
    communication.status = 'scheduled' as any;
    communication.scheduledFor = scheduledFor;
    await communication.save();

    // Create recipients for scheduled communication (same logic as sending)
    let recipients: any[] = [];

    if (communication.recipientType === 'all') {
      // Get all active users
      const allUsers = await User.find({ isActive: true }).select('_id');
      recipients = allUsers.map((user) => ({
        communicationId: communication._id,
        userId: user._id,
      }));
    } else if (communication.recipientType === 'admin') {
      // Get all admin users
      const adminUsers = await User.find({
        role: { $in: ['admin', 'superadmin', 'secretary'],
        isActive: true,
      }).select('_id');
      recipients = adminUsers.map((user) => ({
        communicationId: communication._id,
        userId: user._id,
      }));
    } else if (communication.recipientType === 'specific') {
      // Use specific recipients
      if (
        communication.specificRecipients &&
        communication.specificRecipients.length > 0
      ) {
        recipients = communication.specificRecipients.map((userId) => ({
          communicationId: communication._id,
          userId: userId,
        }));
      }
    }

    // Clear existing recipients and create new ones for scheduled communication
    await CommunicationRecipient.deleteMany({
      communicationId: communication._id,
    });

    if (recipients.length > 0) {
      await CommunicationRecipient.insertMany(recipients);
    }

    res.status(200).json({
      success: true,
      message: `Communication scheduled for ${scheduledFor.toISOString()}`,
      data: communication,
    });
  }
);

// @desc    Get recipients of a communication
// @route   GET /api/communications/:id/recipients
// @access  Private
export const getCommunicationRecipients = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const communication = await Communication.findById(req.params.id);

    if (!communication) {
      return next(
        new ErrorResponse(
          `Communication not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Check if user is authorized to view recipients
    const isAdmin = ['admin', 'superadmin', 'secretary'].includes(req.user.role);
    const isSender =
      communication.senderUserId.toString() === req.user._id.toString();

    if (!isAdmin && !isSender) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to view recipients for this communication`,
          403
        )
      );
    }

    // Get recipients with user details
    const recipients = await CommunicationRecipient.find({
      communicationId: communication._id,
    })
      .populate({
        path: 'userId',
        select: 'firstName lastName email role',
      })
      .sort({ createdAt: 1 });

    // Get summary stats
    const totalRecipients = recipients.length;
    const readCount = recipients.filter((r) => r.readStatus === true).length;

    res.status(200).json({
      success: true,
      data: {
        communication: {
          _id: communication._id,
          subject: communication.subject,
          recipientType: communication.recipientType,
          status: communication.status,
          sentDate: communication.sentDate,
          scheduledFor: communication.scheduledFor,
        },
        recipients,
        stats: {
          total: totalRecipients,
          read: readCount,
          unread: totalRecipients - readCount,
          readRate:
            totalRecipients > 0
              ? (readCount / totalRecipients) * 100
              : 0,
        },
      },
    });
  }
);
