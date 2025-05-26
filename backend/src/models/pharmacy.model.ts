import mongoose, { Schema, Document } from 'mongoose';
import { getNextPharmacyRegistrationNumber } from '../utils/registrationNumber';

export enum RegistrationStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
}

// New interface for SocialMedia
export interface ISocialMedia {
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
}

export interface IPharmacy extends Document {
  name: string;
  email: string; // New
  phone: string; // New
  yearEstablished?: number; // New
  address: string; // Street Address
  landmark: string; // New
  townArea: string; // New (replaces former location and wardArea)
  registrationNumber: string; // Auto-generated incremental number (ACPN001, ACPN002, etc.)
  pcnLicense: string; // Was Previous Pharmacy License Number
  licenseExpiryDate: Date; // New
  numberOfStaff?: number; // Ensured this line is clean
  superintendentName: string;
  superintendentLicenseNumber: string; // New
  superintendentPhoto: string; // Now required
  superintendentPhone: string; // New
  directorName: string;
  directorPhoto: string; // Now required
  directorPhone: string; // New
  operatingHours?: string; // New
  websiteUrl?: string; // New
  socialMedia?: ISocialMedia; // New
  servicesOffered?: string[]; // New
  registrationStatus: RegistrationStatus;
  registrationDate: Date;
  userId: mongoose.Types.ObjectId;
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
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    yearEstablished: {
      type: Number,
      min: 1800, // Optional: Add validation for sensible year
      max: new Date().getFullYear(), // Optional: Max current year
    },
    address: {
      type: String,
      required: [true, 'Street address is required'],
    },
    landmark: {
      type: String,
      required: [true, 'Landmark is required'],
    },
    townArea: {
      type: String,
      required: [true, 'Town/Area is required'],
    },
    registrationNumber: {
      type: String,
      unique: true,
      // Remove default UUID generation - will be set by pre-save hook
    },
    pcnLicense: {
      type: String,
      required: [
        true,
        'PCN license number (Previous Pharmacy License Number) is required',
      ],
    },
    licenseExpiryDate: {
      type: Date,
      required: [true, 'License expiry date is required'],
    },
    numberOfStaff: {
      // Ensured this block is clean
      type: Number,
      min: 0, // Optional: Staff count cannot be negative
    },
    superintendentName: {
      type: String,
      required: [true, 'Superintendent name is required'],
    },
    superintendentLicenseNumber: {
      type: String,
      required: [true, 'Superintendent license number is required'],
    },
    superintendentPhoto: {
      type: String,
      required: [true, 'Superintendent photo URL is required'], // URL from Cloudinary
    },
    superintendentPhone: {
      type: String,
      required: [true, 'Superintendent phone number is required'],
    },
    directorName: {
      type: String,
      required: [true, 'Director name is required'],
    },
    directorPhoto: {
      type: String,
      required: [true, 'Director photo URL is required'], // URL from Cloudinary
    },
    directorPhone: {
      type: String,
      required: [true, 'Director phone number is required'],
    },
    operatingHours: {
      type: String,
      trim: true, // Added trim
    },
    websiteUrl: {
      type: String,
      trim: true, // Added trim
    },
    socialMedia: {
      type: {
        facebookUrl: { type: String, trim: true }, // Added trim
        twitterUrl: { type: String, trim: true }, // Added trim
        instagramUrl: { type: String, trim: true }, // Added trim
      },
      default: {},
    },
    servicesOffered: {
      type: [String],
      default: [],
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
    // Removed: location, wardArea (replaced by townArea and landmark)
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Keep if you have virtuals
    toObject: { virtuals: true }, // Keep if you have virtuals
  }
);

// Comment out or remove virtuals if not actively used or if they reference removed fields
// pharmacySchema.virtual('documents', {
//   ref: 'Document',
//   localField: '_id',
//   foreignField: 'pharmacyId',
//   justOne: false,
// });

// pharmacySchema.virtual('dues', {
//   ref: 'Due',
//   localField: '_id',
//   foreignField: 'pharmacyId',
//   justOne: false,
// });

// Update index for searches
pharmacySchema.index({
  name: 'text',
  townArea: 'text',
  pcnLicense: 'text',
  email: 'text',
});

// Pre-save hook to generate registration number
pharmacySchema.pre<IPharmacy>('save', async function (next) {
  if (this.isNew && !this.registrationNumber) {
    try {
      this.registrationNumber = await getNextPharmacyRegistrationNumber();
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

const Pharmacy = mongoose.model<IPharmacy>('Pharmacy', pharmacySchema);

export default Pharmacy;
