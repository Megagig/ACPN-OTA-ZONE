import { Request, Response, NextFunction } from 'express';

/**
 * Async handler wrapper to avoid try-catch blocks in route controllers
 * @param fn Function to execute
 * @returns Express middleware function
 */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
