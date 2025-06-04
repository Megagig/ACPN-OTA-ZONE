import axios from 'axios';
import { redisCache } from '../config/redis';
import { logger } from './logger';

/**
 * Cache warming service to pre-populate Redis cache with frequently accessed data
 */
export class CacheWarmingService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    // Use localhost for cache warming since we're making internal requests
    this.baseUrl = process.env.BACKEND_URL || 'http://localhost:4000/api';
  }

  /**
   * Initialize auth token for authenticated requests
   */
  private async authenticate(): Promise<void> {
    try {
      // Use a service account or admin account for cache warming
      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        email: process.env.CACHE_WARMING_EMAIL || process.env.ADMIN_EMAIL,
        password:
          process.env.CACHE_WARMING_PASSWORD || process.env.ADMIN_PASSWORD,
      });

      if (response.data && response.data.token) {
        this.authToken = response.data.token;
        logger.info('Cache warming service authenticated successfully');
      } else {
        logger.error('Cache warming authentication failed: No token received');
      }
    } catch (error) {
      logger.error(`Cache warming authentication error: ${error}`);
    }
  }

  /**
   * Make an authenticated API request
   * @param endpoint API endpoint to request
   * @param method HTTP method
   * @param params Optional query parameters
   * @returns API response data
   */
  private async makeRequest(
    endpoint: string,
    method = 'GET',
    params: Record<string, any> = {}
  ): Promise<any> {
    try {
      if (!this.authToken) {
        await this.authenticate();
      }

      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        params,
      });

      return response.data;
    } catch (error) {
      logger.error(`Cache warming request error (${endpoint}): ${error}`);
      return null;
    }
  }

  /**
   * Warm up the cache for frequently accessed endpoints
   */
  public async warmCache(): Promise<void> {
    logger.info('Starting cache warming process...');

    try {
      // Track start time to measure performance
      const startTime = Date.now();

      // Parallel cache warming for multiple endpoints
      await Promise.all([
        this.warmDueTypes(),
        this.warmPharmacies(),
        this.warmFinancialData(),
      ]);

      const duration = Date.now() - startTime;
      logger.info(`Cache warming completed in ${duration}ms`);
    } catch (error) {
      logger.error(`Cache warming process error: ${error}`);
    }
  }

  /**
   * Warm due types cache
   */
  private async warmDueTypes(): Promise<void> {
    try {
      // Get all due types
      const dueTypesData = await this.makeRequest('/due-types');

      if (dueTypesData && dueTypesData.success) {
        // Cache the full list
        await redisCache.set('due-types-all', dueTypesData, 1800);

        // Cache individual due types
        const dueTypes = dueTypesData.data || [];
        for (const dueType of dueTypes) {
          const key = redisCache.createKey('due-types', dueType._id);
          await redisCache.set(key, { success: true, data: dueType }, 3600);
        }

        logger.info(`Warmed cache for ${dueTypes.length} due types`);
      }
    } catch (error) {
      logger.error(`Due types cache warming error: ${error}`);
    }
  }

  /**
   * Warm pharmacies cache
   */
  private async warmPharmacies(): Promise<void> {
    try {
      // Get summary of all pharmacies (first page)
      const pharmaciesData = await this.makeRequest('/pharmacies', 'GET', {
        limit: 20, // Cache just the first page
        page: 1,
      });

      if (pharmaciesData && pharmaciesData.success) {
        // Cache the pharmacies list
        await redisCache.set('pharmacies', pharmaciesData, 600);

        // Get and cache pharmacy stats
        const statsData = await this.makeRequest('/pharmacies/stats');
        if (statsData && statsData.success) {
          await redisCache.set('pharmacy-stats', statsData, 3600);
        }

        // Get and cache dues status
        const duesStatusData = await this.makeRequest(
          '/pharmacies/dues-status'
        );
        if (duesStatusData && duesStatusData.success) {
          await redisCache.set('pharmacy-dues-status', duesStatusData, 1800);
        }

        logger.info('Warmed cache for pharmacies, stats and dues status');
      }
    } catch (error) {
      logger.error(`Pharmacies cache warming error: ${error}`);
    }
  }

  /**
   * Warm financial data cache
   */
  private async warmFinancialData(): Promise<void> {
    try {
      // Get pending payments (high priority for financial admins)
      const pendingPaymentsData = await this.makeRequest(
        '/payments/admin/pending'
      );
      if (pendingPaymentsData && pendingPaymentsData.success) {
        await redisCache.set('payments-pending', pendingPaymentsData, 60);
      }

      // Get dues analytics
      const currentYear = new Date().getFullYear();
      const duesAnalyticsData = await this.makeRequest(
        '/dues/analytics/all',
        'GET',
        {
          year: currentYear,
        }
      );

      if (duesAnalyticsData && duesAnalyticsData.success) {
        await redisCache.set('dues-analytics', duesAnalyticsData, 600);
      }

      logger.info('Warmed cache for financial data');
    } catch (error) {
      logger.error(`Financial data cache warming error: ${error}`);
    }
  }
}

// Export singleton instance
export const cacheWarming = new CacheWarmingService();
