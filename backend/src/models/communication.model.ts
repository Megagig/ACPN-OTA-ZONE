import mongoose, { Schema, Document } from 'mongoose';

export enum MessageType {
  ANNOUNCEMENT = 'announcement',
  NEWSLETTER = 'newsletter',
  DIRECT = 'direct',
}

export enum RecipientType {
  ALL = 'all',
  ADMIN = 'admin',
  SPECIFIC = 'specific',
}

export interface ICommunication extends Document {
  subject: string;
  content: string;
  senderUserId: mongoose.Types.ObjectId;
  recipientType: RecipientType;
  sentDate: Date;
  messageType: MessageType;
  attachmentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const communicationSchema = new Schema<ICommunication>(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientType: {
      type: String,
      enum: Object.values(RecipientType),
      required: true,
    },
    sentDate: {
      type: Date,
      default: Date.now,
    },
    messageType: {
      type: String,
      enum: Object.values(MessageType),
      required: true,
    },
    attachmentUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for recipients
communicationSchema.virtual('recipients', {
  ref: 'CommunicationRecipient',
  localField: '_id',
  foreignField: 'communicationId',
  justOne: false,
});

const Communication = mongoose.model<ICommunication>(
  'Communication',
  communicationSchema
);

export default Communication;
