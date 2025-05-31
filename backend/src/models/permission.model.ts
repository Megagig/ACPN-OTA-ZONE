import mongoose, { Schema, Document } from 'mongoose';

export enum ResourceType {
  USER = 'user',
  PHARMACY = 'pharmacy',
  FINANCIAL_RECORD = 'financial_record',
  EVENT = 'event',
  DOCUMENT = 'document',
  COMMUNICATION = 'communication',
  ELECTION = 'election',
  POLL = 'poll',
  DONATION = 'donation',
  DUE = 'due',
  ROLE = 'role',
  PERMISSION = 'permission',
  AUDIT_TRAIL = 'audit_trail',
}

export enum ActionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  ASSIGN = 'assign',
  MANAGE = 'manage',
  EXPORT = 'export',
  IMPORT = 'import',
}

export interface IPermission extends Document {
  name: string;
  description: string;
  resource: ResourceType;
  action: ActionType;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>(
  {
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Permission description is required'],
      trim: true,
    },
    resource: {
      type: String,
      enum: Object.values(ResourceType),
      required: [true, 'Resource type is required'],
    },
    action: {
      type: String,
      enum: Object.values(ActionType),
      required: [true, 'Action type is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure uniqueness of resource-action combinations
permissionSchema.index({ resource: 1, action: 1 }, { unique: true });

const Permission = mongoose.model<IPermission>('Permission', permissionSchema);

export default Permission;
