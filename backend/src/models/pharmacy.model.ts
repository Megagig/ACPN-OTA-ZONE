import mongoose, { Schema, Document } from 'mongoose';

export enum RegistrationStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
}

export interface IPharmacy extends Document {
  name: string;
  registrationNumber: string;
  location: string;
  address: string;
  wardArea: string;
  registrationStatus: RegistrationStatus;
  registrationDate: Date;
  userId: mongoose.Types.ObjectId;
  superintendentName: string;
  superintendentPhoto?: string;
  directorName: string;
  directorPhoto?: string;
  pcnLicense: string;
  createdAt: Date;
  updatedAt: Date;
}

const pharmacySchema = new Schema<IPharmacy>(
  {
    name: {
      type: String,
      required: [true, 'Pharmacy name is required'],
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    wardArea: {
      type: String,
      required: [true, 'Ward/Area is required'],
    },
    registrationStatus: {
      type: String,
      enum: Object.values(RegistrationStatus),
      default: RegistrationStatus.PENDING,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    superintendentName: {
      type: String,
      required: [true, 'Superintendent name is required'],
    },
    superintendentPhoto: {
      type: String,
    },
    directorName: {
      type: String,
      required: [true, 'Director name is required'],
    },
    directorPhoto: {
      type: String,
    },
    pcnLicense: {
      type: String,
      required: [true, 'PCN license is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for documents
pharmacySchema.virtual('documents', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'pharmacyId',
  justOne: false,
});

// Virtual populate for dues
pharmacySchema.virtual('dues', {
  ref: 'Due',
  localField: '_id',
  foreignField: 'pharmacyId',
  justOne: false,
});

// Create index for faster searches
pharmacySchema.index({ name: 'text', location: 'text' });

const Pharmacy = mongoose.model<IPharmacy>('Pharmacy', pharmacySchema);

export default Pharmacy;
