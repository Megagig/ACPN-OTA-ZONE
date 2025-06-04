import { Request, Response } from 'express';
import { redisCache } from '../config/redis';
import redisClient from '../config/redis';
import { logger } from '../utils/logger';

/**
 * Get cache statistics and information
 */
export const getCacheStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get Redis info
    const info = await redisClient.info();
    const memory = await redisClient.info('memory');
    const stats = await redisClient.info('stats');

    // Parse the info string to extract useful metrics
    const parseInfo = (infoString: string) => {
      const lines = infoString.split('\r\n');
      const result: Record<string, string> = {};

      lines.forEach((line) => {
        if (line.includes(':') && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          result[key] = value;
        }
      });

      return result;
    };

    const memoryInfo = parseInfo(memory);
    const statsInfo = parseInfo(stats);
    const generalInfo = parseInfo(info);

    const cacheStats = {
      status: 'connected',
      redis_version: generalInfo.redis_version,
      connected_clients: parseInt(generalInfo.connected_clients) || 0,
      used_memory: memoryInfo.used_memory,
      used_memory_human: memoryInfo.used_memory_human,
      keyspace_hits: parseInt(statsInfo.keyspace_hits) || 0,
      keyspace_misses: parseInt(statsInfo.keyspace_misses) || 0,
      hit_rate:
        statsInfo.keyspace_hits && statsInfo.keyspace_misses
          ? (
              (parseInt(statsInfo.keyspace_hits) /
                (parseInt(statsInfo.keyspace_hits) +
                  parseInt(statsInfo.keyspace_misses))) *
              100
            ).toFixed(2)
          : '0',
      total_commands_processed:
        parseInt(statsInfo.total_commands_processed) || 0,
      uptime_in_seconds: parseInt(generalInfo.uptime_in_seconds) || 0,
    };

    res.status(200).json({
      success: true,
      data: cacheStats,
    });
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics',
    });
  }
};

/**
 * Clear cache by pattern or specific key
 */
export const clearCache = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { pattern, key } = req.body;

    if (!pattern && !key) {
      res.status(400).json({
        success: false,
        message: 'Either pattern or key must be provided',
      });
      return;
    }

    let deletedCount = 0;

    if (key) {
      // Delete specific key using redisClient directly
      deletedCount = await redisClient.del(key);
    } else if (pattern) {
      // Delete by pattern using redisClient directly
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        deletedCount = await redisClient.del(...keys);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${deletedCount} cache entries`,
      deletedCount,
    });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
    });
  }
};

/**
 * Warm cache by pre-loading common data
 */
export const warmCache = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resources } = req.body;

    if (!resources || !Array.isArray(resources)) {
      res.status(400).json({
        success: false,
        message: 'Resources array must be provided',
      });
      return;
    }

    const warmedResources: string[] = [];

    // This is a basic implementation - in a real scenario, you would
    // pre-load specific data based on the resources requested
    for (const resource of resources) {
      try {
        // Example: Pre-load user data, events, etc.
        // This would typically involve calling your service methods
        // and storing the results in cache

        // For now, we'll just mark it as warmed using redisCache
        await redisCache.set(
          `warmed:${resource}`,
          { warmed: true, timestamp: new Date() },
          3600
        );
        warmedResources.push(resource);
      } catch (error) {
        logger.error(`Error warming cache for resource ${resource}:`, error);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully warmed cache for ${warmedResources.length} resources`,
      warmedResources,
    });
  } catch (error) {
    logger.error('Error warming cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to warm cache',
    });
  }
};
