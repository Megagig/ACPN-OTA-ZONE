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
  SALARY = 'salary',
  UTILITY = 'utility',
  OTHER = 'other',
}

export interface IFinancialRecord extends Document {
  type: RecordType;
  amount: number;
  category: CategoryType;
  description: string;
  date: Date;
  recordedBy: mongoose.Types.ObjectId;
  attachmentUrl?: string;
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
