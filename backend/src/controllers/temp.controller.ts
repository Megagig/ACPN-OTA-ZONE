// Function to create notifications (for use in sendCommunication)
import { Document } from 'mongoose';
import { ICommunication } from '../models/communication.model';
import UserNotification from '../models/userNotification.model';

const createNotificationsForRecipients = async (
  communication: Document<unknown, {}, ICommunication> &
    ICommunication & { _id: any },
  recipients: any[]
) => {
  if (recipients.length === 0) return [];

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
    userId: recipient.userId._id, // Correctly access the populated userId._id
    communicationId: communication._id,
    type:
      communication.messageType === 'announcement'
        ? 'announcement'
        : 'communication',
    title: communication.subject,
    message: communication.content.substring(0, 500), // Truncate if too long
    priority: communication.priority || 'normal',
    isRead: false,
    isDisplayed: false,
    data: {
      senderName: senderInfo,
      messageType: communication.messageType,
      sentDate: communication.sentDate,
    },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
  }));

  // Create notifications in the database
  const createdNotifications = await UserNotification.insertMany(notifications);

  // Send real-time notifications via socket
  if (global.socketService) {
    recipients.forEach((recipient) => {
      const notification = createdNotifications.find(
        (n: any) => n.userId.toString() === recipient.userId._id.toString()
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

  return createdNotifications;
};

export default createNotificationsForRecipients;
