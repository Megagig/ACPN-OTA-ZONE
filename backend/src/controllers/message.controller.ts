import { Request, Response, NextFunction } from 'express';
import MessageThread from '../models/messageThread.model';
import ThreadMessage from '../models/threadMessage.model';
import ThreadParticipant from '../models/threadParticipant.model';
import User from '../models/user.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all threads for current user
// @route   GET /api/messages/threads
// @access  Private
export const getUserThreads = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const startIndex = (page - 1) * limit;

    // Get threads where user is a participant
    const threads = await MessageThread.find({
      participants: userId,
      isActive: true,
    })
      .populate('participants', 'firstName lastName email profileImage')
      .populate('lastMessageBy', 'firstName lastName')
      .sort({ lastMessageAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // For each thread, get unread message count
    const threadsWithUnreadCount = await Promise.all(
      threads.map(async (thread) => {
        // Find user's last read time for this thread
        const participant = await ThreadParticipant.findOne({
          threadId: thread._id,
          userId,
        });

        let unreadCount = 0;
        if (participant?.lastReadAt) {
          unreadCount = await ThreadMessage.countDocuments({
            threadId: thread._id,
            createdAt: { $gt: participant.lastReadAt },
            senderId: { $ne: userId },
            isDeleted: false,
          });
        } else {
          // If no lastReadAt, count all messages not sent by user
          unreadCount = await ThreadMessage.countDocuments({
            threadId: thread._id,
            senderId: { $ne: userId },
            isDeleted: false,
          });
        }

        return {
          ...thread.toObject(),
          unreadCount,
        };
      })
    );

    const total = await MessageThread.countDocuments({
      participants: userId,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      count: threads.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: threadsWithUnreadCount,
    });
  }
);

// @desc    Get single thread with messages
// @route   GET /api/messages/threads/:id
// @access  Private
export const getThread = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user.id;
    const threadId = req.params.id;

    // Check if user is participant in this thread
    const participant = await ThreadParticipant.findOne({
      threadId,
      userId,
      isActive: true,
    });

    if (!participant) {
      return next(new ErrorResponse('Thread not found or access denied', 404));
    }

    // Get thread details
    const thread = await MessageThread.findById(threadId)
      .populate('participants', 'firstName lastName email profileImage')
      .populate('createdBy', 'firstName lastName');

    if (!thread || !thread.isActive) {
      return next(new ErrorResponse('Thread not found', 404));
    }

    // Get messages for this thread
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const startIndex = (page - 1) * limit;

    const messages = await ThreadMessage.find({
      threadId,
      isDeleted: false,
    })
      .populate('senderId', 'firstName lastName profileImage')
      .populate('replyTo')
      .sort({ createdAt: 1 })
      .skip(startIndex)
      .limit(limit);

    // Update user's last read time
    await ThreadParticipant.findOneAndUpdate(
      { threadId, userId },
      { lastReadAt: new Date() },
      { new: true }
    );

    // Mark messages as read by this user
    await ThreadMessage.updateMany(
      {
        threadId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId },
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date(),
          },
        },
      }
    );

    res.status(200).json({
      success: true,
      data: {
        thread: thread.toObject(),
        messages,
        pagination: {
          page,
          limit,
          total: await ThreadMessage.countDocuments({
            threadId,
            isDeleted: false,
          }),
        },
      },
    });
  }
);

