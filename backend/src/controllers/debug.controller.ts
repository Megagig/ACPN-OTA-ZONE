import { Request, Response } from 'express';
import Communication from '../models/communication.model';
import CommunicationRecipient from '../models/communicationRecipient.model';
import UserNotification from '../models/userNotification.model';
import User from '../models/user.model';
import asyncHandler from '../middleware/async.middleware';

// This is a debug endpoint to recreate notifications for a specific communication
export const recreateNotificationsForCommunication = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { communicationId } = req.params;

    // Find the communication
    const communication = await Communication.findById(
      communicationId
    ).populate({
      path: 'senderUserId',
      select: 'firstName lastName email',
    });

    if (!communication) {
      res.status(404).json({
        success: false,
        message: `Communication not found with id ${communicationId}`,
      });
      return;
    }

    // Find all recipients for this communication
    const recipients = await CommunicationRecipient.find({
      communicationId: communication._id,
    }).populate('userId', 'firstName lastName email role');

    console.log(
      `Found ${recipients.length} recipients for communication ${communication._id}`
    );

    // Delete existing notifications for this communication
    const deleteResult = await UserNotification.deleteMany({
      communicationId: communication._id,
    });

    console.log(`Deleted ${deleteResult.deletedCount} existing notifications`);

    if (recipients.length === 0) {
      // If no recipients found, try to create recipients based on the communication type
      let recipientUsers = [];

      if (communication.recipientType === 'all') {
        recipientUsers = await User.find({ isActive: true }).select(
          '_id firstName lastName email role'
        );
        console.log(
          `Found ${recipientUsers.length} active users for 'all' recipient type`
        );
      } else if (communication.recipientType === 'admin') {
        recipientUsers = await User.find({
          isActive: true,
          role: { $in: ['admin', 'superadmin', 'secretary', 'treasurer'] },
        }).select('_id firstName lastName email role');
        console.log(
          `Found ${recipientUsers.length} admin users for 'admin' recipient type`
        );
      } else {
        console.log(
          `No matching recipient type: ${communication.recipientType}`
        );
      }

      if (recipientUsers.length > 0) {
        const recipientRecords = recipientUsers.map((user) => ({
          communicationId: communication._id,
          userId: user._id,
          readStatus: false,
        }));

        const createdRecipients =
          await CommunicationRecipient.insertMany(recipientRecords);
        console.log(`Created ${createdRecipients.length} recipient records`);

        // Refresh recipients list
        const newRecipients = await CommunicationRecipient.find({
          communicationId: communication._id,
        }).populate('userId', 'firstName lastName email role');
        recipients.push(...newRecipients);
      }
    }

    if (recipients.length > 0) {
      // Extract sender information
      const senderInfo = communication.senderUserId
        ? `${(communication.senderUserId as any).firstName || ''} ${
            (communication.senderUserId as any).lastName || ''
          }`.trim()
        : 'System';

      console.log(`Sender information: ${senderInfo}`);

      // Create notification objects for each recipient
      const notifications = recipients.map((recipient) => {
        const recipientUser = recipient.userId as any;
        console.log(
          `Creating notification for recipient: ${recipientUser._id} (${recipientUser.firstName} ${recipientUser.lastName})`
        );

        return {
          userId: recipient.userId,
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
          // Set expiration for 30 days from now
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };
      });

      const createdNotifications =
        await UserNotification.insertMany(notifications);
      console.log(`Created ${createdNotifications.length} notifications`);

      res.status(200).json({
        success: true,
        message: `Successfully recreated ${createdNotifications.length} notifications for ${recipients.length} recipients`,
        data: {
          communication: {
            _id: communication._id,
            subject: communication.subject,
            messageType: communication.messageType,
            status: communication.status,
            sentDate: communication.sentDate,
          },
          recipientsCount: recipients.length,
          notificationsCount: createdNotifications.length,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No recipients found for this communication',
      });
    }
  }
);
