import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  eventType: 'meetings' | 'conference' | 'workshop' | 'seminar' | 'training' | 'social';
  location: string;
  maxAttendees?: number;
  status: 'draft' | 'published' | 'cancelled';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['meetings', 'conference', 'workshop', 'seminar', 'training', 'social']
  },
  location: {
    type: String,
    required: true
  },
  maxAttendees: {
    type: Number
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'published', 'cancelled'],
    default: 'draft'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IEvent>('Event', eventSchema); 