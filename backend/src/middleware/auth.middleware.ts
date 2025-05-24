import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import ErrorResponse from '../utils/errorResponse';
import User, { UserRole } from '../models/user.model';
import asyncHandler from './async.middleware';

// Extend the Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Middleware to protect routes - verify the user is logged in
 */
export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;

    // Check for token in Authorization header or cookies
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extract token from Bearer header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      // Get token from cookie
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      return next(
        new ErrorResponse('Not authorized to access this route', 401)
      );
    }

    try {
      // Verify token
      const decoded = verifyToken(token);

      if (!decoded) {
        return next(new ErrorResponse('Token is invalid or expired', 401));
      }

      // Find user by id
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new ErrorResponse('User not found', 404));
      }

      // Check if user is active
      if (user.status !== 'active') {
        return next(
          new ErrorResponse(
            'Your account is not active. Please contact an administrator.',
            403
          )
        );
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (err) {
      return next(
        new ErrorResponse('Not authorized to access this route', 401)
      );
    }
  }
);

/**
 * Grant access to specific roles
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ErrorResponse('User not found in request', 500));
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return next(
        new ErrorResponse(
          `Role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
