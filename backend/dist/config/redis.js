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
exports.redisCache = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
// Check if Redis is enabled
const isRedisEnabled = process.env.ENABLE_REDIS === 'true';
// Redis client configuration
const redisClient = isRedisEnabled
    ? new ioredis_1.default({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || '',
        connectTimeout: 10000, // 10 seconds
        maxRetriesPerRequest: 3,
        enableOfflineQueue: true,
        retryStrategy: (times) => {
            // Retry connection with exponential backoff (max 10 seconds)
            const delay = Math.min(times * 100, 10000);
            logger_1.logger.info(`Redis reconnecting... attempt ${times}. Next retry in ${delay}ms`);
            return delay;
        },
    })
    : null;
// Event handlers
if (redisClient) {
    redisClient.on('connect', () => {
        logger_1.logger.info('Redis client connected');
    });
    redisClient.on('ready', () => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.info('Redis client ready and accepting commands');
        // Warm the cache once Redis is ready
        try {
            if (process.env.NODE_ENV === 'production' ||
                process.env.ENABLE_CACHE_WARMING === 'true') {
                // Import here to avoid circular dependency issues
                const { cacheWarming } = require('../utils/cacheWarming');
                // Delay cache warming slightly to ensure application is fully initialized
                setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                    yield cacheWarming.warmCache();
                }), 5000); // 5 second delay
            }
        }
        catch (error) {
            logger_1.logger.error(`Error during cache warming: ${error}`);
        }
    }));
    redisClient.on('error', (err) => {
        logger_1.logger.error(`Redis client error: ${err}`);
    });
    redisClient.on('reconnecting', (delay) => {
        logger_1.logger.warn(`Redis client reconnecting in ${delay}ms`);
    });
    redisClient.on('close', () => {
        logger_1.logger.warn('Redis client connection closed');
    });
    redisClient.on('end', () => {
        logger_1.logger.warn('Redis client connection ended');
    });
}
// Cache utility functions
exports.redisCache = {
    /**
     * Get data from cache
     * @param key Cache key
     * @returns Parsed data or null if not found
     */
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!redisClient)
                return null;
            try {
                const startTime = Date.now();
                const data = yield redisClient.get(key);
                const duration = Date.now() - startTime;
                if (data) {
                    logger_1.logger.debug(`Cache HIT (${duration}ms): ${key}`);
                    return JSON.parse(data);
                }
                else {
                    logger_1.logger.debug(`Cache MISS (${duration}ms): ${key}`);
                    return null;
                }
            }
            catch (error) {
                logger_1.logger.error(`Redis get error for key ${key}: ${error}`);
                return null;
            }
        });
    },
    /**
     * Set data in cache with optional expiry
     * @param key Cache key
     * @param data Data to cache (will be JSON stringified)
     * @param expirySeconds Time in seconds until expiry (optional)
     */
    set(key, data, expirySeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!redisClient)
                return;
            try {
                const startTime = Date.now();
                const stringifiedData = JSON.stringify(data);
                if (expirySeconds) {
                    yield redisClient.set(key, stringifiedData, 'EX', expirySeconds);
                    logger_1.logger.debug(`Cache SET with TTL=${expirySeconds}s (${Date.now() - startTime}ms): ${key}`);
                }
                else {
                    yield redisClient.set(key, stringifiedData);
                    logger_1.logger.debug(`Cache SET (${Date.now() - startTime}ms): ${key}`);
                }
            }
            catch (error) {
                logger_1.logger.error(`Redis set error for key ${key}: ${error}`);
            }
        });
    },
    /**
     * Delete a key from cache
     * @param key Cache key to delete
     */
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!redisClient)
                return;
            try {
                const startTime = Date.now();
                const result = yield redisClient.del(key);
                logger_1.logger.debug(`Cache DEL (${Date.now() - startTime}ms): ${key}, Keys removed: ${result}`);
            }
            catch (error) {
                logger_1.logger.error(`Redis delete error for key ${key}: ${error}`);
            }
        });
    },
    /**
     * Delete multiple keys by pattern
     * @param pattern Pattern to match keys (e.g., "users:*")
     */
    delByPattern(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!redisClient)
                return;
            try {
                const startTime = Date.now();
                const keys = yield redisClient.keys(pattern);
                if (keys.length > 0) {
                    const result = yield redisClient.del(...keys);
                    logger_1.logger.debug(`Cache DEL by pattern (${Date.now() - startTime}ms): ${pattern}, Keys matched: ${keys.length}, Keys removed: ${result}`);
                }
                else {
                    logger_1.logger.debug(`Cache DEL by pattern (${Date.now() - startTime}ms): ${pattern}, No keys matched`);
                }
            }
            catch (error) {
                logger_1.logger.error(`Redis delete by pattern error for pattern ${pattern}: ${error}`);
            }
        });
    },
    /**
     * Create a cache key based on route and parameters
     * @param prefix Resource identifier (e.g., "users", "events")
     * @param id Optional resource ID
     * @param params Optional query parameters
     * @returns Formatted cache key
     */
    createKey(prefix, id, params) {
        let key = `${prefix}`;
        if (id) {
            key += `:${id}`;
        }
        if (params && Object.keys(params).length > 0) {
            // Sort params to ensure consistent key generation
            const sortedParams = Object.keys(params)
                .sort()
                .reduce((result, key) => {
                if (params[key] !== undefined && params[key] !== null) {
                    result[key] = params[key];
                }
                return result;
            }, {});
            key += `:${JSON.stringify(sortedParams)}`;
        }
        return key;
    },
};
exports.default = redisClient;
