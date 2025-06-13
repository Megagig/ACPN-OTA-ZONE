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
exports.getFilteredUsers = exports.getUserAuditTrail = exports.checkUserPermission = exports.getUserPermissions = exports.bulkUpdateUserRole = exports.bulkUpdateUserStatus = exports.updateUserStatus = exports.updateUserRole = exports.getUserById = exports.getAllUsers = exports.uploadProfilePicture = exports.updateUserProfile = exports.getUserProfile = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const user_model_1 = __importStar(require("../models/user.model"));
const role_model_1 = __importDefault(require("../models/role.model"));
const auditTrail_model_1 = __importStar(require("../models/auditTrail.model"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findById(req.user.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }
    res.status(200).json({
        success: true,
        data: user,
    });
}));
// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, phone } = req.body;
    // Find user
    let user = yield user_model_1.default.findById(req.user.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }
    // Store old values for audit
    const oldUser = user.toObject();
    // Update fields
    if (firstName)
        user.firstName = firstName;
    if (lastName)
        user.lastName = lastName;
    if (phone)
        user.phone = phone;
    // Save changes
    yield user.save();
    // Add audit trail
    yield auditTrail_model_1.default.create({
        userId: req.user.id,
        action: auditTrail_model_1.ActionType.UPDATE,
        resourceType: 'USER',
        resourceId: user._id,
        details: {
            fields: ['firstName', 'lastName', 'phone'],
            oldValues: {
                firstName: oldUser.firstName,
                lastName: oldUser.lastName,
                phone: oldUser.phone,
            },
            newValues: {
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
            },
        },
        ipAddress: req.ip,
    });
    res.status(200).json({
        success: true,
        data: user,
    });
}));
// @desc    Upload profile picture
// @route   PUT /api/users/profile/picture
// @access  Private
exports.uploadProfilePicture = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Upload profile picture request received');
    console.log('Request file:', req.file);
    console.log('Request user:', req.user);
    if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({
            success: false,
            message: 'Please upload an image file',
        });
    }
    // Find user
    let user = yield user_model_1.default.findById(req.user.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }
    // Store old picture URL
    const oldPictureUrl = user.profilePicture;
    try {
        // Upload to cloudinary
        const result = yield cloudinary_1.default.uploadToCloudinary(req.file.path, 'profile_pictures');
        // Update user profile picture
        user.profilePicture = result.secure_url;
        yield user.save();
        // Add audit trail
        yield auditTrail_model_1.default.create({
            userId: req.user.id,
            action: auditTrail_model_1.ActionType.UPDATE,
            resourceType: 'USER',
            resourceId: user._id,
            details: {
                field: 'profilePicture',
                oldValue: oldPictureUrl,
                newValue: user.profilePicture,
            },
            ipAddress: req.ip,
        });
        res.status(200).json({
            success: true,
            data: {
                profilePicture: user.profilePicture,
            },
        });
    }
    catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return res.status(500).json({
            success: false,
            message: 'Error uploading image',
        });
    }
}));
// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, SuperAdmin)
exports.getAllUsers = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // Add filtering
    const filter = {};
    if (req.query.status) {
        filter.status = req.query.status;
    }
    if (req.query.role) {
        filter.role = req.query.role;
    }
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        filter.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
            { pcnLicense: searchRegex },
        ];
    }
    // Get users
    const total = yield user_model_1.default.countDocuments(filter);
    const users = yield user_model_1.default.find(filter)
        .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire -refreshToken')
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);
    res.status(200).json({
        success: true,
        count: users.length,
        total,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
        data: users,
    });
}));
// @desc    Get user by ID
// @route   GET /api/user-management/:id
// @access  Private (Admin, SuperAdmin)
exports.getUserById = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('getUserById called with ID:', req.params.id);
    console.log('Request user:', req.user);
    const user = yield user_model_1.default.findById(req.params.id).select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire -refreshToken');
    console.log('Found user:', user ? 'Yes' : 'No');
    if (!user) {
        console.log('User not found for ID:', req.params.id);
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }
    console.log('Returning user data for:', user.email);
    res.status(200).json({
        success: true,
        data: user,
    });
}));
// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private (SuperAdmin only)
exports.updateUserRole = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { role } = req.body;
    if (!role) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a role',
        });
    }
    // Check if role is valid
    if (!Object.values(user_model_1.UserRole).includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role',
        });
    }
    // Find user
    let user = yield user_model_1.default.findById(req.params.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }
    // Store old role for audit
    const oldRole = user.role;
    // Update role
    user.role = role;
    yield user.save();
    // Add audit trail
    yield auditTrail_model_1.default.create({
        userId: req.user.id,
        action: auditTrail_model_1.ActionType.ROLE_ASSIGNMENT,
        resourceType: 'USER',
        resourceId: user._id,
        details: {
            oldRole,
            newRole: user.role,
        },
        ipAddress: req.ip,
    });
    res.status(200).json({
        success: true,
        data: user,
        message: 'User role updated successfully',
    });
}));
// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Private (Admin, SuperAdmin)
exports.updateUserStatus = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a status',
        });
    }
    // Check if status is valid
    if (!Object.values(user_model_1.UserStatus).includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status',
        });
    }
    // Find user
    let user = yield user_model_1.default.findById(req.params.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }
    // Check if trying to update SuperAdmin (only another SuperAdmin can)
    if (user.role === user_model_1.UserRole.SUPERADMIN &&
        req.user.role !== user_model_1.UserRole.SUPERADMIN) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update SuperAdmin status',
        });
    }
    // Store old status for audit
    const oldStatus = user.status;
    // Update status
    user.status = status;
    // Also update isApproved based on status
    if (status === user_model_1.UserStatus.ACTIVE) {
        user.isApproved = true;
    }
    else if (status === user_model_1.UserStatus.REJECTED) {
        user.isApproved = false;
    }
    yield user.save();
    // Determine action type for audit trail
    let actionType;
    switch (status) {
        case user_model_1.UserStatus.ACTIVE:
            actionType = auditTrail_model_1.ActionType.ACTIVATION;
            break;
        case user_model_1.UserStatus.INACTIVE:
            actionType = auditTrail_model_1.ActionType.DEACTIVATION;
            break;
        case user_model_1.UserStatus.SUSPENDED:
            actionType = auditTrail_model_1.ActionType.SUSPENSION;
            break;
        case user_model_1.UserStatus.REJECTED:
            actionType = auditTrail_model_1.ActionType.REJECTION;
            break;
        default:
            actionType = auditTrail_model_1.ActionType.UPDATE;
    }
    // Add audit trail
    yield auditTrail_model_1.default.create({
        userId: req.user.id,
        action: actionType,
        resourceType: 'USER',
        resourceId: user._id,
        details: {
            oldStatus,
            newStatus: user.status,
        },
        ipAddress: req.ip,
    });
    res.status(200).json({
        success: true,
        data: user,
        message: 'User status updated successfully',
    });
}));
// @desc    Bulk update user status
// @route   PUT /api/users/bulk/status
// @access  Private (Admin, SuperAdmin)
exports.bulkUpdateUserStatus = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userIds, status } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Please provide an array of user IDs',
        });
    }
    if (!status) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a status',
        });
    }
    // Check if status is valid
    if (!Object.values(user_model_1.UserStatus).includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status',
        });
    }
    // Validate all IDs are valid ObjectIds
    const validIds = userIds.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
    if (validIds.length !== userIds.length) {
        return res.status(400).json({
            success: false,
            message: 'One or more user IDs are invalid',
        });
    }
    // Check for SuperAdmin users in the list (only another SuperAdmin can update)
    if (req.user.role !== user_model_1.UserRole.SUPERADMIN) {
        const superadminCount = yield user_model_1.default.countDocuments({
            _id: { $in: validIds },
            role: user_model_1.UserRole.SUPERADMIN,
        });
        if (superadminCount > 0) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update SuperAdmin users',
            });
        }
    }
    // Get users before update for audit
    const usersBeforeUpdate = yield user_model_1.default.find({
        _id: { $in: validIds },
    }).select('_id status');
    // Map to easily access by ID
    const userStatusMap = new Map();
    usersBeforeUpdate.forEach((user) => {
        userStatusMap.set(user._id.toString(), user.status);
    });
    // Update users
    const isApproved = status === user_model_1.UserStatus.ACTIVE;
    const result = yield user_model_1.default.updateMany({ _id: { $in: validIds } }, {
        $set: {
            status: status,
            isApproved: isApproved,
        },
    });
    // Determine action type for audit trail
    let actionType;
    switch (status) {
        case user_model_1.UserStatus.ACTIVE:
            actionType = auditTrail_model_1.ActionType.ACTIVATION;
            break;
        case user_model_1.UserStatus.INACTIVE:
            actionType = auditTrail_model_1.ActionType.DEACTIVATION;
            break;
        case user_model_1.UserStatus.SUSPENDED:
            actionType = auditTrail_model_1.ActionType.SUSPENSION;
            break;
        case user_model_1.UserStatus.REJECTED:
            actionType = auditTrail_model_1.ActionType.REJECTION;
            break;
        default:
            actionType = auditTrail_model_1.ActionType.UPDATE;
    }
    // Add audit trail
    yield auditTrail_model_1.default.create({
        userId: req.user.id,
        action: auditTrail_model_1.ActionType.BULK_ACTION,
        resourceType: 'USER',
        details: {
            action: actionType,
            affectedUserIds: validIds,
            newStatus: status,
            modifiedCount: result.modifiedCount,
        },
        ipAddress: req.ip,
    });
    res.status(200).json({
        success: true,
        message: `${result.modifiedCount} users updated successfully`,
        data: {
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount,
        },
    });
}));
// @desc    Bulk update user role
// @route   PUT /api/users/bulk/role
// @access  Private (SuperAdmin only)
exports.bulkUpdateUserRole = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userIds, role } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Please provide an array of user IDs',
        });
    }
    if (!role) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a role',
        });
    }
    // Check if role is valid
    if (!Object.values(user_model_1.UserRole).includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role',
        });
    }
    // Validate all IDs are valid ObjectIds
    const validIds = userIds.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
    if (validIds.length !== userIds.length) {
        return res.status(400).json({
            success: false,
            message: 'One or more user IDs are invalid',
        });
    }
    // Get users before update for audit
    const usersBeforeUpdate = yield user_model_1.default.find({
        _id: { $in: validIds },
    }).select('_id role');
    // Map to easily access by ID
    const userRoleMap = new Map();
    usersBeforeUpdate.forEach((user) => {
        userRoleMap.set(user._id.toString(), user.role);
    });
    // Update users
    const result = yield user_model_1.default.updateMany({ _id: { $in: validIds } }, { $set: { role: role } });
    // Add audit trail
    yield auditTrail_model_1.default.create({
        userId: req.user.id,
        action: auditTrail_model_1.ActionType.BULK_ACTION,
        resourceType: 'USER',
        details: {
            action: auditTrail_model_1.ActionType.ROLE_ASSIGNMENT,
            affectedUserIds: validIds,
            newRole: role,
            modifiedCount: result.modifiedCount,
        },
        ipAddress: req.ip,
    });
    res.status(200).json({
        success: true,
        message: `${result.modifiedCount} users updated successfully`,
        data: {
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount,
        },
    });
}));
// @desc    Get user permissions
// @route   GET /api/users/permissions
// @access  Private
exports.getUserPermissions = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findById(req.user.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }
    // Get the role document
    const role = yield role_model_1.default.findOne({ name: user.role }).populate('permissions');
    if (!role) {
        return res.status(404).json({
            success: false,
            message: 'Role not found',
        });
    }
    res.status(200).json({
        success: true,
        data: {
            role: role.name,
            permissions: role.permissions,
        },
    });
}));
// @desc    Check user permission
// @route   POST /api/users/check-permission
// @access  Private
exports.checkUserPermission = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { resource, action } = req.body;
    if (!resource || !action) {
        return res.status(400).json({
            success: false,
            message: 'Please provide resource and action',
        });
    }
    const user = yield user_model_1.default.findById(req.user.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }
    // SuperAdmin has all permissions
    if (user.role === user_model_1.UserRole.SUPERADMIN) {
        return res.status(200).json({
            success: true,
            data: {
                hasPermission: true,
            },
        });
    }
    // Get the role document
    const role = yield role_model_1.default.findOne({ name: user.role }).populate({
        path: 'permissions',
        match: { resource, action },
    });
    if (!role) {
        return res.status(404).json({
            success: false,
            message: 'Role not found',
        });
    }
    const hasPermission = role.permissions.length > 0;
    res.status(200).json({
        success: true,
        data: {
            hasPermission,
        },
    });
}));
// @desc    Get user audit trail
// @route   GET /api/users/:id/audit
// @access  Private (Admin, SuperAdmin)
exports.getUserAuditTrail = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Check if user exists
    const user = yield user_model_1.default.findById(id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }
    // Get all audit trails for this user as the target
    const auditTrails = yield auditTrail_model_1.default.find({
        resourceId: user._id,
    }).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        count: auditTrails.length,
        data: auditTrails,
    });
}));
// @desc    Get filtered users
// @route   GET /api/users/filter
// @access  Private (Admin, SuperAdmin)
exports.getFilteredUsers = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Create filter object from query parameters
    const filter = {};
    if (req.query.role) {
        filter.role = req.query.role;
    }
    if (req.query.status) {
        filter.status = req.query.status;
    }
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        filter.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
            { pcnLicense: searchRegex },
        ];
    }
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // Get filtered users
    const total = yield user_model_1.default.countDocuments(filter);
    const users = yield user_model_1.default.find(filter)
        .select('-password -refreshToken -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire')
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);
    res.status(200).json({
        success: true,
        count: users.length,
        total,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
        data: users,
    });
}));
exports.default = {
    getUserProfile: exports.getUserProfile,
    updateUserProfile: exports.updateUserProfile,
    uploadProfilePicture: exports.uploadProfilePicture,
    getAllUsers: exports.getAllUsers,
    getUserById: exports.getUserById,
    updateUserRole: exports.updateUserRole,
    updateUserStatus: exports.updateUserStatus,
    bulkUpdateUserStatus: exports.bulkUpdateUserStatus,
    bulkUpdateUserRole: exports.bulkUpdateUserRole,
    getUserPermissions: exports.getUserPermissions,
    checkUserPermission: exports.checkUserPermission,
    getUserAuditTrail: exports.getUserAuditTrail,
    getFilteredUsers: exports.getFilteredUsers,
    // Add aliases for functions imported in routes
    getUsersByStatus: exports.getAllUsers,
    assignUserRole: exports.updateUserRole,
    bulkAssignUserRole: exports.bulkUpdateUserRole,
    checkPermission: exports.checkUserPermission,
};
