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
exports.cacheWarming = exports.CacheWarmingService = void 0;
const axios_1 = __importDefault(require("axios"));
const redis_1 = require("../config/redis");
const logger_1 = require("./logger");
/**
 * Cache warming service to pre-populate Redis cache with frequently accessed data
 */
class CacheWarmingService {
    constructor() {
        this.authToken = null;
        // Use localhost for cache warming since we're making internal requests
        this.baseUrl = process.env.BACKEND_URL || 'http://localhost:4000/api';
    }
    /**
     * Initialize auth token for authenticated requests
     */
    authenticate() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Use a service account or admin account for cache warming
                const response = yield axios_1.default.post(`${this.baseUrl}/auth/login`, {
                    email: process.env.CACHE_WARMING_EMAIL || process.env.ADMIN_EMAIL,
                    password: process.env.CACHE_WARMING_PASSWORD || process.env.ADMIN_PASSWORD,
                });
                if (response.data && response.data.token) {
                    this.authToken = response.data.token;
                    logger_1.logger.info('Cache warming service authenticated successfully');
                }
                else {
                    logger_1.logger.error('Cache warming authentication failed: No token received');
                }
            }
            catch (error) {
                logger_1.logger.error(`Cache warming authentication error: ${error}`);
            }
        });
    }
    /**
     * Make an authenticated API request
     * @param endpoint API endpoint to request
     * @param method HTTP method
     * @param params Optional query parameters
     * @returns API response data
     */
    makeRequest(endpoint_1) {
        return __awaiter(this, arguments, void 0, function* (endpoint, method = 'GET', params = {}) {
            try {
                if (!this.authToken) {
                    yield this.authenticate();
                }
                const response = yield (0, axios_1.default)({
                    method,
                    url: `${this.baseUrl}${endpoint}`,
                    headers: {
                        Authorization: `Bearer ${this.authToken}`,
                    },
                    params,
                });
                return response.data;
            }
            catch (error) {
                logger_1.logger.error(`Cache warming request error (${endpoint}): ${error}`);
                return null;
            }
        });
    }
    /**
     * Warm up the cache for frequently accessed endpoints
     */
    warmCache() {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info('Starting cache warming process...');
            try {
                // Track start time to measure performance
                const startTime = Date.now();
                // Parallel cache warming for multiple endpoints
                yield Promise.all([
                    this.warmDueTypes(),
                    this.warmPharmacies(),
                    this.warmFinancialData(),
                ]);
                const duration = Date.now() - startTime;
                logger_1.logger.info(`Cache warming completed in ${duration}ms`);
            }
            catch (error) {
                logger_1.logger.error(`Cache warming process error: ${error}`);
            }
        });
    }
    /**
     * Warm due types cache
     */
    warmDueTypes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get all due types
                const dueTypesData = yield this.makeRequest('/due-types');
                if (dueTypesData && dueTypesData.success) {
                    // Cache the full list
                    yield redis_1.redisCache.set('due-types-all', dueTypesData, 1800);
                    // Cache individual due types
                    const dueTypes = dueTypesData.data || [];
                    for (const dueType of dueTypes) {
                        const key = redis_1.redisCache.createKey('due-types', dueType._id);
                        yield redis_1.redisCache.set(key, { success: true, data: dueType }, 3600);
                    }
                    logger_1.logger.info(`Warmed cache for ${dueTypes.length} due types`);
                }
            }
            catch (error) {
                logger_1.logger.error(`Due types cache warming error: ${error}`);
            }
        });
    }
    /**
     * Warm pharmacies cache
     */
    warmPharmacies() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get summary of all pharmacies (first page)
                const pharmaciesData = yield this.makeRequest('/pharmacies', 'GET', {
                    limit: 20, // Cache just the first page
                    page: 1,
                });
                if (pharmaciesData && pharmaciesData.success) {
                    // Cache the pharmacies list
                    yield redis_1.redisCache.set('pharmacies', pharmaciesData, 600);
                    // Get and cache pharmacy stats
                    const statsData = yield this.makeRequest('/pharmacies/stats');
                    if (statsData && statsData.success) {
                        yield redis_1.redisCache.set('pharmacy-stats', statsData, 3600);
                    }
                    // Get and cache dues status
                    const duesStatusData = yield this.makeRequest('/pharmacies/dues-status');
                    if (duesStatusData && duesStatusData.success) {
                        yield redis_1.redisCache.set('pharmacy-dues-status', duesStatusData, 1800);
                    }
                    logger_1.logger.info('Warmed cache for pharmacies, stats and dues status');
                }
            }
            catch (error) {
                logger_1.logger.error(`Pharmacies cache warming error: ${error}`);
            }
        });
    }
    /**
     * Warm financial data cache
     */
    warmFinancialData() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get pending payments (high priority for financial admins)
                const pendingPaymentsData = yield this.makeRequest('/payments/admin/pending');
                if (pendingPaymentsData && pendingPaymentsData.success) {
                    yield redis_1.redisCache.set('payments-pending', pendingPaymentsData, 60);
                }
                // Get dues analytics
                const currentYear = new Date().getFullYear();
                const duesAnalyticsData = yield this.makeRequest('/dues/analytics/all', 'GET', {
                    year: currentYear,
                });
                if (duesAnalyticsData && duesAnalyticsData.success) {
                    yield redis_1.redisCache.set('dues-analytics', duesAnalyticsData, 600);
                }
                logger_1.logger.info('Warmed cache for financial data');
            }
            catch (error) {
                logger_1.logger.error(`Financial data cache warming error: ${error}`);
            }
        });
    }
}
exports.CacheWarmingService = CacheWarmingService;
// Export singleton instance
exports.cacheWarming = new CacheWarmingService();
