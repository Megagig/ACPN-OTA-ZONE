import mongoose, { Schema, Document } from 'mongoose';

export interface IDueType extends Document {
  name: string;
  description?: string;
  defaultAmount: number;
  isRecurring: boolean;
  recurringPeriod?: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const dueTypeSchema = new Schema<IDueType>(
  {
    name: {
      type: String,
      required: [true, 'Due type name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    defaultAmount: {
      type: Number,
      required: [true, 'Default amount is required'],
      default: 0,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPeriod: {
      type: String,
      enum: ['monthly', 'quarterly', 'semi-annual', 'annual'],
      required: function (this: IDueType) {
        return this.isRecurring;
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
dueTypeSchema.index({ name: 1 });
dueTypeSchema.index({ isActive: 1 });

const DueType = mongoose.model<IDueType>('DueType', dueTypeSchema);

export default DueType;
