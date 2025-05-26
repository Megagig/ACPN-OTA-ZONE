import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CHECK = 'check',
}

export enum PaymentApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DENIED = 'denied',
}

export interface IPayment extends Document {
  dueId: mongoose.Types.ObjectId;
  pharmacyId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  receiptUrl: string;
  receiptPublicId: string;
  approvalStatus: PaymentApprovalStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  submittedBy: mongoose.Types.ObjectId;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    dueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Due',
      required: true,
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than 0'],
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: [true, 'Payment method is required'],
    },
    paymentReference: {
      type: String,
      trim: true,
    },
    receiptUrl: {
      type: String,
      required: [true, 'Receipt upload is required'],
    },
    receiptPublicId: {
      type: String,
      required: true,
    },
    approvalStatus: {
      type: String,
      enum: Object.values(PaymentApprovalStatus),
      default: PaymentApprovalStatus.PENDING,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
paymentSchema.index({ dueId: 1 });
paymentSchema.index({ pharmacyId: 1 });
paymentSchema.index({ approvalStatus: 1 });
paymentSchema.index({ submittedAt: -1 });

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;
