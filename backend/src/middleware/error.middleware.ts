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
  // Log the request method and path for debugging
  console.error('Error occurred for request:', req.method, req.originalUrl);
  // Log the error stack for debugging
  if (err && err.stack) {
    console.error('Error stack:', err.stack);
  }
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key
  if (err.code && err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(', ');
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
