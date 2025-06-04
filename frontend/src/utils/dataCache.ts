// Simple cache implementation for pharmacy data
import type { Pharmacy } from '../types/pharmacy.types';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

class DataCache {
  // Use unknown instead of any for better type safety
  private cache: Map<string, CacheItem<unknown>> = new Map();

  // Store data in cache with expiration
  set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  // Get data from cache if not expired
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  // Remove data from cache
  remove(key: string): void {
    this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// Export a singleton instance
export const dataCache = new DataCache();

// Pharmacy specific cache helpers
export const PHARMACY_CACHE_KEY = 'all-pharmacies';

export const getPharmaciesFromCache = (): Pharmacy[] | null => {
  return dataCache.get<Pharmacy[]>(PHARMACY_CACHE_KEY);
};

export const cachePharmacies = (pharmacies: Pharmacy[]): void => {
  dataCache.set(PHARMACY_CACHE_KEY, pharmacies, 10 * 60 * 1000); // Cache for 10 minutes
};