// @desc    Create new thread
// @route   POST /api/messages/threads
// @access  Private
export const createThread = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user.id;
    const { subject, participants, message, threadType = 'direct' } = req.body;

    if (!subject || !message || !participants || participants.length === 0) {
      return next(
        new ErrorResponse(
          'Subject, message, and participants are required',
          400
        )
      );
    }

    // Validate participants exist
    const participantUsers = await User.find({
      _id: { $in: participants },
      isActive: true,
    });

    if (participantUsers.length !== participants.length) {
      return next(new ErrorResponse('Some participants not found', 400));
    }

    // Add creator to participants if not already included
    const allParticipants = [...new Set([userId, ...participants])];

    // Check if direct thread already exists between these participants
    if (threadType === 'direct' && allParticipants.length === 2) {
      const existingThread = await MessageThread.findOne({
        participants: { $all: allParticipants, $size: 2 },
        threadType: 'direct',
        isActive: true,
      });

      if (existingThread) {
        return next(
          new ErrorResponse('Direct conversation already exists', 400)
        );
      }
    }

    // Create thread
    const thread = await MessageThread.create({
      subject,
      participants: allParticipants,
      createdBy: userId,
      threadType,
      isGroup: allParticipants.length > 2,
    });

    // Create participant records
    const participantRecords = allParticipants.map((participantId) => ({
      threadId: thread._id,
      userId: participantId,
      addedBy: userId,
      role: participantId === userId ? 'admin' : 'participant',
    }));

    await ThreadParticipant.insertMany(participantRecords);

    // Create first message
    const firstMessage = await ThreadMessage.create({
      threadId: thread._id,
      senderId: userId,
      content: message,
      messageType: 'text',
    });

    // Update thread with last message info
    await MessageThread.findByIdAndUpdate(thread._id, {
      lastMessage: message,
      lastMessageAt: firstMessage.createdAt,
      lastMessageBy: userId,
    });

    // Populate thread details
    const populatedThread = await MessageThread.findById(thread._id)
      .populate('participants', 'firstName lastName email profileImage')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: {
        thread: populatedThread,
        firstMessage,
      },
    });
  }
);

// @desc    Send message to thread
// @route   POST /api/messages/threads/:id/messages
// @access  Private
export const sendMessage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user.id;
    const threadId = req.params.id;
    const { content, messageType = 'text', replyTo } = req.body;

    if (!content) {
      return next(new ErrorResponse('Message content is required', 400));
    }

    // Check if user is participant in this thread
    const participant = await ThreadParticipant.findOne({
      threadId,
      userId,
      isActive: true,
    });

    if (!participant) {
      return next(new ErrorResponse('Thread not found or access denied', 404));
    }

    // Verify thread exists and is active
    const thread = await MessageThread.findById(threadId);
    if (!thread || !thread.isActive) {
      return next(new ErrorResponse('Thread not found', 404));
    }

    // Create message
    const message = await ThreadMessage.create({
      threadId,
      senderId: userId,
      content,
      messageType,
      replyTo: replyTo || undefined,
    });

    // Update thread with last message info
    await MessageThread.findByIdAndUpdate(threadId, {
      lastMessage: content.substring(0, 100), // Truncate for preview
      lastMessageAt: message.createdAt,
      lastMessageBy: userId,
    });

    // Populate message details
    const populatedMessage = await ThreadMessage.findById(message._id)
      .populate('senderId', 'firstName lastName profileImage')      .populate('replyTo');

    // Emit real-time message to thread participants
    if ((global as any).socketService) {
      (global as any).socketService.emitToThread(threadId, 'new_message', {
        message: populatedMessage,
        threadId,
        senderId: userId,
      });
    }

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  }
);

// @desc    Get thread participants
// @route   GET /api/messages/threads/:id/participants
// @access  Private
export const getThreadParticipants = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user.id;
    const threadId = req.params.id;

    // Check if user is participant in this thread
    const userParticipant = await ThreadParticipant.findOne({
      threadId,
      userId,
      isActive: true,
    });

    if (!userParticipant) {
      return next(new ErrorResponse('Thread not found or access denied', 404));
    }

    // Get all participants
    const participants = await ThreadParticipant.find({
      threadId,
      isActive: true,
    }).populate('userId', 'firstName lastName email profileImage');

    res.status(200).json({
      success: true,
      data: participants,
    });
  }
);

