import { Request, Response, NextFunction } from 'express';
import asyncHandler from './async.middleware';
import ErrorResponse from '../utils/errorResponse';
import User, { UserRole } from '../models/user.model';
import Role from '../models/role.model';
import Permission, {
  ResourceType,
  ActionType,
} from '../models/permission.model';
import mongoose from 'mongoose';

/**
 * Middleware to check if a user has permission to perform an action on a resource
 */
export const checkPermission = (resource: string, action: string) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new ErrorResponse('User not found in request', 500));
      }

      // SuperAdmin has all permissions
      if (req.user.role === UserRole.SUPERADMIN) {
        return next();
      }

      // Get user role
      const userRole = await Role.findOne({ name: req.user.role }).populate(
        'permissions'
      );

      if (!userRole) {
        return next(
          new ErrorResponse(`Role '${req.user.role}' not found`, 404)
        );
      }

      // Check if the role has the required permission
      const hasPermission = userRole.permissions.some(
        (p: any) => p.resource === resource && p.action === action
      );

      if (!hasPermission) {
        return next(
          new ErrorResponse(
            `You don't have permission to ${action} ${resource}`,
            403
          )
        );
      }

      next();
    }
  );
};

/**
 * Middleware to check for multiple permissions (any match grants access)
 */
export const checkAnyPermission = (
  permissions: { resource: string; action: string }[]
) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new ErrorResponse('User not found in request', 500));
      }

      // SuperAdmin has all permissions
      if (req.user.role === UserRole.SUPERADMIN) {
        return next();
      }

      // Get user role
      const userRole = await Role.findOne({ name: req.user.role }).populate(
        'permissions'
      );

      if (!userRole) {
        return next(
          new ErrorResponse(`Role '${req.user.role}' not found`, 404)
        );
      }

      // Check if the role has any of the required permissions
      const hasAnyPermission = permissions.some(({ resource, action }) =>
        userRole.permissions.some(
          (p: any) => p.resource === resource && p.action === action
        )
      );

      if (!hasAnyPermission) {
        return next(
          new ErrorResponse(
            `You don't have permission to perform this action`,
            403
          )
        );
      }

      next();
    }
  );
};

/**
 * Middleware to check for multiple permissions (all must match to grant access)
 */
export const checkAllPermissions = (
  permissions: { resource: string; action: string }[]
) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new ErrorResponse('User not found in request', 500));
      }

      // SuperAdmin has all permissions
      if (req.user.role === UserRole.SUPERADMIN) {
        return next();
      }

      // Get user role
      const userRole = await Role.findOne({ name: req.user.role }).populate(
        'permissions'
      );

      if (!userRole) {
        return next(
          new ErrorResponse(`Role '${req.user.role}' not found`, 404)
        );
      }

      // Check if the role has all of the required permissions
      const hasAllPermissions = permissions.every(({ resource, action }) =>
        userRole.permissions.some(
          (p: any) => p.resource === resource && p.action === action
        )
      );

      if (!hasAllPermissions) {
        return next(
          new ErrorResponse(
            `You don't have all required permissions to perform this action`,
            403
          )
        );
      }

      next();
    }
  );
};

export default {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
};
