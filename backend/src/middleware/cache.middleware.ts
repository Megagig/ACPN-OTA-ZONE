import { Request, Response, NextFunction, RequestHandler } from 'express';
import { redisCache } from '../config/redis';

interface CacheOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Custom key generator function */
  keyFn?: (req: Request) => string;
  /** Flag to disable caching for a specific request */
  shouldCache?: (req: Request) => boolean;
}

/**
 * Middleware to cache API responses
 * @param prefix Resource type prefix (e.g., "users", "events")
 * @param options Cache options
 */
export const cacheMiddleware = (
  prefix: string,
  options: CacheOptions = {}
): RequestHandler => {
  const { ttl = 300, keyFn, shouldCache } = options;

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Skip caching for non-GET requests or if shouldCache returns false
    if (req.method !== 'GET' || (shouldCache && !shouldCache(req))) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyFn
      ? keyFn(req)
      : redisCache.createKey(prefix, req.params.id, req.query);

    try {
      // Check if data exists in cache
      const cachedData = await redisCache.get(cacheKey);

      if (cachedData) {
        // Return cached data
        res.status(200).json(cachedData);
        return;
      }

      // Store the original send function
      const originalSend = res.send;

      // Override send function to cache the response
      res.send = function (this: Response, body: any): Response {
        // Only cache successful responses (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          let data;
          try {
            data = JSON.parse(body);
            // Cache the data
            redisCache.set(cacheKey, data, ttl);
          } catch (error) {
            // If it's not valid JSON, don't cache
          }
        }

        // Call original send function with the response
        return originalSend.call(this, body);
      } as any;

      next();
    } catch (error) {
      // If there's an error with caching, continue without caching
      next();
    }
  };
};

/**
 * Middleware to clear cache on data mutations
 * @param prefix Resource type prefix (e.g., "users", "events")
 * @param patternSuffix Optional suffix pattern (e.g., "*" to clear all cache for this resource)
 */
export const clearCacheMiddleware = (
  prefix: string,
  patternSuffix: string = '*'
): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Store the original send function
    const originalSend = res.send; // Override send function to clear cache after successful mutation
    res.send = function (this: Response, body: any): Response {
      // Only clear cache on successful mutations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // For specific resource updates
        if (req.params.id) {
          // Clear specific resource cache
          redisCache.del(redisCache.createKey(prefix, req.params.id));
        }

        // Also clear any list/collection cache for this resource type
        redisCache.delByPattern(`${prefix}:${patternSuffix}`);
      }

      // Call original send function with the response
      return originalSend.call(this, body);
    } as any;

    next();
  };
};
