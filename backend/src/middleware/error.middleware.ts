import { Request, Response, NextFunction } from 'express';
import ErrorResponse from '../utils/errorResponse';
import mongoose from 'mongoose';

export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  next(new ErrorResponse(`Not Found - ${req.originalUrl}`, 404));
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error for dev
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message);
    error = new ErrorResponse(
      message.join(', '),
      400,
      Object.values(err.errors)
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Token expired', 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    errors: error.errors || [],
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
