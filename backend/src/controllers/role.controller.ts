import { Request, Response } from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../middleware/async.middleware';
import Role from '../models/role.model';
import Permission, {
  ResourceType,
  ActionType,
} from '../models/permission.model';
import User, { UserRole } from '../models/user.model';
import AuditTrail from '../models/auditTrail.model';

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private (Admin, SuperAdmin)
export const getRoles = asyncHandler(async (req: Request, res: Response) => {
  const roles = await Role.find().populate(
    'permissions',
    'name description resource action'
  );

  res.status(200).json({
    success: true,
    count: roles.length,
    data: roles,
  });
});

// @desc    Get role by ID
// @route   GET /api/roles/:id
// @access  Private (Admin, SuperAdmin)
export const getRoleById = asyncHandler(async (req: Request, res: Response) => {
  const role = await Role.findById(req.params.id).populate(
    'permissions',
    'name description resource action'
  );

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
});

// @desc    Create new role
// @route   POST /api/roles
// @access  Private (SuperAdmin only)
export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, permissions, isDefault = false } = req.body;

  // Check if role already exists
  const existingRole = await Role.findOne({ name });
  if (existingRole) {
    return res.status(400).json({
      success: false,
      message: 'Role with this name already exists',
    });
  }

  // Validate permissions
  if (permissions && permissions.length > 0) {
    const permissionIds = permissions.map(
      (id: string) => new mongoose.Types.ObjectId(id)
    );

    const validPermissions = await Permission.find({
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
  const role = await Role.create({
    name,
    description,
    permissions: permissions || [],
    isDefault,
    createdBy: req.user.id,
  });

  // Add audit trail
  await AuditTrail.create({
    userId: req.user.id,
    action: ActionType.CREATE,
    resourceType: ResourceType.ROLE,
    resourceId: role._id,
    details: { role: role.toObject() },
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    data: role,
  });
});

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private (SuperAdmin only)
export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, permissions, isActive } = req.body;

  // Find role
  let role = await Role.findById(req.params.id);

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
    const permissionIds = permissions.map(
      (id: string) => new mongoose.Types.ObjectId(id)
    );

    const validPermissions = await Permission.find({
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
  if (name) role.name = name;
  if (description) role.description = description;
  if (typeof isActive !== 'undefined') role.isActive = isActive;

  // Save changes
  await role.save();

  // Add audit trail
  await AuditTrail.create({
    userId: req.user.id,
    action: ActionType.UPDATE,
    resourceType: ResourceType.ROLE,
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
});

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private (SuperAdmin only)
export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await Role.findById(req.params.id);

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
  const usersWithRole = await User.countDocuments({ role: role.name });

  if (usersWithRole > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete role as it is assigned to ${usersWithRole} user(s)`,
    });
  }

  // Store for audit
  const deletedRole = role.toObject();

  await role.deleteOne();

  // Add audit trail
  await AuditTrail.create({
    userId: req.user.id,
    action: ActionType.DELETE,
    resourceType: ResourceType.ROLE,
    resourceId: role._id,
    details: { role: deletedRole },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    data: {},
    message: 'Role deleted successfully',
  });
});

// @desc    Initialize default roles with permissions
// @route   POST /api/roles/initialize
// @access  Private (SuperAdmin only)
export const initializeRoles = asyncHandler(
  async (req: Request, res: Response) => {
    // Get all permissions
    const permissions = await Permission.find();

    if (permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No permissions found. Please initialize permissions first.',
      });
    }

    const permissionIds = permissions.map((p) => p._id);
    const readPermissions = permissions
      .filter((p) => p.action === ActionType.READ)
      .map((p) => p._id);

    // Define default roles with their permissions
    const defaultRoles = [
      {
        name: UserRole.SUPERADMIN,
        description: 'Super Administrator with full system access',
        permissions: permissionIds, // All permissions
        isDefault: true,
      },
      {
        name: UserRole.ADMIN,
        description: 'Administrator with management access',
        permissions: permissions
          .filter(
            (p) =>
              p.action !== ActionType.DELETE ||
              (p.resource !== ResourceType.ROLE &&
                p.resource !== ResourceType.PERMISSION)
          )
          .map((p) => p._id),
        isDefault: true,
      },
      {
        name: UserRole.SECRETARY,
        description: 'Secretary with document and communication management',
        permissions: permissions
          .filter(
            (p) =>
              p.resource === ResourceType.DOCUMENT ||
              p.resource === ResourceType.COMMUNICATION ||
              p.resource === ResourceType.EVENT ||
              p.action === ActionType.READ
          )
          .map((p) => p._id),
        isDefault: true,
      },
      {
        name: UserRole.TREASURER,
        description: 'Treasurer with financial management',
        permissions: permissions
          .filter(
            (p) =>
              p.resource === ResourceType.FINANCIAL_RECORD ||
              p.resource === ResourceType.DONATION ||
              p.action === ActionType.READ
          )
          .map((p) => p._id),
        isDefault: true,
      },
      {
        name: UserRole.FINANCIAL_SECRETARY,
        description: 'Financial Secretary with dues and payment management',
        permissions: permissions
          .filter(
            (p) =>
              p.resource === ResourceType.FINANCIAL_RECORD ||
              p.resource === ResourceType.DUE ||
              p.resource === ResourceType.DONATION ||
              p.action === ActionType.READ
          )
          .map((p) => p._id),
        isDefault: true,
      },
      {
        name: UserRole.MEMBER,
        description: 'Regular member with basic access',
        permissions: readPermissions, // Only read permissions
        isDefault: true,
      },
    ];

    // Create roles if they don't exist
    const createdRoles = [];

    for (const roleData of defaultRoles) {
      const existing = await Role.findOne({ name: roleData.name });

      if (!existing) {
        const role = await Role.create({
          ...roleData,
          createdBy: req.user.id,
        });

        createdRoles.push(role);
      } else {
        // Update permissions for existing role
        existing.permissions = roleData.permissions.map(
          (id) => new mongoose.Types.ObjectId(String(id))
        );
        existing.description = roleData.description;
        await existing.save();
        createdRoles.push(existing);
      }
    }

    // Add audit trail
    await AuditTrail.create({
      userId: req.user.id,
      action: ActionType.CREATE,
      resourceType: ResourceType.ROLE,
      details: { message: 'Default roles initialized' },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      count: createdRoles.length,
      message: 'Default roles initialized successfully',
      data: createdRoles,
    });
  }
);

// @desc    Add permission to a role
// @route   POST /api/roles/:id/permissions/:permissionId
// @access  Private (SuperAdmin only)
export const addPermissionToRole = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, permissionId } = req.params;

    // Find role
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    // Find permission
    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found',
      });
    }

    // Check if permission already exists in role
    const permissionExists = role.permissions.some(
      (p) => p.toString() === permissionId
    );
    if (permissionExists) {
      return res.status(400).json({
        success: false,
        message: 'Permission already assigned to this role',
      });
    }

    // Add permission to role
    role.permissions.push(new mongoose.Types.ObjectId(permissionId));
    await role.save();

    // Add audit trail
    await AuditTrail.create({
      userId: req.user.id,
      action: ActionType.UPDATE,
      resourceType: ResourceType.ROLE,
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
  }
);

// @desc    Remove permission from a role
// @route   DELETE /api/roles/:id/permissions/:permissionId
// @access  Private (SuperAdmin only)
export const removePermissionFromRole = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, permissionId } = req.params;

    // Find role
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    // Find permission
    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found',
      });
    }

    // Check if permission exists in role
    const permissionExists = role.permissions.some(
      (p) => p.toString() === permissionId
    );
    if (!permissionExists) {
      return res.status(400).json({
        success: false,
        message: 'Permission not assigned to this role',
      });
    }

    // Remove permission from role
    role.permissions = role.permissions.filter(
      (p) => p.toString() !== permissionId
    );
    await role.save();

    // Add audit trail
    await AuditTrail.create({
      userId: req.user.id,
      action: ActionType.UPDATE,
      resourceType: ResourceType.ROLE,
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
  }
);

// @desc    Get users with a specific role
// @route   GET /api/roles/:id/users
// @access  Private (Admin, SuperAdmin)
export const getUsersWithRole = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Find role
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    // Find users with this role
    const users = await User.find({ role: role.name }).select(
      '-password -refreshToken -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire'
    );

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  }
);
