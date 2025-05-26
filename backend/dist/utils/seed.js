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
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importStar(require("../models/user.model"));
const db_1 = __importDefault(require("../config/db"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Creates a superadmin user for initial setup
 */
const createSuperAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Connect to the database
        yield (0, db_1.default)();
        console.log('Connected to MongoDB, checking for superadmin...');
        // Check if superadmin already exists
        const existingSuperAdmin = yield user_model_1.default.findOne({
            email: 'Megagigdev@gmail.com',
            role: user_model_1.UserRole.SUPERADMIN,
        });
        if (existingSuperAdmin) {
            console.log('Superadmin already exists. Skipping creation.');
            process.exit(0);
        }
        // Check if user exists with this email but not as superadmin
        const existingUser = yield user_model_1.default.findOne({
            email: 'Megagigdev@gmail.com',
        });
        if (existingUser) {
            console.log('User exists but not as superadmin. Updating role...');
            existingUser.role = user_model_1.UserRole.SUPERADMIN;
            existingUser.status = user_model_1.UserStatus.ACTIVE;
            existingUser.isEmailVerified = true;
            existingUser.isApproved = true;
            yield existingUser.save();
            console.log('User updated to superadmin successfully:', {
                email: existingUser.email,
                role: existingUser.role,
                id: existingUser._id,
            });
            mongoose_1.default.connection.close();
            process.exit(0);
        }
        // Create a new superadmin user
        const superAdmin = yield user_model_1.default.create({
            firstName: 'Super',
            lastName: 'Admin',
            email: 'Megagigdev@gmail.com',
            password: 'Exploit4ever@247',
            phone: '08060374755', // placeholder phone number
            role: user_model_1.UserRole.SUPERADMIN,
            status: user_model_1.UserStatus.ACTIVE,
            isEmailVerified: true,
            isApproved: true,
            registrationDate: new Date(),
        });
        console.log('Superadmin created successfully:', {
            email: superAdmin.email,
            role: superAdmin.role,
            id: superAdmin._id,
        });
        // Close the database connection
        mongoose_1.default.connection.close();
        process.exit(0);
    }
    catch (error) {
        console.error('Error creating superadmin:', error);
        mongoose_1.default.connection.close();
        process.exit(1);
    }
});
// Execute the function
createSuperAdmin();
