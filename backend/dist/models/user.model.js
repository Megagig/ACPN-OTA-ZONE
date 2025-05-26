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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStatus = exports.UserRole = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
var UserRole;
(function (UserRole) {
    UserRole["MEMBER"] = "member";
    UserRole["ADMIN"] = "admin";
    UserRole["SECRETARY"] = "secretary";
    UserRole["TREASURER"] = "treasurer";
    UserRole["SUPERADMIN"] = "superadmin";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["SUSPENDED"] = "suspended";
    UserStatus["PENDING"] = "pending";
    UserStatus["REJECTED"] = "rejected";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
const userSchema = new mongoose_1.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email address',
        ],
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true, // Added trim
        // Add a regex for basic phone number validation if desired, e.g.:
        // match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false,
    },
    role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.MEMBER,
    },
    pcnLicense: {
        type: String,
        required: [true, 'PCN License number is required'], // Added required validator
        trim: true, // Added trim
        unique: true, // Assuming PCN license should be unique
    },
    profilePicture: {
        type: String,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
    registrationDate: {
        type: Date,
        default: Date.now,
    },
    lastLoginDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: Object.values(UserStatus),
        default: UserStatus.PENDING,
    },
    mfaEnabled: {
        type: Boolean,
        default: false,
    },
    mfaSecret: {
        type: String,
        select: false,
    },
    resetPasswordToken: {
        type: String,
        select: false,
    },
    resetPasswordExpire: {
        type: Date,
        select: false,
    },
    emailVerificationToken: {
        type: String,
        select: false,
    },
    emailVerificationExpire: {
        type: Date,
        select: false,
    },
    emailVerificationCode: {
        type: String,
        select: false,
    },
    refreshToken: {
        type: String,
        select: false,
    },
    refreshTokenExpire: {
        type: Date,
        select: false,
    },
}, {
    timestamps: true,
});
// Encrypt password using bcrypt
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified('password')) {
            return next();
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        this.password = yield bcryptjs_1.default.hash(this.password, salt);
        next();
    });
});
// Match user entered password to hashed password in database
userSchema.methods.comparePassword = function (enteredPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.compare(enteredPassword, this.password);
    });
};
// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto_1.default.randomBytes(20).toString('hex');
    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto_1.default
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    // Set expire
    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    return resetToken;
};
// Generate email verification token
userSchema.methods.getEmailVerificationToken = function () {
    // Generate token
    const verificationToken = crypto_1.default.randomBytes(20).toString('hex');
    // Hash token and set to emailVerificationToken field
    this.emailVerificationToken = crypto_1.default
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
    // Set expire
    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    return verificationToken;
};
// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
    // Generate token
    const refreshToken = crypto_1.default.randomBytes(30).toString('hex');
    // Hash token and set to refreshToken field
    this.refreshToken = crypto_1.default
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
    // Set expire (longer than the access token)
    this.refreshTokenExpire = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    return refreshToken;
};
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
