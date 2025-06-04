import { redisCache } from '../config/redis';

/**
 * Cache invalidation utility for more advanced cache management
 */
export const cacheInvalidation = {
  /**
   * Invalidate cache for a specific resource
   * @param resourceType Resource type (e.g., "users", "events")
   * @param id Resource ID
   */
  async invalidateResource(resourceType: string, id: string): Promise<void> {
    await redisCache.del(`${resourceType}:${id}`);
  },

  /**
   * Invalidate all cache for a resource type
   * @param resourceType Resource type (e.g., "users", "events")
   */
  async invalidateCollection(resourceType: string): Promise<void> {
    await redisCache.delByPattern(`${resourceType}:*`);
  },

  /**
   * Invalidate related resources when a relationship changes
   * @param relations Map of resource types and their IDs to invalidate
   */
  async invalidateRelations(relations: Record<string, string[]>): Promise<void> {
    for (const [resourceType, ids] of Object.entries(relations)) {
      for (const id of ids) {
        await redisCache.del(`${resourceType}:${id}`);
      }
      // Also clear any collection queries
      await redisCache.delByPattern(`${resourceType}:*`);
    }
  },

  /**
   * Invalidate cache by user
   * @param userId User ID
   */
  async invalidateUserRelatedData(userId: string): Promise<void> {
    // Clear user-specific caches across different resource types
    const userRelatedPatterns = [
      `users:${userId}`,
      `events:*:${userId}*`,
      `permissions:*:${userId}*`,
      `payments:*:${userId}*`,
      `dues:*:${userId}*`,
      `pharmacy:*:${userId}*`,
    ];

    for (const pattern of userRelatedPatterns) {
      await redisCache.delByPattern(pattern);
    }
  }
};
