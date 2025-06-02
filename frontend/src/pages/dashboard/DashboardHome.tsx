import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import MemberEventWidget from '../../components/member/MemberEventWidget';
import AdminEventWidget from '../../components/admin/AdminEventWidget';
import dashboardService, {
  type ActivityItem,
} from '../../services/dashboard.service';

interface DashboardStats {
  totalPharmacies: number;
  totalMembers: number;
  upcomingEvents: number;
  activeElections: number;
  totalDuesPaid: number;
}

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPharmacies: 0,
    totalMembers: 0,
    upcomingEvents: 0,
    activeElections: 0,
    totalDuesPaid: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch dashboard overview stats
        const overviewStats = await dashboardService.getOverviewStats();

        // Map overview stats to dashboard stats
        setStats({
          totalPharmacies: overviewStats.totalPharmacies,
          totalMembers: overviewStats.totalUsers,
          upcomingEvents: overviewStats.upcomingEvents,
          activeElections: overviewStats.activePolls,
          totalDuesPaid: overviewStats.totalDuesCollected,
        });

        // Set recent activity
        setRecentActivity(overviewStats.recentActivity);

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError('Failed to load dashboard data');
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to format activity timestamps
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Helper function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'warning':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/15 border border-destructive/20 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-destructive"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-destructive">Error</h3>
            <div className="mt-2 text-sm text-destructive">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {user?.firstName}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Pharmacies Card */}
        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary rounded-md p-3">
                <svg
                  className="h-6 w-6 text-primary-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Total Pharmacies
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-foreground">
                      {stats.totalPharmacies}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-accent px-5 py-3">
            <div className="text-sm">
              <a
                href="/pharmacies"
                className="font-medium text-primary hover:text-primary/80"
              >
                View all
              </a>
            </div>
          </div>
        </div>

        {/* Total Members Card */}
        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 dark:bg-green-600 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Total Members
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-foreground">
                      {stats.totalMembers}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-accent px-5 py-3">
            <div className="text-sm">
              <a
                href="/users"
                className="font-medium text-primary hover:text-primary/80"
              >
                View all
              </a>
            </div>
          </div>
        </div>

        {/* Upcoming Events Card */}
        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 dark:bg-yellow-600 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Upcoming Events
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-foreground">
                      {stats.upcomingEvents}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-accent px-5 py-3">
            <div className="text-sm">
              <a
                href="/events"
                className="font-medium text-primary hover:text-primary/80"
              >
                View all
              </a>
            </div>
          </div>
        </div>

        {/* Active Elections Card */}
        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 dark:bg-purple-600 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Active Elections
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-foreground">
                      {stats.activeElections}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-accent px-5 py-3">
            <div className="text-sm">
              <a
                href="/elections"
                className="font-medium text-primary hover:text-primary/80"
              >
                View all
              </a>
            </div>
          </div>
        </div>

        {/* Total Dues Paid Card */}
        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 dark:bg-red-600 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Total Dues Paid
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-foreground">
                      ₦{stats.totalDuesPaid.toLocaleString()}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-accent px-5 py-3">
            <div className="text-sm">
              <a
                href="/finances"
                className="font-medium text-primary hover:text-primary/80"
              >
                View details
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Event Management Widget */}
      <div className="mb-6">
        {user?.role &&
        ['admin', 'superadmin', 'secretary'].includes(user.role) ? (
          <AdminEventWidget />
        ) : (
          <MemberEventWidget />
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-card shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-foreground">
            Recent Activity
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Latest updates and activities.
          </p>
        </div>
        <ul className="divide-y divide-border">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <li key={activity.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-primary truncate">
                      {activity.title}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                          activity.status || 'default'
                        )}`}
                      >
                        {activity.status || 'Activity'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-muted-foreground">
                        {(() => {
                          try {
                            if (
                              typeof activity.description === 'object' &&
                              activity.description !== null
                            ) {
                              return JSON.stringify(activity.description);
                            }
                            return (
                              activity.description?.toString() ||
                              'No description'
                            );
                          } catch (error) {
                            console.error(
                              'Error rendering activity description:',
                              error
                            );
                            return 'Activity description unavailable';
                          }
                        })()}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-muted-foreground sm:mt-0">
                      <svg
                        className="flex-shrink-0 mr-1.5 h-5 w-5 text-muted-foreground"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p>{formatTimestamp(activity.timestamp)}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li>
              <div className="px-4 py-4 sm:px-6">
                <p className="text-sm text-muted-foreground text-center">
                  No recent activity to display.
                </p>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default DashboardHome;
