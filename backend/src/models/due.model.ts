import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PARTIALLY_PAID = 'partially_paid',
}

export interface IDue extends Document {
  pharmacyId: mongoose.Types.ObjectId;
  amount: number;
  dueDate: Date;
  paymentStatus: PaymentStatus;
  paymentDate?: Date;
  paymentReference?: string;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

const dueSchema = new Schema<IDue>(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentDate: {
      type: Date,
    },
    paymentReference: {
      type: String,
    },
    year: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
dueSchema.index({ pharmacyId: 1, year: 1 }, { unique: true });

const Due = mongoose.model<IDue>('Due', dueSchema);

export default Due;
