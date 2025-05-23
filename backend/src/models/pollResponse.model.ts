import mongoose, { Schema, Document } from 'mongoose';

export interface IPollResponse extends Document {
  pollId: mongoose.Types.ObjectId;
  optionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  responseTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pollResponseSchema = new Schema<IPollResponse>(
  {
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll',
      required: true,
    },
    optionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    responseTime: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only respond once to a poll
pollResponseSchema.index({ pollId: 1, userId: 1 }, { unique: true });

const PollResponse = mongoose.model<IPollResponse>(
  'PollResponse',
  pollResponseSchema
);

export default PollResponse;
