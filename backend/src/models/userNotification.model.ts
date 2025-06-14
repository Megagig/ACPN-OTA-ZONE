import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserNotification extends Document {
  userId: mongoose.Types.ObjectId;
  communicationId: mongoose.Types.ObjectId;
  type: 'communication' | 'announcement' | 'system';
  title: string;
  message: string;
  data?: any; // Additional data for the notification
  isRead: boolean;
  readAt?: Date;
  isDisplayed: boolean; // Whether it has been shown to user
  displayedAt?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  markAsRead(): Promise<IUserNotification>;
  markAsDisplayed(): Promise<IUserNotification>;
}

export interface IUserNotificationModel extends Model<IUserNotification> {
  getUnreadForUser(userId: string): Promise<IUserNotification[]>;
  getUnreadCountForUser(userId: string): Promise<number>;
}

const UserNotificationSchema = new Schema<IUserNotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    communicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Communication',
      required: false,
    },
    type: {
      type: String,
      enum: ['communication', 'announcement', 'system'],
      required: true,
      default: 'communication',
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    isDisplayed: {
      type: Boolean,
      default: false,
      index: true,
    },
    displayedAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true,
    },
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 }, // TTL index
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
UserNotificationSchema.index({ userId: 1, isRead: 1 });
UserNotificationSchema.index({ userId: 1, isDisplayed: 1 });
UserNotificationSchema.index({ userId: 1, createdAt: -1 });
UserNotificationSchema.index({ userId: 1, priority: -1, createdAt: -1 });

// Method to mark notification as read
UserNotificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark notification as displayed
UserNotificationSchema.methods.markAsDisplayed = function () {
  this.isDisplayed = true;
  this.displayedAt = new Date();
  return this.save();
};

// Static method to get unread notifications for a user
UserNotificationSchema.statics.getUnreadForUser = function (userId: string) {
  return this.find({
    userId,
    isRead: false,
  }).sort({ createdAt: -1 });
};

// Static method to get unread count for a user
UserNotificationSchema.statics.getUnreadCountForUser = function (
  userId: string
) {
  return this.countDocuments({
    userId,
    isRead: false,
  });
};

// Static method to get unread notifications for a user
UserNotificationSchema.statics.getUnreadForUser = function (userId: string) {
  return this.find({
    userId: new mongoose.Types.ObjectId(userId),
    isRead: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } },
    ],
  })
    .populate(
      'communicationId',
      'subject messageType priority senderUserId sentDate'
    )
    .sort({ priority: -1, createdAt: -1 });
};

// Static method to get unread count for a user
UserNotificationSchema.statics.getUnreadCountForUser = function (
  userId: string
) {
  return this.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    isRead: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } },
    ],
  });
};

// Static method to get recent notifications for dashboard
UserNotificationSchema.statics.getRecentForUser = function (
  userId: string,
  limit: number = 10
) {
  return this.find({
    userId: new mongoose.Types.ObjectId(userId),
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } },
    ],
  })
    .populate(
      'communicationId',
      'subject messageType priority senderUserId sentDate'
    )
    .sort({ createdAt: -1 })
    .limit(limit);
};

const UserNotification = mongoose.model<
  IUserNotification,
  IUserNotificationModel
>('UserNotification', UserNotificationSchema);

export default UserNotification;
