import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunicationRecipient extends Document {
  communicationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  readStatus: boolean;
  readTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const communicationRecipientSchema = new Schema<ICommunicationRecipient>(
  {
    communicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Communication',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readStatus: {
      type: Boolean,
      default: false,
    },
    readTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user is only added once as a recipient for a communication
communicationRecipientSchema.index(
  { communicationId: 1, userId: 1 },
  { unique: true }
);

const CommunicationRecipient = mongoose.model<ICommunicationRecipient>(
  'CommunicationRecipient',
  communicationRecipientSchema
);

export default CommunicationRecipient;
