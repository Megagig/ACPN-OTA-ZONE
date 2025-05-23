import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { IUser } from '../models/user.model';

// Types for token data
export interface TokenData {
  id: string;
  role: string;
}

/**
 * Generate JWT token for authenticated users
 * @param user The user object
 * @returns JWT token
 */
export const generateToken = (user: IUser): string => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET as string,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};

/**
 * Send token response with cookie
 * @param user User object
 * @param statusCode HTTP status code
 * @param res Express response object
 */
export const sendTokenResponse = (
  user: IUser,
  statusCode: number,
  res: Response
): void => {
  // Create token
  const token = generateToken(user);

  const cookieOptions = {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_COOKIE_EXPIRE as string) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
        isApproved: user.isApproved,
        status: user.status,
      },
    });
};

/**
 * Verify JWT token
 * @param token The JWT token to verify
 * @returns Decoded token data or null if invalid
 */
export const verifyToken = (token: string): TokenData | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string) as TokenData;
  } catch (err) {
    return null;
  }
};
