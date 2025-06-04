"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheInvalidation = void 0;
const redis_1 = require("../config/redis");
/**
 * Cache invalidation utility for more advanced cache management
 */
exports.cacheInvalidation = {
    /**
     * Invalidate cache for a specific resource
     * @param resourceType Resource type (e.g., "users", "events")
     * @param id Resource ID
     */
    invalidateResource(resourceType, id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield redis_1.redisCache.del(`${resourceType}:${id}`);
        });
    },
    /**
     * Invalidate all cache for a resource type
     * @param resourceType Resource type (e.g., "users", "events")
     */
    invalidateCollection(resourceType) {
        return __awaiter(this, void 0, void 0, function* () {
            yield redis_1.redisCache.delByPattern(`${resourceType}:*`);
        });
    },
    /**
     * Invalidate related resources when a relationship changes
     * @param relations Map of resource types and their IDs to invalidate
     */
    invalidateRelations(relations) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const [resourceType, ids] of Object.entries(relations)) {
                for (const id of ids) {
                    yield redis_1.redisCache.del(`${resourceType}:${id}`);
                }
                // Also clear any collection queries
                yield redis_1.redisCache.delByPattern(`${resourceType}:*`);
            }
        });
    },
    /**
     * Invalidate cache by user
     * @param userId User ID
     */
    invalidateUserRelatedData(userId) {
        return __awaiter(this, void 0, void 0, function* () {
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
                yield redis_1.redisCache.delByPattern(pattern);
            }
        });
    }
};
