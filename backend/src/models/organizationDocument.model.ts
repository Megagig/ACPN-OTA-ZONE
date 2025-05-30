import mongoose, { Schema } from 'mongoose';

export enum DocumentCategory {
  POLICY = 'policy',
  FORM = 'form',
  REPORT = 'report',
  NEWSLETTER = 'newsletter',
  MINUTES = 'minutes',
  GUIDELINE = 'guideline',
  OTHER = 'other',
}

export enum DocumentAccessLevel {
  PUBLIC = 'public',
  MEMBERS = 'members',
  COMMITTEE = 'committee',
  EXECUTIVES = 'executives',
  ADMIN = 'admin',
}

export enum DocumentStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export interface DocumentTag {
  _id: string;
  name: string;
}

export interface IOrganizationDocument extends mongoose.Document {
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  category: DocumentCategory;
  tags: DocumentTag[];
  accessLevel: DocumentAccessLevel;
  status: DocumentStatus;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  modifiedAt?: Date;
  modifiedBy?: mongoose.Types.ObjectId;
  version: number;
  downloadCount: number;
  viewCount: number;
  expirationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const documentTagSchema = new Schema<DocumentTag>({
  _id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
});

const organizationDocumentSchema = new Schema<IOrganizationDocument>(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Document description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
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
    fileType: {
      type: String,
      required: [true, 'File type is required'],
    },
    category: {
      type: String,
      enum: Object.values(DocumentCategory),
      required: [true, 'Document category is required'],
    },
    tags: [documentTagSchema],
    accessLevel: {
      type: String,
      enum: Object.values(DocumentAccessLevel),
      required: [true, 'Access level is required'],
      default: DocumentAccessLevel.MEMBERS,
    },
    status: {
      type: String,
      enum: Object.values(DocumentStatus),
      default: DocumentStatus.ACTIVE,
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
    modifiedAt: {
      type: Date,
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    version: {
      type: Number,
      default: 1,
      min: [1, 'Version must be at least 1'],
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: [0, 'Download count cannot be negative'],
    },
    viewCount: {
      type: Number,
      default: 0,
      min: [0, 'View count cannot be negative'],
    },
    expirationDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
organizationDocumentSchema.index({ category: 1 });
organizationDocumentSchema.index({ accessLevel: 1 });
organizationDocumentSchema.index({ status: 1 });
organizationDocumentSchema.index({ uploadedAt: -1 });
organizationDocumentSchema.index({ 'tags.name': 1 });
organizationDocumentSchema.index({ title: 'text', description: 'text' });

// Virtual populate for uploaded by user
organizationDocumentSchema.virtual('uploadedByUser', {
  ref: 'User',
  localField: 'uploadedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual populate for modified by user
organizationDocumentSchema.virtual('modifiedByUser', {
  ref: 'User',
  localField: 'modifiedBy',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are serialized
organizationDocumentSchema.set('toJSON', { virtuals: true });

const OrganizationDocument = mongoose.model<IOrganizationDocument>(
  'OrganizationDocument',
  organizationDocumentSchema
);

export default OrganizationDocument;
