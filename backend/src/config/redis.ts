import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Redis client configuration
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || '',
  connectTimeout: 10000, // 10 seconds
  maxRetriesPerRequest: 3,
  enableOfflineQueue: true,
  retryStrategy: (times) => {
    // Retry connection with exponential backoff (max 10 seconds)
    const delay = Math.min(times * 100, 10000);
    logger.info(
      `Redis reconnecting... attempt ${times}. Next retry in ${delay}ms`
    );
    return delay;
  },
});

// Event handlers
redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', async () => {
  logger.info('Redis client ready and accepting commands');

  // Warm the cache once Redis is ready
  try {
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.ENABLE_CACHE_WARMING === 'true'
    ) {
      // Import here to avoid circular dependency issues
      const { cacheWarming } = require('../utils/cacheWarming');

      // Delay cache warming slightly to ensure application is fully initialized
      setTimeout(async () => {
        await cacheWarming.warmCache();
      }, 5000); // 5 second delay
    }
  } catch (error) {
    logger.error(`Error during cache warming: ${error}`);
  }
});

redisClient.on('error', (err) => {
  logger.error(`Redis client error: ${err}`);
});

redisClient.on('reconnecting', (delay: number) => {
  logger.warn(`Redis client reconnecting in ${delay}ms`);
});

redisClient.on('close', () => {
  logger.warn('Redis client connection closed');
});

redisClient.on('end', () => {
  logger.warn('Redis client connection ended');
});

// Cache utility functions
export const redisCache = {
  /**
   * Get data from cache
   * @param key Cache key
   * @returns Parsed data or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const startTime = Date.now();
      const data = await redisClient.get(key);
      const duration = Date.now() - startTime;

      if (data) {
        logger.debug(`Cache HIT (${duration}ms): ${key}`);
        return JSON.parse(data);
      } else {
        logger.debug(`Cache MISS (${duration}ms): ${key}`);
        return null;
      }
    } catch (error) {
      logger.error(`Redis get error for key ${key}: ${error}`);
      return null;
    }
  },

  /**
   * Set data in cache with optional expiry
   * @param key Cache key
   * @param data Data to cache (will be JSON stringified)
   * @param expirySeconds Time in seconds until expiry (optional)
   */
  async set(key: string, data: any, expirySeconds?: number): Promise<void> {
    try {
      const startTime = Date.now();
      const stringifiedData = JSON.stringify(data);

      if (expirySeconds) {
        await redisClient.set(key, stringifiedData, 'EX', expirySeconds);
        logger.debug(
          `Cache SET with TTL=${expirySeconds}s (${Date.now() - startTime}ms): ${key}`
        );
      } else {
        await redisClient.set(key, stringifiedData);
        logger.debug(`Cache SET (${Date.now() - startTime}ms): ${key}`);
      }
    } catch (error) {
      logger.error(`Redis set error for key ${key}: ${error}`);
    }
  },

  /**
   * Delete a key from cache
   * @param key Cache key to delete
   */
  async del(key: string): Promise<void> {
    try {
      const startTime = Date.now();
      const result = await redisClient.del(key);
      logger.debug(
        `Cache DEL (${Date.now() - startTime}ms): ${key}, Keys removed: ${result}`
      );
    } catch (error) {
      logger.error(`Redis delete error for key ${key}: ${error}`);
    }
  },

  /**
   * Delete multiple keys by pattern
   * @param pattern Pattern to match keys (e.g., "users:*")
   */
  async delByPattern(pattern: string): Promise<void> {
    try {
      const startTime = Date.now();
      const keys = await redisClient.keys(pattern);

      if (keys.length > 0) {
        const result = await redisClient.del(...keys);
        logger.debug(
          `Cache DEL by pattern (${Date.now() - startTime}ms): ${pattern}, Keys matched: ${keys.length}, Keys removed: ${result}`
        );
      } else {
        logger.debug(
          `Cache DEL by pattern (${Date.now() - startTime}ms): ${pattern}, No keys matched`
        );
      }
    } catch (error) {
      logger.error(
        `Redis delete by pattern error for pattern ${pattern}: ${error}`
      );
    }
  },

  /**
   * Create a cache key based on route and parameters
   * @param prefix Resource identifier (e.g., "users", "events")
   * @param id Optional resource ID
   * @param params Optional query parameters
   * @returns Formatted cache key
   */
  createKey(prefix: string, id?: string, params?: Record<string, any>): string {
    let key = `${prefix}`;

    if (id) {
      key += `:${id}`;
    }

    if (params && Object.keys(params).length > 0) {
      // Sort params to ensure consistent key generation
      const sortedParams = Object.keys(params)
        .sort()
        .reduce(
          (result, key) => {
            if (params[key] !== undefined && params[key] !== null) {
              result[key] = params[key];
            }
            return result;
          },
          {} as Record<string, any>
        );

      key += `:${JSON.stringify(sortedParams)}`;
    }

    return key;
  },
};

export default redisClient;
