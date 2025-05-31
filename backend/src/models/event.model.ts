import mongoose, { Schema, Document } from 'mongoose';

export enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum EventType {
  CONFERENCE = 'conference',
  WORKSHOP = 'workshop',
  SEMINAR = 'seminar',
  TRAINING = 'training',
  MEETING = 'meeting',
  STATE_EVENT = 'state_event',
  SOCIAL = 'social',
  OTHER = 'other',
}

export interface IEvent extends Document {
  title: string;
  description: string;
  eventType: EventType;
  startDate: Date;
  endDate: Date;
  location: string;
  imageUrl?: string;
  organizer: string;
  requiresRegistration: boolean;
  registrationFee?: number;
  capacity?: number;
  createdBy: mongoose.Types.ObjectId;
  status: EventStatus;
  registrationDeadline?: Date;
  isAttendanceRequired: boolean; // Track attendance for all events
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
    eventType: {
      type: String,
      enum: Object.values(EventType),
      required: [true, 'Event type is required'],
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
    imageUrl: {
      type: String,
    },
    organizer: {
      type: String,
      required: [true, 'Organizer is required'],
    },
    requiresRegistration: {
      type: Boolean,
      default: false,
    },
    registrationFee: {
      type: Number,
      required: function (this: IEvent) {
        return this.requiresRegistration === true;
      },
    },
    capacity: {
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
    registrationDeadline: {
      type: Date,
    },
    isAttendanceRequired: {
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

// Virtual populate for registrations
eventSchema.virtual('registrations', {
  ref: 'EventRegistration',
  localField: '_id',
  foreignField: 'eventId',
  justOne: false,
});

// Virtual populate for attendance
eventSchema.virtual('attendance', {
  ref: 'EventAttendance',
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
