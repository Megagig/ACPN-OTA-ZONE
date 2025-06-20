import { Request, Response, NextFunction } from 'express';
import UserNotification from '../models/userNotification.model';
import Communication from '../models/communication.model';
import CommunicationRecipient from '../models/communicationRecipient.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;
    const unreadOnly = req.query.unreadOnly === 'true';

    const startIndex = (page - 1) * limit;

    // Build query
    const query: any = { userId };

    // Filter by type if specified
    if (type) {
      query.type = type;
    }

    // Filter by read status if specified
    if (unreadOnly) {
      query.isRead = false;
    }

    // Only show non-expired notifications
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } },
    ];

    const notifications = await UserNotification.find(query)
      .populate(
        'communicationId',
        'subject messageType priority senderUserId sentDate'
      )
      .sort({ priority: -1, createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const total = await UserNotification.countDocuments(query);
    const unreadCount = await UserNotification.getUnreadCountForUser(
      userId.toString()
    );

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
      },
      data: notifications,
    });
  }
);

// @desc    Get unread notifications for member login
// @route   GET /api/notifications/unread
// @access  Private
export const getUnreadNotifications = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit as string) || 20;

    const notifications = await UserNotification.getUnreadForUser(
      userId.toString()
    );
    const limitedNotifications = notifications.slice(0, limit);

    // Mark as displayed (but not read) since user is seeing them
    const notificationIds = limitedNotifications.map((n: any) => n._id);
    await UserNotification.updateMany(
      { _id: { $in: notificationIds }, isDisplayed: false },
      {
        isDisplayed: true,
        displayedAt: new Date(),
      }
    );

    const unreadCount = await UserNotification.getUnreadCountForUser(
      userId.toString()
    );

    res.status(200).json({
      success: true,
      count: limitedNotifications.length,
      unreadCount,
      data: limitedNotifications,
    });
  }
);

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const notification = await UserNotification.findById(req.params.id);

    if (!notification) {
      return next(
        new ErrorResponse(
          `Notification not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Check if notification belongs to the user
    if (notification.userId.toString() !== req.user._id.toString()) {
      return next(
        new ErrorResponse(
          'Not authorized to mark this notification as read',
          403
        )
      );
    }

    await notification.markAsRead();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  }
);

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
export const markAllAsRead = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user._id;

    const result = await UserNotification.updateMany(
      {
        userId,
        isRead: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gte: new Date() } },
        ],
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount,
    });
  }
);

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const notification = await UserNotification.findById(req.params.id);

    if (!notification) {
      return next(
        new ErrorResponse(
          `Notification not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Check if notification belongs to the user
    if (notification.userId.toString() !== req.user._id.toString()) {
      return next(
        new ErrorResponse('Not authorized to delete this notification', 403)
      );
    }

    await UserNotification.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  }
);

// @desc    Get notification stats for dashboard
// @route   GET /api/notifications/stats
// @access  Private
export const getNotificationStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user._id;

    const [unreadCount, totalCount, typeStats, priorityStats] =
      await Promise.all([
        UserNotification.getUnreadCountForUser(userId.toString()),
        UserNotification.countDocuments({
          userId,
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gte: new Date() } },
          ],
        }),
        UserNotification.aggregate([
          {
            $match: {
              userId: userId,
              $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gte: new Date() } },
              ],
            },
          },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        UserNotification.aggregate([
          {
            $match: {
              userId: userId,
              isRead: false,
              $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gte: new Date() } },
              ],
            },
          },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
      ]);

    res.status(200).json({
      success: true,
      data: {
        unreadCount,
        totalCount,
        readCount: totalCount - unreadCount,
        typeStats,
        priorityStats,
      },
    });
  }
);

// @desc    Create notification for communication (Internal use)
// @route   POST /api/notifications/create-for-communication
// @access  Private/Admin
export const createNotificationForCommunication = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { communicationId } = req.body;

    // Get communication details
    const communication = await Communication.findById(
      communicationId
    ).populate('senderUserId', 'firstName lastName');

    if (!communication) {
      return next(new ErrorResponse('Communication not found', 404));
    }

    // Only create notifications for sent communications
    if (communication.status !== 'sent') {
      return next(
        new ErrorResponse(
          'Can only create notifications for sent communications',
          400
        )
      );
    }

    // Get all recipients
    const recipients = await CommunicationRecipient.find({
      communicationId: communication._id,
    });

    if (recipients.length === 0) {
      return next(
        new ErrorResponse('No recipients found for this communication', 400)
      );
    }

    // Create notifications for all recipients
    const notifications = recipients.map((recipient) => ({
      userId: recipient.userId,
      communicationId: communication._id,
      type:
        communication.messageType === 'announcement'
          ? 'announcement'
          : 'communication',
      title: communication.subject,
      message: communication.content.substring(0, 500), // Truncate if too long
      priority: communication.priority || 'normal',
      data: {
        senderName: communication.senderUserId
          ? `${(communication.senderUserId as any).firstName} ${(communication.senderUserId as any).lastName}`
          : 'System',
        messageType: communication.messageType,
        sentDate: communication.sentDate,
      },
      // Set expiration for 30 days from now
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }));

    const createdNotifications =
      await UserNotification.insertMany(notifications);    // Emit real-time notifications if socket service is available
    if ((global as any).socketService) {
      recipients.forEach((recipient) => {
        const notification = createdNotifications.find(
          (n) => n.userId.toString() === recipient.userId.toString()
        );
        if (notification) {
          (global as any).socketService.emitToUser(
            recipient.userId.toString(),
            'new_notification',
            notification
          );
        }
      });
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdNotifications.length} notifications`,
      count: createdNotifications.length,
      data: createdNotifications,
    });
  }
);

export default {
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
  createNotificationForCommunication,
};
