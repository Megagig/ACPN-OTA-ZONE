import mongoose, { Schema, Document } from 'mongoose';

export enum RecordType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum CategoryType {
  DUES = 'dues',
  DONATION = 'donation',
  REGISTRATION = 'registration',
  EVENT = 'event',
  OPERATIONAL = 'operational',
  ADMINISTRATIVE = 'administrative',
  SALARY = 'salary',
  UTILITY = 'utility',
  RENT = 'rent',
  MISCELLANEOUS = 'miscellaneous',
  REFUND = 'refund',
  INVESTMENT = 'investment',
  OTHER = 'other',
}

export enum PaymentMethodType {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
  ONLINE_PAYMENT = 'online_payment',
  OTHER = 'other',
}

export enum StatusType {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface IFinancialRecord extends Document {
  type: RecordType;
  amount: number;
  category: CategoryType;
  title?: string;
  description: string;
  date: Date;
  recordedBy: mongoose.Types.ObjectId;
  attachmentUrl?: string;
  attachments?: string[];
  paymentMethod?: PaymentMethodType;
  status?: StatusType;
  pharmacy?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const financialRecordSchema = new Schema<IFinancialRecord>(
  {
    type: {
      type: String,
      enum: Object.values(RecordType),
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    category: {
      type: String,
      enum: Object.values(CategoryType),
      required: true,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attachmentUrl: {
      type: String,
    },
    attachments: [
      {
        type: String,
      },
    ],
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethodType),
      default: PaymentMethodType.BANK_TRANSFER,
    },
    status: {
      type: String,
      enum: Object.values(StatusType),
      default: StatusType.PENDING,
    },
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster financial reporting queries
financialRecordSchema.index({ type: 1, date: 1 });
financialRecordSchema.index({ category: 1, date: 1 });

const FinancialRecord = mongoose.model<IFinancialRecord>(
  'FinancialRecord',
  financialRecordSchema
);

export default FinancialRecord;
