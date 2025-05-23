import mongoose, { Schema, Document } from 'mongoose';

export enum ElectionStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface IElection extends Document {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: ElectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const electionSchema = new Schema<IElection>(
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
    status: {
      type: String,
      enum: Object.values(ElectionStatus),
      default: ElectionStatus.UPCOMING,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for candidates
electionSchema.virtual('candidates', {
  ref: 'Candidate',
  localField: '_id',
  foreignField: 'electionId',
  justOne: false,
});

// Update election status automatically based on dates
electionSchema.pre('save', function (next) {
  const now = new Date();
  if (this.startDate <= now && this.endDate >= now) {
    this.status = ElectionStatus.ONGOING;
  } else if (this.endDate < now) {
    this.status = ElectionStatus.COMPLETED;
  } else {
    this.status = ElectionStatus.UPCOMING;
  }
  next();
});

const Election = mongoose.model<IElection>('Election', electionSchema);

export default Election;
