import { Request, Response } from 'express';
import asyncHandler from '../middleware/async.middleware';
import Permission, {
  ResourceType,
  ActionType,
} from '../models/permission.model';
import AuditTrail from '../models/auditTrail.model';

// @desc    Get all permissions
// @route   GET /api/permissions
// @access  Private (Admin, SuperAdmin)
export const getPermissions = asyncHandler(
  async (req: Request, res: Response) => {
    const permissions = await Permission.find().sort({
      resource: 1,
      action: 1,
    });

    res.status(200).json({
      success: true,
      count: permissions.length,
      data: permissions,
    });
  }
);

// @desc    Get permission by ID
// @route   GET /api/permissions/:id
// @access  Private (Admin, SuperAdmin)
export const getPermissionById = asyncHandler(
  async (req: Request, res: Response) => {
    const permission = await Permission.findById(req.params.id);

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
  }
);

// @desc    Create new permission
// @route   POST /api/permissions
// @access  Private (SuperAdmin only)
export const createPermission = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description, resource, action } = req.body;

    // Check if permission already exists
    const existingPermission = await Permission.findOne({ resource, action });
    if (existingPermission) {
      return res.status(400).json({
        success: false,
        message: 'Permission with this resource and action already exists',
      });
    }

    // Create permission
    const permission = await Permission.create({
      name,
      description,
      resource,
      action,
    });

    // Add audit trail
    await AuditTrail.create({
      userId: req.user.id,
      action: 'CREATE',
      resourceType: 'PERMISSION',
      resourceId: permission._id,
      details: { permission: permission.toObject() },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: permission,
    });
  }
);

// @desc    Update permission
// @route   PUT /api/permissions/:id
// @access  Private (SuperAdmin only)
export const updatePermission = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description } = req.body;

    // Find permission
    let permission = await Permission.findById(req.params.id);

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
    await permission.save();

    // Add audit trail
    await AuditTrail.create({
      userId: req.user.id,
      action: 'UPDATE',
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
  }
);

// @desc    Delete permission
// @route   DELETE /api/permissions/:id
// @access  Private (SuperAdmin only)
export const deletePermission = asyncHandler(
  async (req: Request, res: Response) => {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found',
      });
    }

    // Store for audit
    const deletedPermission = permission.toObject();

    await permission.deleteOne();

    // Add audit trail
    await AuditTrail.create({
      userId: req.user.id,
      action: 'DELETE',
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
  }
);

// @desc    Initialize default permissions
// @route   POST /api/permissions/initialize
// @access  Private (SuperAdmin only)
export const initializePermissions = asyncHandler(
  async (req: Request, res: Response) => {
    const defaultPermissions = [];

    // Create default permissions for each resource and action
    for (const resource of Object.values(ResourceType)) {
      for (const action of Object.values(ActionType)) {
        const name = `${action}_${resource}`;
        const description = `Permission to ${action} ${resource.replace('_', ' ')}`;

        // Skip if already exists
        const existing = await Permission.findOne({ resource, action });
        if (!existing) {
          const permission = await Permission.create({
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
    await AuditTrail.create({
      userId: req.user.id,
      action: 'CREATE',
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
  }
);

export default {
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  initializePermissions,
};
