import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendee extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'registered' | 'present' | 'absent' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentReference?: string;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const attendeeSchema = new Schema<IAttendee>({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['registered', 'present', 'absent', 'cancelled'],
    default: 'registered'
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentReference: {
    type: String
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure a user can only register once per event
attendeeSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IAttendee>('Attendee', attendeeSchema); 