// @desc    Add participants to thread
// @route   POST /api/messages/threads/:id/participants
// @access  Private
export const addParticipants = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user.id;
    const threadId = req.params.id;
    const { participants } = req.body;

    if (!participants || participants.length === 0) {
      return next(new ErrorResponse('Participants list is required', 400));
    }

    // Check if user is admin participant in this thread
    const userParticipant = await ThreadParticipant.findOne({
      threadId,
      userId,
      isActive: true,
    });

    if (!userParticipant) {
      return next(new ErrorResponse('Thread not found or access denied', 404));
    }

    // Get thread to check if it's a group
    const thread = await MessageThread.findById(threadId);
    if (!thread) {
      return next(new ErrorResponse('Thread not found', 404));
    }

    // Validate new participants exist
    const newParticipants = await User.find({
      _id: { $in: participants },
      isActive: true,
    });

    if (newParticipants.length !== participants.length) {
      return next(new ErrorResponse('Some participants not found', 400));
    }

    // Check which participants are not already in the thread
    const existingParticipants = await ThreadParticipant.find({
      threadId,
      userId: { $in: participants },
    });

    const existingParticipantIds = existingParticipants.map((p) =>
      p.userId.toString()
    );
    const newParticipantIds = participants.filter(
      (id: string) => !existingParticipantIds.includes(id)
    );

    if (newParticipantIds.length === 0) {
      return next(
        new ErrorResponse('All specified users are already participants', 400)
      );
    }

    // Create participant records
    const participantRecords = newParticipantIds.map(
      (participantId: string) => ({
        threadId,
        userId: participantId,
        addedBy: userId,
        role: 'participant',
      })
    );

    await ThreadParticipant.insertMany(participantRecords);

    // Update thread participants array
    await MessageThread.findByIdAndUpdate(threadId, {
      $addToSet: { participants: { $each: newParticipantIds } },
      isGroup: true, // Ensure it's marked as group if adding participants
    });

    // Create system message about added participants
    const addedUserNames = newParticipants
      .filter((user) =>
        newParticipantIds.includes((user._id as any).toString())
      )
      .map((user) => `${user.firstName} ${user.lastName}`)
      .join(', ');

    await ThreadMessage.create({
      threadId,
      senderId: userId,
      content: `Added ${addedUserNames} to the conversation`,
      messageType: 'system',
    });

    res.status(200).json({
      success: true,
      message: 'Participants added successfully',
    });
  }
);

// @desc    Leave thread
// @route   DELETE /api/messages/threads/:id/participants
// @access  Private
export const leaveThread = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user.id;
    const threadId = req.params.id;

    // Check if user is participant in this thread
    const participant = await ThreadParticipant.findOne({
      threadId,
      userId,
      isActive: true,
    });

    if (!participant) {
      return next(new ErrorResponse('Thread not found or access denied', 404));
    }

    // Mark participant as inactive
    await ThreadParticipant.findByIdAndUpdate(participant._id, {
      isActive: false,
      leftAt: new Date(),
    });

    // Remove user from thread participants array
    await MessageThread.findByIdAndUpdate(threadId, {
      $pull: { participants: userId },
    });

    // Create system message
    const user = await User.findById(userId);
    await ThreadMessage.create({
      threadId,
      senderId: userId,
      content: `${user?.firstName} ${user?.lastName} left the conversation`,
      messageType: 'system',
    });

    res.status(200).json({
      success: true,
      message: 'Left thread successfully',
    });
  }
);

// @desc    Search users for messaging
// @route   GET /api/messages/users/search
// @access  Private
export const searchUsers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { q } = req.query;
    const userId = (req as any).user.id;

    if (!q || typeof q !== 'string') {
      res.status(200).json({
        success: true,
        data: [],
      });
      return;
    }

    const searchRegex = new RegExp(q, 'i');
    const users = await User.find({
      $and: [
        { _id: { $ne: userId } }, // Exclude current user
        { isActive: true },
        {
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
          ],
        },
      ],
    })
      .select('firstName lastName email profileImage role')
      .limit(20);

    res.status(200).json({
      success: true,
      data: users,
    });
  }
);

// @desc    Delete message
// @route   DELETE /api/messages/:messageId
// @access  Private
export const deleteMessage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user.id;
    const messageId = req.params.messageId;

    const message = await ThreadMessage.findById(messageId);
    if (!message) {
      return next(new ErrorResponse('Message not found', 404));
    }

    // Check if user is the sender or admin
    const isAdmin =
      (req as any).user.role === 'admin' ||
      (req as any).user.role === 'superadmin';
    if (message.senderId.toString() !== userId && !isAdmin) {
      return next(
        new ErrorResponse('Not authorized to delete this message', 403)
      );
    }

    // Mark message as deleted
    await ThreadMessage.findByIdAndUpdate(messageId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
    });

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  }
);

