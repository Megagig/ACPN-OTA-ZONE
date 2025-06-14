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

export enum CommunicationStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  SCHEDULED = 'scheduled',
}

export enum CommunicationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface ICommunication extends Document {
  subject: string;
  content: string;
  senderUserId: mongoose.Types.ObjectId;
  recipientType: RecipientType;
  status: CommunicationStatus;
  priority: CommunicationPriority;
  sentDate?: Date;
  scheduledFor?: Date;
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
    status: {
      type: String,
      enum: Object.values(CommunicationStatus),
      default: CommunicationStatus.DRAFT,
    },
    priority: {
      type: String,
      enum: Object.values(CommunicationPriority),
      default: CommunicationPriority.NORMAL,
    },
    sentDate: {
      type: Date,
    },
    scheduledFor: {
      type: Date,
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
