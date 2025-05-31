import mongoose, { Schema, Document } from 'mongoose';

export interface IPenaltyRule {
  minAttendance: number;
  maxAttendance: number;
  penaltyType: 'multiplier' | 'fixed';
  penaltyValue: number; // Multiplier factor or fixed amount
  description: string;
}

export interface IMeetingPenaltyConfig extends Document {
  year: number;
  isActive: boolean;
  penaltyRules: IPenaltyRule[];
  defaultPenalty: {
    penaltyType: 'multiplier' | 'fixed';
    penaltyValue: number;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const penaltyRuleSchema = new Schema<IPenaltyRule>({
  minAttendance: {
    type: Number,
    required: true,
  },
  maxAttendance: {
    type: Number,
    required: true,
  },
  penaltyType: {
    type: String,
    enum: ['multiplier', 'fixed'],
    required: true,
  },
  penaltyValue: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const meetingPenaltyConfigSchema = new Schema<IMeetingPenaltyConfig>(
  {
    year: {
      type: Number,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    penaltyRules: [penaltyRuleSchema],
    defaultPenalty: {
      penaltyType: {
        type: String,
        enum: ['multiplier', 'fixed'],
        required: true,
      },
      penaltyValue: {
        type: Number,
        required: true,
      },
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

const MeetingPenaltyConfig = mongoose.model<IMeetingPenaltyConfig>(
  'MeetingPenaltyConfig',
  meetingPenaltyConfigSchema
);

export default MeetingPenaltyConfig;
