import mongoose, { Schema, Document } from 'mongoose';

export enum AcknowledgmentStatus {
  PENDING = 'pending',
  ACKNOWLEDGED = 'acknowledged',
}

export interface IDonation extends Document {
  pharmacyId: mongoose.Types.ObjectId;
  amount: number;
  donationDate: Date;
  purpose: string;
  acknowledgmentStatus: AcknowledgmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const donationSchema = new Schema<IDonation>(
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
    donationDate: {
      type: Date,
      default: Date.now,
    },
    purpose: {
      type: String,
      required: [true, 'Purpose is required'],
    },
    acknowledgmentStatus: {
      type: String,
      enum: Object.values(AcknowledgmentStatus),
      default: AcknowledgmentStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

const Donation = mongoose.model<IDonation>('Donation', donationSchema);

export default Donation;
