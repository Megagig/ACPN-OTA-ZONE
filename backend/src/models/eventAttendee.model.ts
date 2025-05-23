import mongoose, { Schema, Document } from 'mongoose';

export enum AttendanceStatus {
  REGISTERED = 'registered',
  ATTENDED = 'attended',
  ABSENT = 'absent',
}

export enum PaymentStatus {
  NOT_REQUIRED = 'not_required',
  PENDING = 'pending',
  PAID = 'paid',
}

export interface IEventAttendee extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  registrationDate: Date;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  attendanceStatus: AttendanceStatus;
  createdAt: Date;
  updatedAt: Date;
}

const eventAttendeeSchema = new Schema<IEventAttendee>(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentReference: {
      type: String,
    },
    attendanceStatus: {
      type: String,
      enum: Object.values(AttendanceStatus),
      default: AttendanceStatus.REGISTERED,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only register once for an event
eventAttendeeSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const EventAttendee = mongoose.model<IEventAttendee>(
  'EventAttendee',
  eventAttendeeSchema
);

export default EventAttendee;
