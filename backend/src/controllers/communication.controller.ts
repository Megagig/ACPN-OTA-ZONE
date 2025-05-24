import { Request, Response, NextFunction } from 'express';
import Communication, {
  MessageType,
  RecipientType,
} from '../models/communication.model';
import CommunicationRecipient from '../models/communicationRecipient.model';
import User from '../models/user.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all communications (admin view)
// @route   GET /api/communications/admin
// @access  Private/Admin/Secretary
export const getAllAdminCommunications = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only admin and secretary can view all communications
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to view all communications`,
          403
        )
      );
    }

    // Implement pagination, filtering and sorting
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Filter by message type if provided
    if (req.query.messageType) {
      query.messageType = req.query.messageType;
    }

    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      query.sentDate = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string),
      };
    }

    // Search by subject or content
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      query.$or = [{ subject: searchRegex }, { content: searchRegex }];
    }

    const communications = await Communication.find(query)
      .populate({
        path: 'senderUserId',
        select: 'firstName lastName email',
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ sentDate: -1 });

    // Get total count
    const total = await Communication.countDocuments(query);

    // For each communication, get recipient count
    const communicationsWithCounts = await Promise.all(
      communications.map(async (communication) => {
        const recipientCount = await CommunicationRecipient.countDocuments({
          communicationId: communication._id,
        });

        const readCount = await CommunicationRecipient.countDocuments({
          communicationId: communication._id,
          readStatus: true,
        });

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
      count: communications.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
      },
      data: communicationsWithCounts,
    });
  }
);

// @desc    Get user's inbox
// @route   GET /api/communications/inbox
// @access  Private
export const getUserInbox = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Implement pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    // Get all communications where the user is a recipient
    const recipientRecords = await CommunicationRecipient.find({
      userId: req.user._id,
    })
      .populate({
        path: 'communicationId',
        populate: {
          path: 'senderUserId',
          select: 'firstName lastName email',
        },
      })
      .sort({ 'communicationId.sentDate': -1 })
      .skip(startIndex)
      .limit(limit);

    // Get total count
    const total = await CommunicationRecipient.countDocuments({
      userId: req.user._id,
    });

    // Format the response
    const inbox = recipientRecords.map((record) => {
      const communication = record.communicationId as any;
      return {
        _id: communication._id,
        subject: communication.subject,
        content: communication.content,
        sentDate: communication.sentDate,
        messageType: communication.messageType,
        attachmentUrl: communication.attachmentUrl,
        sender: communication.senderUserId,
        readStatus: record.readStatus,
        readTime: record.readTime,
      };
    });

    // Get unread count
    const unreadCount = await CommunicationRecipient.countDocuments({
      userId: req.user._id,
      readStatus: false,
    });

    res.status(200).json({
      success: true,
      count: inbox.length,
      unreadCount,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
      },
      data: inbox,
    });
  }
);

// @desc    Get user's sent communications
// @route   GET /api/communications/sent
// @access  Private
export const getUserSentCommunications = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Implement pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    // Get all communications sent by the user
    const communications = await Communication.find({
      senderUserId: req.user._id,
    })
      .sort({ sentDate: -1 })
      .skip(startIndex)
      .limit(limit);

    // Get total count
    const total = await Communication.countDocuments({
      senderUserId: req.user._id,
    });

    // For each communication, get recipient count and read count
    const sentItems = await Promise.all(
      communications.map(async (communication) => {
        const recipientCount = await CommunicationRecipient.countDocuments({
          communicationId: communication._id,
        });

        const readCount = await CommunicationRecipient.countDocuments({
          communicationId: communication._id,
          readStatus: true,
        });

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
      count: sentItems.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
      },
      data: sentItems,
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

    if (!communication) {
      return next(
        new ErrorResponse(
          `Communication not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Check if user is the sender, an admin, or a recipient
    const isAdmin = ['admin', 'superadmin', 'secretary'].includes(
      req.user.role
    );
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
    // Validate if user can send messages
    if (
      req.body.messageType === MessageType.ANNOUNCEMENT &&
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to send announcements`,
          403
        )
      );
    }

    if (
      req.body.messageType === MessageType.NEWSLETTER &&
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to send newsletters`,
          403
        )
      );
    }

    // Add sender to req.body
    req.body.senderUserId = req.user._id;

    // Create the communication
    const communication = await Communication.create(req.body);

    // Add recipients based on recipientType
    let recipientUsers = [];

    if (req.body.recipientType === RecipientType.ALL) {
      // Add all users as recipients
      recipientUsers = await User.find({ isActive: true }).select('_id');
    } else if (req.body.recipientType === RecipientType.ADMIN) {
      // Add only admin users as recipients
      recipientUsers = await User.find({
        isActive: true,
        role: { $in: ['admin', 'superadmin', 'secretary', 'treasurer'] },
      }).select('_id');
    } else if (req.body.recipientType === RecipientType.SPECIFIC) {
      // Add only specific users as recipients
      if (
        !req.body.recipientIds ||
        !Array.isArray(req.body.recipientIds) ||
        req.body.recipientIds.length === 0
      ) {
        return next(
          new ErrorResponse(
            `Recipient IDs are required for specific recipient type`,
            400
          )
        );
      }

      // Validate all recipients exist
      const existingUsers = await User.find({
        _id: { $in: req.body.recipientIds },
        isActive: true,
      }).select('_id');

      if (existingUsers.length !== req.body.recipientIds.length) {
        return next(new ErrorResponse(`Some recipient IDs are invalid`, 400));
      }

      recipientUsers = existingUsers;
    }

    // Batch create recipient records
    if (recipientUsers.length > 0) {
      const recipientRecords = recipientUsers.map((user) => ({
        communicationId: communication._id,
        userId: user._id,
        readStatus: false,
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

    // Check if user is admin or the sender
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
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
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      throw new ErrorResponse(
        `User ${req.user._id} is not authorized to view communication statistics`,
        403
      );
    }

    // Get total counts by message type
    const messageTypeCounts = await Communication.aggregate([
      { $group: { _id: '$messageType', count: { $sum: 1 } } },
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
            $sum: { $cond: [{ $eq: ['$readStatus', true] }, 1, 0] },
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
            $sum: { $cond: [{ $eq: ['$readStatus', true] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          messageType: '$_id',
          totalRecipients: 1,
          totalRead: 1,
          readRate: {
            $multiply: [{ $divide: ['$totalRead', '$totalRecipients'] }, 100],
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