// @desc    Mark message as read
// @route   PATCH /api/messages/messages/:id/read
// @access  Private
export const markMessageAsRead = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user.id;
    const messageId = req.params.messageId;

    const message = await ThreadMessage.findById(messageId);
    if (!message) {
      return next(new ErrorResponse('Message not found', 404));
    }

    // Check if user is participant in this thread
    const participant = await ThreadParticipant.findOne({
      threadId: message.threadId,
      userId,
      isActive: true,
    });

    if (!participant) {
      return next(new ErrorResponse('Access denied', 403));
    }

    // Add user to readBy array if not already there
    const alreadyRead = message.readBy.some(
      (read) => read.userId.toString() === userId
    );

    if (!alreadyRead) {
      message.readBy.push({
        userId,
        readAt: new Date(),
      });
      await message.save();
    }

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
    });
  }
);

// @desc    Mark all messages in thread as read
// @route   PATCH /api/messages/threads/:id/read
// @access  Private
export const markThreadAsRead = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user.id;
    const threadId = req.params.threadId;

    // Check if user is participant in this thread
    const participant = await ThreadParticipant.findOne({
      threadId,
      userId,
      isActive: true,
    });

    if (!participant) {
      return next(new ErrorResponse('Thread not found or access denied', 404));
    }

    // Update participant's last read time
    participant.lastReadAt = new Date();
    await participant.save();

    // Mark all unread messages in this thread as read
    await ThreadMessage.updateMany(
      {
        threadId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId },
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date(),
          },
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Thread marked as read',
    });
  }
);

// @desc    Update participant role
// @route   PATCH /api/messages/threads/:threadId/participants/:userId/role
// @access  Private
export const updateParticipantRole = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requesterId = (req as any).user.id;
    const { threadId, userId } = req.params;
    const { role } = req.body;

    // Check if requester is admin of this thread
    const requesterParticipant = await ThreadParticipant.findOne({
      threadId,
      userId: requesterId,
      isActive: true,
      role: 'admin',
    });

    if (!requesterParticipant) {
      return next(
        new ErrorResponse('Access denied - admin role required', 403)
      );
    }

    // Update participant role
    const participant = await ThreadParticipant.findOneAndUpdate(
      { threadId, userId, isActive: true },
      { role },
      { new: true }
    );

    if (!participant) {
      return next(new ErrorResponse('Participant not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Participant role updated successfully',
      data: participant,
    });
  }
);

// @desc    Update notification settings
// @route   PATCH /api/messages/threads/:threadId/participants/:userId/notifications
// @access  Private
export const updateNotificationSettings = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requesterId = (req as any).user.id;
    const { threadId, userId } = req.params;
    const notificationSettings = req.body;

    // Users can only update their own notification settings
    if (requesterId !== userId) {
      return next(new ErrorResponse('Access denied', 403));
    }

    // Update notification settings
    const participant = await ThreadParticipant.findOneAndUpdate(
      { threadId, userId, isActive: true },
      { notificationSettings },
      { new: true }
    );

    if (!participant) {
      return next(new ErrorResponse('Participant not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: participant,
    });
  }
);

// @desc    Delete thread
// @route   DELETE /api/messages/threads/:id
// @access  Private
export const deleteThread = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user.id;
    const threadId = req.params.threadId;

    // Check if user is admin of this thread or system admin
    const participant = await ThreadParticipant.findOne({
      threadId,
      userId,
      isActive: true,
    });

    const isSystemAdmin =
      (req as any).user.role === 'admin' ||
      (req as any).user.role === 'superadmin';
    const isThreadAdmin = participant?.role === 'admin';

    if (!participant) {
      return next(new ErrorResponse('Thread not found or access denied', 404));
    }

    if (!isSystemAdmin && !isThreadAdmin) {
      return next(
        new ErrorResponse('Access denied - admin role required', 403)
      );
    }

    // Mark thread as inactive
    await MessageThread.findByIdAndUpdate(threadId, {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: userId,
    });

    // Mark all participants as inactive
    await ThreadParticipant.updateMany(
      { threadId },
      {
        isActive: false,
        leftAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: 'Thread deleted successfully',
    });
  }
);

export default {
  getUserThreads,
  getThread,
  createThread,
  sendMessage,
  getThreadParticipants,
  addParticipants,
  leaveThread,
  searchUsers,
  deleteMessage,
  markMessageAsRead,
  markThreadAsRead,
  updateParticipantRole,
  updateNotificationSettings,
  deleteThread,
};
