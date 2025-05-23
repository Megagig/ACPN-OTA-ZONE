import mongoose, { Schema, Document } from 'mongoose';

export enum DocumentType {
  LICENSE = 'license',
  PERMIT = 'permit',
  CERTIFICATE = 'certificate',
  IDENTIFICATION = 'identification',
  OTHER = 'other',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export interface IDocument extends Document {
  pharmacyId: mongoose.Types.ObjectId;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  uploadDate: Date;
  expiryDate?: Date;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
    },
    documentType: {
      type: String,
      enum: Object.values(DocumentType),
      required: [true, 'Document type is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model<IDocument>('Document', documentSchema);

export default Document;
