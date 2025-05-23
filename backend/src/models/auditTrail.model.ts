import mongoose, { Schema, Document } from 'mongoose';

export enum ActionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PAYMENT = 'payment',
  APPROVAL = 'approval',
  OTHER = 'other',
}

export interface IAuditTrail extends Document {
  userId: mongoose.Types.ObjectId;
  action: ActionType;
  resourceType: string;
  resourceId?: mongoose.Types.ObjectId;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

const auditTrailSchema = new Schema<IAuditTrail>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(ActionType),
      required: true,
    },
    resourceType: {
      type: String,
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
auditTrailSchema.index({ userId: 1, timestamp: -1 });
auditTrailSchema.index({ resourceType: 1, resourceId: 1 });

const AuditTrail = mongoose.model<IAuditTrail>('AuditTrail', auditTrailSchema);

export default AuditTrail;
