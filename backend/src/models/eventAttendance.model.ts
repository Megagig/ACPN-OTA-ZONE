import mongoose, { Schema, Document } from 'mongoose';

export interface IEventAttendance extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  attended: boolean;
  markedBy: mongoose.Types.ObjectId; // Admin who marked attendance
  markedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventAttendanceSchema = new Schema<IEventAttendance>(
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
    attended: {
      type: Boolean,
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one attendance record per user per event
eventAttendanceSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const EventAttendance = mongoose.model<IEventAttendance>(
  'EventAttendance',
  eventAttendanceSchema
);

export default EventAttendance;
