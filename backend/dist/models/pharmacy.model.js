"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const registrationNumber_1 = require("../utils/registrationNumber");
var RegistrationStatus;
(function (RegistrationStatus) {
    RegistrationStatus["ACTIVE"] = "active";
    RegistrationStatus["PENDING"] = "pending";
    RegistrationStatus["EXPIRED"] = "expired";
    RegistrationStatus["SUSPENDED"] = "suspended";
})(RegistrationStatus || (exports.RegistrationStatus = RegistrationStatus = {}));
const pharmacySchema = new mongoose_1.Schema({
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
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Removed: location, wardArea (replaced by townArea and landmark)
}, {
    timestamps: true,
    toJSON: { virtuals: true }, // Keep if you have virtuals
    toObject: { virtuals: true }, // Keep if you have virtuals
});
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
pharmacySchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isNew && !this.registrationNumber) {
            try {
                this.registrationNumber = yield (0, registrationNumber_1.getNextPharmacyRegistrationNumber)();
            }
            catch (error) {
                return next(error);
            }
        }
        next();
    });
});
const Pharmacy = mongoose_1.default.model('Pharmacy', pharmacySchema);
exports.default = Pharmacy;
