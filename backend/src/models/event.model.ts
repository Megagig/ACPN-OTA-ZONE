import mongoose, { Schema, Document } from 'mongoose';

export enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface IEvent extends Document {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  requiresPayment: boolean;
  amount?: number;
  maxAttendees?: number;
  createdBy: mongoose.Types.ObjectId;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
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
    location: {
      type: String,
      required: [true, 'Location is required'],
    },
    requiresPayment: {
      type: Boolean,
      default: false,
    },
    amount: {
      type: Number,
      required: function (this: IEvent) {
        return this.requiresPayment === true;
      },
    },
    maxAttendees: {
      type: Number,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.UPCOMING,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for attendees
eventSchema.virtual('attendees', {
  ref: 'EventAttendee',
  localField: '_id',
  foreignField: 'eventId',
  justOne: false,
});

// Update event status automatically based on dates
eventSchema.pre('save', function (next) {
  const now = new Date();
  if (this.startDate <= now && this.endDate >= now) {
    this.status = EventStatus.ONGOING;
  } else if (this.endDate < now) {
    this.status = EventStatus.COMPLETED;
  } else {
    this.status = EventStatus.UPCOMING;
  }
  next();
});

const Event = mongoose.model<IEvent>('Event', eventSchema);

export default Event;
