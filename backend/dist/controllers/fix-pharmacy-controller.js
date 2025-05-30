"use strict";
// Fix for 500 error in getMyPharmacy endpoint
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
exports.getMyPharmacy = void 0;
const pharmacy_model_1 = __importDefault(require("../models/pharmacy.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
/**
 * Enhanced version of getMyPharmacy with better error handling
 * Replace the original function in pharmacy.controller.ts with this one
 */
exports.getMyPharmacy = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if user exists in the request
        if (!req.user || !req.user._id) {
            console.error('User not found in request or missing _id');
            return next(new errorResponse_1.default('User not authenticated properly', 401));
        }
        // Log the user ID we're searching for
        console.log(`Looking for pharmacy with userId: ${req.user._id}`);
        // Validate that the user ID is valid
        const userExists = yield user_model_1.default.findById(req.user._id);
        if (!userExists) {
            console.error(`User with ID ${req.user._id} not found in database`);
            return next(new errorResponse_1.default('User not found in database', 404));
        }
        // Find the pharmacy with proper error handling
        try {
            const pharmacy = yield pharmacy_model_1.default.findOne({
                userId: req.user._id,
            }).populate('userId', 'firstName lastName email phone');
            if (!pharmacy) {
                console.log(`No pharmacy found for user ${req.user._id}`);
                return next(new errorResponse_1.default('Pharmacy not found for the current user', 404));
            }
            // Successfully found the pharmacy
            console.log(`Successfully found pharmacy for user ${req.user._id}`);
            res.status(200).json({
                success: true,
                data: pharmacy,
            });
        }
        catch (dbError) {
            console.error(`Database error when finding pharmacy: ${dbError}`);
            return next(new errorResponse_1.default('Error querying pharmacy database', 500));
        }
    }
    catch (error) {
        console.error('Unexpected error in getMyPharmacy:', error);
        return next(new errorResponse_1.default('Server error getting pharmacy data', 500));
    }
}));
