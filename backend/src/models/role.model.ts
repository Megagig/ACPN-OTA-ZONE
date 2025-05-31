import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from './user.model';

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: mongoose.Types.ObjectId[];
  isDefault: boolean;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Role description is required'],
      trim: true,
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Create a static method to map UserRole enum to Role documents
roleSchema.statics.mapFromUserRole = async function (userRole: UserRole) {
  const roleName = userRole.toString();
  return await this.findOne({ name: roleName });
};

const Role = mongoose.model<IRole>('Role', roleSchema);

export default Role;
