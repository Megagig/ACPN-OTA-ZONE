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
exports.approveUser = void 0;
const user_model_1 = __importStar(require("../models/user.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
const email_service_1 = __importDefault(require("../services/email.service"));
// @desc    Approve user
// @route   PUT /api/users/:id/approve
// @access  Private/Admin
exports.approveUser = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findById(req.params.id);
    if (!user) {
        return next(new errorResponse_1.default(`User not found with id of ${req.params.id}`, 404));
    }
    // Only update if the user isn't already approved
    if (!user.isApproved) {
        user.isApproved = true;
        user.status = user_model_1.UserStatus.ACTIVE;
        yield user.save();
        // Send approval notification email
        try {
            yield email_service_1.default.sendAccountApprovalEmail(user.email, `${user.firstName} ${user.lastName}`);
        }
        catch (error) {
            console.error('Failed to send approval email:', error);
            // Continue even if email fails, just log the error
        }
    }
    res.status(200).json({
        success: true,
        data: user,
        message: 'User approved successfully',
    });
}));
