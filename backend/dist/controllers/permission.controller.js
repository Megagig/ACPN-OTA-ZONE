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
exports.initializePermissions = exports.deletePermission = exports.updatePermission = exports.createPermission = exports.getPermissionById = exports.getPermissions = void 0;
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const permission_model_1 = __importStar(require("../models/permission.model"));
const auditTrail_model_1 = __importStar(require("../models/auditTrail.model"));
// @desc    Get all permissions
// @route   GET /api/permissions
// @access  Private (Admin, SuperAdmin)
exports.getPermissions = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const permissions = yield permission_model_1.default.find().sort({
        resource: 1,
        action: 1,
    });
    res.status(200).json({
        success: true,
        count: permissions.length,
        data: permissions,
    });
}));
// @desc    Get permission by ID
// @route   GET /api/permissions/:id
// @access  Private (Admin, SuperAdmin)
exports.getPermissionById = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const permission = yield permission_model_1.default.findById(req.params.id);
    if (!permission) {
        return res.status(404).json({
            success: false,
            message: 'Permission not found',
        });
    }
    res.status(200).json({
        success: true,
        data: permission,
    });
}));
// @desc    Create new permission
// @route   POST /api/permissions
// @access  Private (SuperAdmin only)
exports.createPermission = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, resource, action } = req.body;
    // Check if permission already exists
    const existingPermission = yield permission_model_1.default.findOne({ resource, action });
    if (existingPermission) {
        return res.status(400).json({
            success: false,
            message: 'Permission with this resource and action already exists',
        });
    }
    // Create permission
    const permission = yield permission_model_1.default.create({
        name,
        description,
        resource,
        action,
    });
    // Add audit trail
    yield auditTrail_model_1.default.create({
        userId: req.user.id,
        action: auditTrail_model_1.ActionType.CREATE,
        resourceType: 'PERMISSION',
        resourceId: permission._id,
        details: { permission: permission.toObject() },
        ipAddress: req.ip,
    });
    res.status(201).json({
        success: true,
        data: permission,
    });
}));
// @desc    Update permission
// @route   PUT /api/permissions/:id
// @access  Private (SuperAdmin only)
exports.updatePermission = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description } = req.body;
    // Find permission
    let permission = yield permission_model_1.default.findById(req.params.id);
    if (!permission) {
        return res.status(404).json({
            success: false,
            message: 'Permission not found',
        });
    }
    // Store old values for audit
    const oldPermission = permission.toObject();
    // Update fields
    permission.name = name || permission.name;
    permission.description = description || permission.description;
    // Save changes
    yield permission.save();
    // Add audit trail
    yield auditTrail_model_1.default.create({
        userId: req.user.id,
        action: auditTrail_model_1.ActionType.UPDATE,
        resourceType: 'PERMISSION',
        resourceId: permission._id,
        details: {
            old: oldPermission,
            new: permission.toObject(),
        },
        ipAddress: req.ip,
    });
    res.status(200).json({
        success: true,
        data: permission,
    });
}));
// @desc    Delete permission
// @route   DELETE /api/permissions/:id
// @access  Private (SuperAdmin only)
exports.deletePermission = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const permission = yield permission_model_1.default.findById(req.params.id);
    if (!permission) {
        return res.status(404).json({
            success: false,
            message: 'Permission not found',
        });
    }
    // Store for audit
    const deletedPermission = permission.toObject();
    yield permission.deleteOne();
    // Add audit trail
    yield auditTrail_model_1.default.create({
        userId: req.user.id,
        action: auditTrail_model_1.ActionType.DELETE,
        resourceType: 'PERMISSION',
        resourceId: permission._id,
        details: { permission: deletedPermission },
        ipAddress: req.ip,
    });
    res.status(200).json({
        success: true,
        data: {},
        message: 'Permission deleted successfully',
    });
}));
// @desc    Initialize default permissions
// @route   POST /api/permissions/initialize
// @access  Private (SuperAdmin only)
exports.initializePermissions = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const defaultPermissions = [];
    // Create default permissions for each resource and action
    for (const resource of Object.values(permission_model_1.ResourceType)) {
        for (const action of Object.values(permission_model_1.ActionType)) {
            const name = `${action}_${resource}`;
            const description = `Permission to ${action} ${resource.replace('_', ' ')}`;
            // Skip if already exists
            const existing = yield permission_model_1.default.findOne({ resource, action });
            if (!existing) {
                const permission = yield permission_model_1.default.create({
                    name,
                    description,
                    resource,
                    action,
                });
                defaultPermissions.push(permission);
            }
        }
    }
    // Add audit trail
    yield auditTrail_model_1.default.create({
        userId: req.user.id,
        action: auditTrail_model_1.ActionType.CREATE,
        resourceType: 'PERMISSION',
        details: { message: 'Default permissions initialized' },
        ipAddress: req.ip,
    });
    res.status(200).json({
        success: true,
        count: defaultPermissions.length,
        message: 'Default permissions initialized successfully',
        data: defaultPermissions,
    });
}));
exports.default = {
    getPermissions: exports.getPermissions,
    getPermissionById: exports.getPermissionById,
    createPermission: exports.createPermission,
    updatePermission: exports.updatePermission,
    deletePermission: exports.deletePermission,
    initializePermissions: exports.initializePermissions,
};
