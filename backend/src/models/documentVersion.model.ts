import mongoose, { Schema } from 'mongoose';

export interface IDocumentVersion extends mongoose.Document {
  documentId: mongoose.Types.ObjectId;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  version: number;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  changes: string;
  createdAt: Date;
  updatedAt: Date;
}

const documentVersionSchema = new Schema<IDocumentVersion>(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrganizationDocument',
      required: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative'],
    },
    version: {
      type: Number,
      required: [true, 'Version number is required'],
      min: [1, 'Version must be at least 1'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    changes: {
      type: String,
      required: [true, 'Version changes description is required'],
      trim: true,
      maxlength: [
        500,
        'Changes description cannot be more than 500 characters',
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
documentVersionSchema.index({ documentId: 1, version: -1 });
documentVersionSchema.index({ uploadedAt: -1 });

// Virtual populate for uploaded by user
documentVersionSchema.virtual('uploadedByUser', {
  ref: 'User',
  localField: 'uploadedBy',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are serialized
documentVersionSchema.set('toJSON', { virtuals: true });

const DocumentVersion = mongoose.model<IDocumentVersion>(
  'DocumentVersion',
  documentVersionSchema
);

export default DocumentVersion;
