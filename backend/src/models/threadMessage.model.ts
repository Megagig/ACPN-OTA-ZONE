import mongoose, { Schema, Document } from 'mongoose';

export interface IThreadMessage extends Document {
  threadId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  attachments?: string[];
  readBy: {
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  replyTo?: mongoose.Types.ObjectId; // For message replies
  createdAt: Date;
  updatedAt: Date;
}

const threadMessageSchema = new Schema<IThreadMessage>(
  {
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessageThread',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text',
    },
    attachments: [
      {
        type: String,
      },
    ],
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    editedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ThreadMessage',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
threadMessageSchema.index({ threadId: 1, createdAt: -1 });
threadMessageSchema.index({ senderId: 1 });
threadMessageSchema.index({ isDeleted: 1 });
threadMessageSchema.index({ 'readBy.userId': 1 });

// Virtual populate for sender details
threadMessageSchema.virtual('senderDetails', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true,
});

// Virtual populate for reply message details
threadMessageSchema.virtual('replyToMessage', {
  ref: 'ThreadMessage',
  localField: 'replyTo',
  foreignField: '_id',
  justOne: true,
});

const ThreadMessage = mongoose.model<IThreadMessage>(
  'ThreadMessage',
  threadMessageSchema
);

export default ThreadMessage;
