import mongoose, { Schema, Document } from 'mongoose';

export interface IThreadParticipant extends Document {
  threadId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  joinedAt: Date;
  lastReadAt?: Date;
  leftAt?: Date;
  addedBy: mongoose.Types.ObjectId;
  role: 'participant' | 'admin';
  isActive: boolean;
  notificationSettings: {
    muted: boolean;
    mutedUntil?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const threadParticipantSchema = new Schema<IThreadParticipant>(
  {
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessageThread',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastReadAt: {
      type: Date,
    },
    leftAt: {
      type: Date,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['participant', 'admin'],
      default: 'participant',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notificationSettings: {
      muted: {
        type: Boolean,
        default: false,
      },
      mutedUntil: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for better performance
threadParticipantSchema.index({ threadId: 1, userId: 1 }, { unique: true });
threadParticipantSchema.index({ userId: 1, isActive: 1 });
threadParticipantSchema.index({ threadId: 1, isActive: 1 });

// Virtual populate for user details
threadParticipantSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

const ThreadParticipant = mongoose.model<IThreadParticipant>(
  'ThreadParticipant',
  threadParticipantSchema
);

export default ThreadParticipant;
