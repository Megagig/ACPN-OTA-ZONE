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

export enum PaymentType {
  DUE = 'due',
  DONATION = 'donation',
  EVENT_FEE = 'event_fee',
  REGISTRATION_FEE = 'registration_fee',
  CONFERENCE_FEE = 'conference_fee',
  ACCOMMODATION = 'accommodation',
  SEMINAR = 'seminar',
  TRANSPORTATION = 'transportation',
  BUILDING = 'building',
  OTHER = 'other',
}

export interface IPayment extends Document {
  paymentType: PaymentType;
  dueId?: mongoose.Types.ObjectId;
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
  meta?: Record<string, any>;
}

const paymentSchema = new Schema<IPayment>(
  {
    paymentType: {
      type: String,
      enum: Object.values(PaymentType),
      required: true,
      default: PaymentType.DUE,
    },
    dueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Due',
      required: function (this: IPayment) {
        return this.paymentType === PaymentType.DUE;
      },
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
    meta: {
      type: Schema.Types.Mixed,
      default: {},
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
