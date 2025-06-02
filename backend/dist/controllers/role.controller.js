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
exports.getUsersWithRole = exports.removePermissionFromRole = exports.addPermissionToRole = exports.initializeRoles = exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoleById = exports.getRoles = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const role_model_1 = __importDefault(require("../models/role.model"));
const permission_model_1 = __importStar(require("../models/permission.model"));
const user_model_1 = __importStar(require("../models/user.model"));
const auditTrail_model_1 = __importDefault(require("../models/auditTrail.model"));
// @desc    Get all roles
// @route   GET /api/roles
// @access  Private (Admin, SuperAdmin)
exports.getRoles = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const roles = yield role_model_1.default.find().populate('permissions', 'name description resource action');
    res.status(200).json({
        success: true,
        count: roles.length,
        data: roles,
    });
}));
// @desc    Get role by ID
// @route   GET /api/roles/:id
// @access  Private (Admin, SuperAdmin)
exports.getRoleById = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const role = yield role_model_1.default.findById(req.params.id).populate('permissions', 'name description resource action');
    if (!role) {
        return res.status(404).json({
            success: false,
            message: 'Role not found',
        });
    }
    res.status(200).json({
        success: true,
        data: role,
    });
}));
// @desc    Create new role
// @route   POST /api/roles
// @access  Private (SuperAdmin only)
exports.createRole = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, permissions, isDefault = false } = req.body;
    // Check if role already exists
    const existingRole = yield role_model_1.default.findOne({ name });
    if (existingRole) {
        return res.status(400).json({
            success: false,
            message: 'Role with this name already exists',
        });
    }
    // Validate permissions
    if (permissions && permissions.length > 0) {
        const permissionIds = permissions.map((id) => new mongoose_1.default.Types.ObjectId(id));
        const validPermissions = yield permission_model_1.default.find({
            _id: { $in: permissionIds },
        });
        if (validPermissions.length !== permissions.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more permission IDs are invalid',
            });
        }
    }
    // Create role
    const role = yield role_model_1.default.create({
        name,
        description,
        permissions: permissions || [],
        isDefault,
        createdBy: req.user.id,
    });
    // Add audit trail
    yield auditTrail_model_1.default.create({
        userId: req.user.id,
        action: permission_model_1.ActionType.CREATE,
        resourceType: permission_model_1.ResourceType.ROLE,
        resourceId: role._id,
        details: { role: role.toObject() },
        ipAddress: req.ip,
    });
    res.status(201).json({
        success: true,
        data: role,
    });
}));
// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private (SuperAdmin only)
exports.updateRole = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, permissions, isActive } = req.body;
    // Find role
    let role = yield role_model_1.default.findById(req.params.id);
    if (!role) {
        return res.status(404).json({
            success: false,
            message: 'Role not found',
        });
    }
    // Prevent modification of predefined roles
    if (role.isDefault && (name || isActive === false)) {
        return res.status(400).json({
            success: false,
            message: 'Cannot modify name or deactivate a predefined role',
        });
    }
    // Store old values for audit
    const oldRole = role.toObject();
    // Validate permissions if updating
    if (permissions && permissions.length > 0) {
        const permissionIds = permissions.map((id) => new mongoose_1.default.Types.ObjectId(id));
        const validPermissions = yield permission_model_1.default.find({
            _id: { $in: permissionIds },
        });
        if (validPermissions.length !== permissions.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more permission IDs are invalid',
            });
        }
        role.permissions = permissionIds;
    }
    // Update other fields
    if (name)
        role.name = name;
    if (description)
        role.description = description;
    if (typeof isActive !== 'undefined')
        role.isActive = isActive;
    // Save changes
    yield role.save();
    // Add audit trail
    yield auditTrail_model_1.default.create({
        userId: req.user.id,
        action: permission_model_1.ActionType.UPDATE,
        resourceType: permission_model_1.ResourceType.ROLE,
        resourceId: role._id,
        details: {
            old: oldRole,
            new: role.toObject(),
        },
        ipAddress: req.ip,
    });
    res.status(200).json({
        success: true,
        data: role,
    });
}));
// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private (SuperAdmin only)
exports.deleteRole = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const role = yield role_model_1.default.findById(req.params.id);
    if (!role) {
        return res.status(404).json({
            success: false,
            message: 'Role not found',
        });
    }
    // Prevent deletion of predefined roles
    if (role.isDefault) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete a predefined role',
        });
    }
    // Check if role is assigned to any users
    const usersWithRole = yield user_model_1.default.countDocuments({ role: role.name });
    if (usersWithRole > 0) {
        return res.status(400).json({
            success: false,
            message: `Cannot delete role as it is assigned to ${usersWithRole} user(s)`,
        });
    }
    // Store for audit
    const deletedRole = role.toObject();
    yield role.deleteOne();
    // Add audit trail
    yield auditTrail_model_1.default.create({
        userId: req.user.id,
        action: permission_model_1.ActionType.DELETE,
        resourceType: permission_model_1.ResourceType.ROLE,
        resourceId: role._id,
        details: { role: deletedRole },
        ipAddress: req.ip,
    });
    res.status(200).json({
        success: true,
        data: {},
        message: 'Role deleted successfully',
    });
}));
// @desc    Initialize default roles with permissions
// @route   POST /api/roles/initialize
// @access  Private (SuperAdmin only)
exports.initializeRoles = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Get all permissions
    const permissions = yield permission_model_1.default.find();
    if (permissions.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No permissions found. Please initialize permissions first.',
        });
    }
    const permissionIds = permissions.map((p) => p._id);
    const readPermissions = permissions
        .filter((p) => p.action === permission_model_1.ActionType.READ)
        .map((p) => p._id);
    // Define default roles with their permissions
    const defaultRoles = [
        {
            name: user_model_1.UserRole.SUPERADMIN,
            description: 'Super Administrator with full system access',
            permissions: permissionIds, // All permissions
            isDefault: true,
        },
        {
            name: user_model_1.UserRole.ADMIN,
            description: 'Administrator with management access',
            permissions: permissions
                .filter((p) => p.action !== permission_model_1.ActionType.DELETE ||
                (p.resource !== permission_model_1.ResourceType.ROLE &&
                    p.resource !== permission_model_1.ResourceType.PERMISSION))
                .map((p) => p._id),
            isDefault: true,
        },
        {
            name: user_model_1.UserRole.SECRETARY,
            description: 'Secretary with document and communication management',
            permissions: permissions
                .filter((p) => p.resource === permission_model_1.ResourceType.DOCUMENT ||
                p.resource === permission_model_1.ResourceType.COMMUNICATION ||
                p.resource === permission_model_1.ResourceType.EVENT ||
                p.action === permission_model_1.ActionType.READ)
                .map((p) => p._id),
            isDefault: true,
        },
        {
            name: user_model_1.UserRole.TREASURER,
            description: 'Treasurer with financial management',
            permissions: permissions
                .filter((p) => p.resource === permission_model_1.ResourceType.FINANCIAL_RECORD ||
                p.resource === permission_model_1.ResourceType.DONATION ||
                p.action === permission_model_1.ActionType.READ)
                .map((p) => p._id),
            isDefault: true,
        },
        {
            name: user_model_1.UserRole.FINANCIAL_SECRETARY,
            description: 'Financial Secretary with dues and payment management',
            permissions: permissions
                .filter((p) => p.resource === permission_model_1.ResourceType.FINANCIAL_RECORD ||
                p.resource === permission_model_1.ResourceType.DUE ||
                p.resource === permission_model_1.ResourceType.DONATION ||
                p.action === permission_model_1.ActionType.READ)
                .map((p) => p._id),
            isDefault: true,
        },
        {
            name: user_model_1.UserRole.MEMBER,
            description: 'Regular member with basic access',
            permissions: readPermissions, // Only read permissions
            isDefault: true,
        },
    ];
    // Create roles if they don't exist
    const createdRoles = [];
    for (const roleData of defaultRoles) {
        const existing = yield role_model_1.default.findOne({ name: roleData.name });
        if (!existing) {
            const role = yield role_model_1.default.create(Object.assign(Object.assign({}, roleData), { createdBy: req.user.id }));
            createdRoles.push(role);
        }
        else {
            // Update permissions for existing role
            existing.permissions = roleData.permissions.map((id) => new mongoose_1.default.Types.ObjectId(String(id)));
            existing.description = roleData.description;
            yield existing.save();
            createdRoles.push(existing);
        }
    }
    // Add audit trail
    yield auditTrail_model_1.default.create({
        userId: req.user.id,
        action: permission_model_1.ActionType.CREATE,
        resourceType: permission_model_1.ResourceType.ROLE,
        details: { message: 'Default roles initialized' },
        ipAddress: req.ip,
    });
    res.status(200).json({
        success: true,
        count: createdRoles.length,
        message: 'Default roles initialized successfully',
        data: createdRoles,
    });
}));
// @desc    Add permission to a role
// @route   POST /api/roles/:id/permissions/:permissionId
// @access  Private (SuperAdmin only)
exports.addPermissionToRole = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, permissionId } = req.params;
    // Find role
    const role = yield role_model_1.default.findById(id);
    if (!role) {
        return res.status(404).json({
            success: false,
            message: 'Role not found',
        });
    }
    // Find permission
    const permission = yield permission_model_1.default.findById(permissionId);
    if (!permission) {
        return res.status(404).json({
            success: false,
            message: 'Permission not found',
        });
    }
    // Check if permission already exists in role
    const permissionExists = role.permissions.some((p) => p.toString() === permissionId);
    if (permissionExists) {
        return res.status(400).json({
            success: false,
            message: 'Permission already assigned to this role',
        });
    }
    // Add permission to role
    role.permissions.push(new mongoose_1.default.Types.ObjectId(permissionId));
    yield role.save();
    // Add audit trail
    yield auditTrail_model_1.default.create({
        userId: req.user.id,
        action: permission_model_1.ActionType.UPDATE,
        resourceType: permission_model_1.ResourceType.ROLE,
        resourceId: role._id,
        details: {
            message: `Permission ${permission.name} added to role ${role.name}`,
            permissionId,
        },
        ipAddress: req.ip,
    });
    res.status(200).json({
        success: true,
        data: role,
        message: 'Permission added to role successfully',
    });
}));
// @desc    Remove permission from a role
// @route   DELETE /api/roles/:id/permissions/:permissionId
// @access  Private (SuperAdmin only)
exports.removePermissionFromRole = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, permissionId } = req.params;
    // Find role
    const role = yield role_model_1.default.findById(id);
    if (!role) {
        return res.status(404).json({
            success: false,
            message: 'Role not found',
        });
    }
    // Find permission
    const permission = yield permission_model_1.default.findById(permissionId);
    if (!permission) {
        return res.status(404).json({
            success: false,
            message: 'Permission not found',
        });
    }
    // Check if permission exists in role
    const permissionExists = role.permissions.some((p) => p.toString() === permissionId);
    if (!permissionExists) {
        return res.status(400).json({
            success: false,
            message: 'Permission not assigned to this role',
        });
    }
    // Remove permission from role
    role.permissions = role.permissions.filter((p) => p.toString() !== permissionId);
    yield role.save();
    // Add audit trail
    yield auditTrail_model_1.default.create({
        userId: req.user.id,
        action: permission_model_1.ActionType.UPDATE,
        resourceType: permission_model_1.ResourceType.ROLE,
        resourceId: role._id,
        details: {
            message: `Permission ${permission.name} removed from role ${role.name}`,
            permissionId,
        },
        ipAddress: req.ip,
    });
    res.status(200).json({
        success: true,
        data: role,
        message: 'Permission removed from role successfully',
    });
}));
// @desc    Get users with a specific role
// @route   GET /api/roles/:id/users
// @access  Private (Admin, SuperAdmin)
exports.getUsersWithRole = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Find role
    const role = yield role_model_1.default.findById(id);
    if (!role) {
        return res.status(404).json({
            success: false,
            message: 'Role not found',
        });
    }
    // Find users with this role
    const users = yield user_model_1.default.find({ role: role.name }).select('-password -refreshToken -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');
    res.status(200).json({
        success: true,
        count: users.length,
        data: users,
    });
}));
