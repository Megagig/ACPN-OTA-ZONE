import mongoose, { Schema, Document } from 'mongoose';

export interface IEventNotification extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  seen: boolean;
  seenAt?: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const eventNotificationSchema = new Schema<IEventNotification>(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedAt: {
      type: Date,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one notification record per user per event
eventNotificationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const EventNotification = mongoose.model<IEventNotification>(
  'EventNotification',
  eventNotificationSchema
);

export default EventNotification;
