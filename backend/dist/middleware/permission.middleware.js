"use strict";
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
exports.checkAllPermissions = exports.checkAnyPermission = exports.checkPermission = void 0;
const async_middleware_1 = __importDefault(require("./async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
const user_model_1 = require("../models/user.model");
const role_model_1 = __importDefault(require("../models/role.model"));
/**
 * Middleware to check if a user has permission to perform an action on a resource
 */
const checkPermission = (resource, action) => {
    return (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.user) {
            return next(new errorResponse_1.default('User not found in request', 500));
        }
        // SuperAdmin has all permissions
        if (req.user.role === user_model_1.UserRole.SUPERADMIN) {
            return next();
        }
        // Get user role
        const userRole = yield role_model_1.default.findOne({ name: req.user.role }).populate('permissions');
        if (!userRole) {
            return next(new errorResponse_1.default(`Role '${req.user.role}' not found`, 404));
        }
        // Check if the role has the required permission
        const hasPermission = userRole.permissions.some((p) => p.resource === resource && p.action === action);
        if (!hasPermission) {
            return next(new errorResponse_1.default(`You don't have permission to ${action} ${resource}`, 403));
        }
        next();
    }));
};
exports.checkPermission = checkPermission;
/**
 * Middleware to check for multiple permissions (any match grants access)
 */
const checkAnyPermission = (permissions) => {
    return (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.user) {
            return next(new errorResponse_1.default('User not found in request', 500));
        }
        // SuperAdmin has all permissions
        if (req.user.role === user_model_1.UserRole.SUPERADMIN) {
            return next();
        }
        // Get user role
        const userRole = yield role_model_1.default.findOne({ name: req.user.role }).populate('permissions');
        if (!userRole) {
            return next(new errorResponse_1.default(`Role '${req.user.role}' not found`, 404));
        }
        // Check if the role has any of the required permissions
        const hasAnyPermission = permissions.some(({ resource, action }) => userRole.permissions.some((p) => p.resource === resource && p.action === action));
        if (!hasAnyPermission) {
            return next(new errorResponse_1.default(`You don't have permission to perform this action`, 403));
        }
        next();
    }));
};
exports.checkAnyPermission = checkAnyPermission;
/**
 * Middleware to check for multiple permissions (all must match to grant access)
 */
const checkAllPermissions = (permissions) => {
    return (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.user) {
            return next(new errorResponse_1.default('User not found in request', 500));
        }
        // SuperAdmin has all permissions
        if (req.user.role === user_model_1.UserRole.SUPERADMIN) {
            return next();
        }
        // Get user role
        const userRole = yield role_model_1.default.findOne({ name: req.user.role }).populate('permissions');
        if (!userRole) {
            return next(new errorResponse_1.default(`Role '${req.user.role}' not found`, 404));
        }
        // Check if the role has all of the required permissions
        const hasAllPermissions = permissions.every(({ resource, action }) => userRole.permissions.some((p) => p.resource === resource && p.action === action));
        if (!hasAllPermissions) {
            return next(new errorResponse_1.default(`You don't have all required permissions to perform this action`, 403));
        }
        next();
    }));
};
exports.checkAllPermissions = checkAllPermissions;
exports.default = {
    checkPermission: exports.checkPermission,
    checkAnyPermission: exports.checkAnyPermission,
    checkAllPermissions: exports.checkAllPermissions,
};
