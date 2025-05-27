import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PARTIALLY_PAID = 'partially_paid',
}

export enum DueAssignmentType {
  INDIVIDUAL = 'individual',
  BULK = 'bulk',
}

export interface IPenalty {
  amount: number;
  reason: string;
  addedBy: mongoose.Types.ObjectId;
  addedAt: Date;
}

export interface IDue extends Document {
  pharmacyId: mongoose.Types.ObjectId;
  dueTypeId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  amount: number;
  dueDate: Date;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  balance: number;
  penalties: IPenalty[];
  totalAmount: number; // amount + penalties
  assignmentType: DueAssignmentType;
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  year: number;
  isRecurring: boolean;
  nextDueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const penaltySchema = new Schema<IPenalty>({
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const dueSchema = new Schema<IDue>(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
    },
    dueTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DueType',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Due title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be non-negative'],
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
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      default: function (this: IDue) {
        // Safe calculation with null/undefined checks
        if (this === null || this === undefined) return 0;

        // Calculate directly without relying on totalAmount
        const amount = Number(this.amount) || 0;
        const penaltyAmount =
          this.penalties?.reduce(
            (sum, penalty) => sum + Number(penalty.amount || 0),
            0
          ) || 0;
        const amountPaid = Number(this.amountPaid) || 0;

        return amount + penaltyAmount - amountPaid;
      },
    },
    penalties: [penaltySchema],
    totalAmount: {
      type: Number,
      default: function (this: IDue) {
        // Safe calculation with null/undefined checks
        if (this === null || this === undefined) return 0;

        const penaltyAmount =
          this.penalties?.reduce(
            (sum, penalty) => sum + Number(penalty.amount || 0),
            0
          ) || 0;

        // Ensure this.amount is a number with null/undefined check
        const amount = Number(this.amount) || 0;
        return amount + penaltyAmount;
      },
    },
    assignmentType: {
      type: String,
      enum: Object.values(DueAssignmentType),
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    year: {
      type: Number,
      required: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    nextDueDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate totalAmount and balance
dueSchema.pre('save', function (this: IDue) {
  const currentAmount = Number(this.amount) || 0; // Ensure amount is a number
  const penaltyAmount =
    this.penalties?.reduce((sum, penalty) => sum + penalty.amount, 0) || 0;
  this.totalAmount = currentAmount + penaltyAmount;

  const currentAmountPaid = Number(this.amountPaid) || 0; // Ensure amountPaid is a number
  this.balance = this.totalAmount - currentAmountPaid;

  // Update payment status based on payment
  if (this.amountPaid === 0) {
    this.paymentStatus = PaymentStatus.PENDING;
  } else if (this.amountPaid >= this.totalAmount) {
    this.paymentStatus = PaymentStatus.PAID;
  } else {
    this.paymentStatus = PaymentStatus.PARTIALLY_PAID;
  }
});

// Index for faster queries
dueSchema.index({ pharmacyId: 1, dueTypeId: 1, year: 1 }, { unique: true }); // Updated to include dueTypeId in the unique index
dueSchema.index({ pharmacyId: 1, year: 1 }); // Keep this as a non-unique index for queries
dueSchema.index({ dueTypeId: 1 });
dueSchema.index({ paymentStatus: 1 });
dueSchema.index({ dueDate: 1 });
dueSchema.index({ assignedBy: 1 });

const Due = mongoose.model<IDue>('Due', dueSchema);

export default Due;
