import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getWithRetry,
  postWithRetry,
  deleteWithRetry,
} from '../../utils/apiRetryUtils';
import { toast } from 'react-toastify';

interface CacheStats {
  server: {
    version: string;
    uptime: number;
    clients: number;
  };
  memory: {
    used: string;
    peak: string;
    fragmentation: number;
  };
  stats: {
    totalKeys: number;
    totalConnections: number;
    totalCommands: number;
    opsPerSecond: number;
    keyspaceHits: number;
    keyspaceMisses: number;
    hitRate: number;
  };
  keysByPrefix: Record<string, number>;
}

const CacheMonitoring: React.FC = () => {
  const [selectedPrefix, setSelectedPrefix] = useState<string>('');

  // Fetch cache stats
  const {
    data: cacheData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ success: boolean; data: CacheStats }>({
    queryKey: ['cache-stats'],
    queryFn: () => getWithRetry('/cache/stats'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: (prefix: string) =>
      deleteWithRetry(`/cache?prefix=${encodeURIComponent(prefix)}`),
    onSuccess: () => {
      toast.success(`Cache cleared for prefix: ${selectedPrefix}`);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to clear cache: ${error.message}`);
    },
  });

  // Warm cache mutation
  const warmCacheMutation = useMutation({
    mutationFn: () => postWithRetry('/cache/warm', {}),
    onSuccess: () => {
      toast.success('Cache warming completed successfully');
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to warm cache: ${error.message}`);
    },
  });

  const handleClearCache = () => {
    if (!selectedPrefix) {
      toast.error('Please select a cache prefix to clear');
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to clear cache for prefix: ${selectedPrefix}?`
      )
    ) {
      clearCacheMutation.mutate(selectedPrefix);
    }
  };

  const handleWarmCache = () => {
    if (
      window.confirm(
        'Are you sure you want to warm the cache? This may take a few moments.'
      )
    ) {
      warmCacheMutation.mutate();
    }
  };

  // Format uptime as days, hours, minutes, seconds
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p>Error loading cache statistics: {(error as Error).message}</p>
      </div>
    );
  }

  const stats = cacheData?.data;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Redis Cache Monitoring
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={() => refetch()}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            disabled={isLoading}
          >
            Refresh
          </button>
          <button
            onClick={handleWarmCache}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
            disabled={warmCacheMutation.isPending}
          >
            {warmCacheMutation.isPending ? 'Warming...' : 'Warm Cache'}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Server Information */}
          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Server Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Redis Version:</span>
                <span className="font-medium">{stats.server.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uptime:</span>
                <span className="font-medium">
                  {formatUptime(stats.server.uptime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Connected Clients:
                </span>
                <span className="font-medium">{stats.server.clients}</span>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Memory Usage</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Used Memory:</span>
                <span className="font-medium">{stats.memory.used}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Peak Memory:</span>
                <span className="font-medium">{stats.memory.peak}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Fragmentation Ratio:
                </span>
                <span className="font-medium">
                  {stats.memory.fragmentation.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Cache Statistics */}
          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Cache Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Keys:</span>
                <span className="font-medium">{stats.stats.totalKeys}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Operations Per Second:
                </span>
                <span className="font-medium">{stats.stats.opsPerSecond}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hit Rate:</span>
                <span className="font-medium">{stats.stats.hitRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cache Hits:</span>
                <span className="font-medium">{stats.stats.keyspaceHits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cache Misses:</span>
                <span className="font-medium">
                  {stats.stats.keyspaceMisses}
                </span>
              </div>
            </div>
          </div>

          {/* Cache Keys by Prefix */}
          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Cache Keys by Prefix</h2>

            <div className="mb-4">
              <div className="flex space-x-4">
                <select
                  value={selectedPrefix}
                  onChange={(e) => setSelectedPrefix(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a prefix</option>
                  {Object.entries(stats.keysByPrefix).map(([prefix, count]) => (
                    <option key={prefix} value={prefix}>
                      {prefix} ({count} keys)
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleClearCache}
                  disabled={!selectedPrefix || clearCacheMutation.isPending}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {clearCacheMutation.isPending ? 'Clearing...' : 'Clear'}
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Prefix</th>
                    <th className="px-4 py-2 text-right">Keys</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.keysByPrefix).map(([prefix, count]) => (
                    <tr key={prefix} className="border-b border-border">
                      <td className="px-4 py-2">{prefix}</td>
                      <td className="px-4 py-2 text-right">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheMonitoring;
