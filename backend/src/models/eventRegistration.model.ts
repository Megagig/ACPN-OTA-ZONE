import mongoose, { Schema, Document } from 'mongoose';

export enum RegistrationStatus {
  REGISTERED = 'registered',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  WAITLIST = 'waitlist',
}

export interface IEventRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: RegistrationStatus;
  registrationDate: Date;
  paymentStatus: 'pending' | 'paid' | 'waived';
  paymentReference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventRegistrationSchema = new Schema<IEventRegistration>(
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
    status: {
      type: String,
      enum: Object.values(RegistrationStatus),
      default: RegistrationStatus.REGISTERED,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'waived'],
      default: 'pending',
    },
    paymentReference: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one registration per user per event
eventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

// Index for efficient pagination and filtering
eventRegistrationSchema.index({ eventId: 1, createdAt: -1 });
eventRegistrationSchema.index({ eventId: 1, status: 1 });

const EventRegistration = mongoose.model<IEventRegistration>(
  'EventRegistration',
  eventRegistrationSchema
);

export default EventRegistration;
