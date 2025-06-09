import React, { useState, useEffect } from 'react';
import {
  Users,
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';
import dashboardService, {
  type DashboardOverviewStats,
  type ActivityItem,
} from '../../services/dashboard.service';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  className = '',
  isLoading = false,
}) => (
  <div
    className={`bg-card rounded-lg shadow-md p-4 sm:p-6 border border-border ${className}`}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
          {title}
        </p>
        {isLoading ? (
          <div className="h-6 sm:h-8 w-16 sm:w-24 bg-muted animate-pulse rounded mt-2"></div>
        ) : (
          <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        )}
        {trend && !isLoading && (
          <p
            className={`text-xs sm:text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            } mt-1`}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}% from last month
          </p>
        )}
      </div>
      <div className="flex-shrink-0 ml-3 p-2 sm:p-3 bg-primary/10 rounded-full">
        {icon}
      </div>
    </div>
  </div>
);

const ActivityCard: React.FC<{ activity: ActivityItem }> = ({ activity }) => {
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex-shrink-0 mt-0.5 sm:mt-1">
        {getStatusIcon(activity.status)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {activity.title}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
          {typeof activity.description === 'object'
            ? JSON.stringify(activity.description)
            : activity.description}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(activity.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardOverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await dashboardService.getOverviewStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExportData = async (
    type: 'overview' | 'users' | 'pharmacies' | 'events'
  ) => {
    try {
      await dashboardService.exportDashboardData(type);
    } catch (err) {
      console.error('Export failed:', err);
      // Could add toast notification here
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-destructive font-medium">
              Error loading dashboard
            </p>
          </div>
          <p className="text-destructive/80 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Dashboard Overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitor your organization's key metrics
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExportData('overview')}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Export Data</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          title="Total Pharmacies"
          value={stats?.totalPharmacies || 0}
          icon={<Building className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
          isLoading={isLoading}
          className="border-l-4 border-blue-500"
        />
        <StatCard
          title="Active Users"
          value={stats?.totalUsers || 0}
          icon={<Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
          isLoading={isLoading}
          className="border-l-4 border-green-500"
        />
        <StatCard
          title="Upcoming Events"
          value={stats?.upcomingEvents || 0}
          icon={<Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
          isLoading={isLoading}
          className="border-l-4 border-purple-500"
        />
        <StatCard
          title="Dues Collected"
          value={`₦${(stats?.totalDuesCollected || 0).toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
          isLoading={isLoading}
          className="border-l-4 border-yellow-500"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <StatCard
          title="Pending Approvals"
          value={stats?.pendingApprovals || 0}
          icon={<Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />}
          isLoading={isLoading}
          className="border-l-4 border-orange-500"
        />
        <StatCard
          title="Active Polls"
          value={stats?.activePolls || 0}
          icon={<FileText className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />}
          isLoading={isLoading}
          className="border-l-4 border-indigo-500"
        />
        <StatCard
          title="Outstanding Dues"
          value={`₦${(stats?.totalDuesOutstanding || 0).toLocaleString()}`}
          icon={<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />}
          isLoading={isLoading}
          className="border-l-4 border-red-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-lg shadow-md border border-border">
        <div className="p-4 sm:p-6 border-b border-border">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            Recent Activity
          </h3>
          <p className="text-muted-foreground text-sm">
            Latest updates across the system
          </p>
        </div>
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-4 w-4 bg-muted animate-pulse rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted animate-pulse rounded mb-1"></div>
                    <div className="h-3 bg-muted animate-pulse rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-2">
              {stats.recentActivity.slice(0, 10).map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Activity className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No recent activity to display</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg shadow-md border border-border p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <button className="flex items-center justify-center space-x-2 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors text-sm">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Manage Users</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-3 sm:p-4 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900 transition-colors text-sm">
            <Building className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Review Pharmacies</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-3 sm:p-4 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors text-sm sm:col-span-2 lg:col-span-1">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Create Event</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
