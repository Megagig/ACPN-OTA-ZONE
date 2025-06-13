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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warmCache = exports.clearCache = exports.getCacheStats = void 0;
const redis_1 = require("../config/redis");
const redis_2 = __importDefault(require("../config/redis"));
const logger_1 = require("../utils/logger");
/**
 * Get cache statistics and information
 */
const getCacheStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get Redis info
        const info = yield redis_2.default.info();
        const memory = yield redis_2.default.info('memory');
        const stats = yield redis_2.default.info('stats');
        // Parse the info string to extract useful metrics
        const parseInfo = (infoString) => {
            const lines = infoString.split('\r\n');
            const result = {};
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
            hit_rate: statsInfo.keyspace_hits && statsInfo.keyspace_misses
                ? ((parseInt(statsInfo.keyspace_hits) /
                    (parseInt(statsInfo.keyspace_hits) +
                        parseInt(statsInfo.keyspace_misses))) *
                    100).toFixed(2)
                : '0',
            total_commands_processed: parseInt(statsInfo.total_commands_processed) || 0,
            uptime_in_seconds: parseInt(generalInfo.uptime_in_seconds) || 0,
        };
        res.status(200).json({
            success: true,
            data: cacheStats,
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting cache stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cache statistics',
        });
    }
});
exports.getCacheStats = getCacheStats;
/**
 * Clear cache by pattern or specific key
 */
const clearCache = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            deletedCount = yield redis_2.default.del(key);
        }
        else if (pattern) {
            // Delete by pattern using redisClient directly
            const keys = yield redis_2.default.keys(pattern);
            if (keys.length > 0) {
                deletedCount = yield redis_2.default.del(...keys);
            }
        }
        res.status(200).json({
            success: true,
            message: `Successfully deleted ${deletedCount} cache entries`,
            deletedCount,
        });
    }
    catch (error) {
        logger_1.logger.error('Error clearing cache:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear cache',
        });
    }
});
exports.clearCache = clearCache;
/**
 * Warm cache by pre-loading common data
 */
const warmCache = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { resources } = req.body;
        if (!resources || !Array.isArray(resources)) {
            res.status(400).json({
                success: false,
                message: 'Resources array must be provided',
            });
            return;
        }
        const warmedResources = [];
        // This is a basic implementation - in a real scenario, you would
        // pre-load specific data based on the resources requested
        for (const resource of resources) {
            try {
                // Example: Pre-load user data, events, etc.
                // This would typically involve calling your service methods
                // and storing the results in cache
                // For now, we'll just mark it as warmed using redisCache
                yield redis_1.redisCache.set(`warmed:${resource}`, { warmed: true, timestamp: new Date() }, 3600);
                warmedResources.push(resource);
            }
            catch (error) {
                logger_1.logger.error(`Error warming cache for resource ${resource}:`, error);
            }
        }
        res.status(200).json({
            success: true,
            message: `Successfully warmed cache for ${warmedResources.length} resources`,
            warmedResources,
        });
    }
    catch (error) {
        logger_1.logger.error('Error warming cache:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to warm cache',
        });
    }
});
exports.warmCache = warmCache;
