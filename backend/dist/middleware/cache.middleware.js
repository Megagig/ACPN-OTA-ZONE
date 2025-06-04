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
exports.clearCacheMiddleware = exports.cacheMiddleware = void 0;
const redis_1 = require("../config/redis");
/**
 * Middleware to cache API responses
 * @param prefix Resource type prefix (e.g., "users", "events")
 * @param options Cache options
 */
const cacheMiddleware = (prefix, options = {}) => {
    const { ttl = 300, keyFn, shouldCache } = options;
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        // Skip caching for non-GET requests or if shouldCache returns false
        if (req.method !== 'GET' || (shouldCache && !shouldCache(req))) {
            return next();
        }
        // Generate cache key
        const cacheKey = keyFn
            ? keyFn(req)
            : redis_1.redisCache.createKey(prefix, req.params.id, req.query);
        try {
            // Check if data exists in cache
            const cachedData = yield redis_1.redisCache.get(cacheKey);
            if (cachedData) {
                // Return cached data
                res.status(200).json(cachedData);
                return;
            }
            // Store the original send function
            const originalSend = res.send;
            // Override send function to cache the response
            res.send = function (body) {
                // Only cache successful responses (2xx status codes)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    let data;
                    try {
                        data = JSON.parse(body);
                        // Cache the data
                        redis_1.redisCache.set(cacheKey, data, ttl);
                    }
                    catch (error) {
                        // If it's not valid JSON, don't cache
                    }
                }
                // Call original send function with the response
                return originalSend.call(this, body);
            };
            next();
        }
        catch (error) {
            // If there's an error with caching, continue without caching
            next();
        }
    });
};
exports.cacheMiddleware = cacheMiddleware;
/**
 * Middleware to clear cache on data mutations
 * @param prefix Resource type prefix (e.g., "users", "events")
 * @param patternSuffix Optional suffix pattern (e.g., "*" to clear all cache for this resource)
 */
const clearCacheMiddleware = (prefix, patternSuffix = '*') => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        // Store the original send function
        const originalSend = res.send; // Override send function to clear cache after successful mutation
        res.send = function (body) {
            // Only clear cache on successful mutations (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // For specific resource updates
                if (req.params.id) {
                    // Clear specific resource cache
                    redis_1.redisCache.del(redis_1.redisCache.createKey(prefix, req.params.id));
                }
                // Also clear any list/collection cache for this resource type
                redis_1.redisCache.delByPattern(`${prefix}:${patternSuffix}`);
            }
            // Call original send function with the response
            return originalSend.call(this, body);
        };
        next();
    });
};
exports.clearCacheMiddleware = clearCacheMiddleware;
