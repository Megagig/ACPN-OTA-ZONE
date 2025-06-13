import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageThread extends Document {
  subject: string;
  participants: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageBy?: mongoose.Types.ObjectId;
  isGroup: boolean;
  threadType: 'direct' | 'group';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageThreadSchema = new Schema<IMessageThread>(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessage: {
      type: String,
      maxlength: 1000,
    },
    lastMessageAt: {
      type: Date,
    },
    lastMessageBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    threadType: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
messageThreadSchema.index({ participants: 1 });
messageThreadSchema.index({ createdBy: 1 });
messageThreadSchema.index({ lastMessageAt: -1 });
messageThreadSchema.index({ isActive: 1 });

// Virtual populate for messages
messageThreadSchema.virtual('messages', {
  ref: 'ThreadMessage',
  localField: '_id',
  foreignField: 'threadId',
  justOne: false,
});

// Virtual populate for participant details
messageThreadSchema.virtual('participantDetails', {
  ref: 'User',
  localField: 'participants',
  foreignField: '_id',
  justOne: false,
});

const MessageThread = mongoose.model<IMessageThread>(
  'MessageThread',
  messageThreadSchema
);

export default MessageThread;
