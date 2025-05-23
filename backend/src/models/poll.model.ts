import mongoose, { Schema, Document } from 'mongoose';

export enum PollStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

export interface IPollOption {
  _id: mongoose.Types.ObjectId;
  text: string;
}

export interface IPoll extends Document {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  createdBy: mongoose.Types.ObjectId;
  status: PollStatus;
  options: IPollOption[];
  createdAt: Date;
  updatedAt: Date;
}

const pollSchema = new Schema<IPoll>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PollStatus),
      default: PollStatus.DRAFT,
    },
    options: [
      {
        text: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for responses
pollSchema.virtual('responses', {
  ref: 'PollResponse',
  localField: '_id',
  foreignField: 'pollId',
  justOne: false,
});

// Update poll status automatically based on dates
pollSchema.pre('save', function (next) {
  const now = new Date();
  if (this.status !== PollStatus.DRAFT) {
    if (this.startDate <= now && this.endDate >= now) {
      this.status = PollStatus.ACTIVE;
    } else if (this.endDate < now) {
      this.status = PollStatus.CLOSED;
    }
  }
  next();
});

const Poll = mongoose.model<IPoll>('Poll', pollSchema);

export default Poll;
