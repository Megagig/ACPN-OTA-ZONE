import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { EventService } from '../../services/event.service';
import documentService from '../../services/document.service';
import pharmacyService from '../../services/pharmacy.service';
import memberDashboardService from '../../services/memberDashboard.service';
import NotificationWidget from '../../components/notifications/NotificationWidget';
import LoginNotificationModal from '../../components/notifications/LoginNotificationModal';

// Types
import type { Event } from '../../types/event.types';
import type { Payment } from '../../types/financial.types';
import type { Pharmacy } from '../../types/pharmacy.types';

interface MemberDashboardStats {
  totalDue: number;
  totalPaid: number;
  remainingBalance: number;
  upcomingEvents: number;
  attendedEvents: number;
  missedEvents: number;
  documentsCount: number;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    status?: string;
  }>;
}

const MemberDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [stats, setStats] = useState<MemberDashboardStats>({
    totalDue: 0,
    totalPaid: 0,
    remainingBalance: 0,
    upcomingEvents: 0,
    attendedEvents: 0,
    missedEvents: 0,
    documentsCount: 0,
    recentActivity: [],
  });

  // Detailed data states
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);

  // Check for login notifications
  useEffect(() => {
    const checkLoginNotifications = async () => {
      if (user && unreadCount > 0) {
        // Check if this is a recent login (within last 5 minutes)
        const loginTime = sessionStorage.getItem('loginTime');
        const now = new Date().getTime();

        if (loginTime && now - parseInt(loginTime) < 5 * 60 * 1000) {
          // Show modal for recent logins with unread notifications
          setShowLoginModal(true);
          // Clear the login time so modal doesn't show again
          sessionStorage.removeItem('loginTime');
        }
      }
    };

    checkLoginNotifications();
  }, [user, unreadCount]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        setError(null);

        // Create a safe version of Promise.all that doesn't fail if one promise fails
        const safePromiseAll = async (promises: Promise<any>[]) => {
          return Promise.all(
            promises.map((promise: Promise<any>) =>
              promise.catch((error: any) => {
                console.warn(
                  'Error in one of the dashboard data requests:',
                  error
                );
                return null; // Return null instead of rejecting
              })
            )
          );
        };

        // Fetch multiple data sources in parallel with error handling for each
        const [
          memberDashboardStats,
          eventsData,
          memberPaymentsData,
          documentsData,
          pharmacyData,
        ] = await safePromiseAll([
          memberDashboardService.getMemberDashboardStats().catch(() => ({
            userFinancialSummary: {
              totalDue: 0,
              totalPaid: 0,
              remainingBalance: 0,
            },
            userAttendanceSummary: { attended: 0, missed: 0 },
            upcomingEvents: 0,
            recentActivity: [],
          })),
          EventService.getAllEvents({ status: 'published' }, 1, 5).catch(
            () => ({ data: [] })
          ),
          memberDashboardService
            .getMemberPayments(1, 5)
            .catch(() => ({ payments: [] })),
          documentService
            .getDocuments({ accessLevel: 'members' })
            .catch(() => []),
          pharmacyService.getPharmacyByUser().catch(() => null),
        ]);

        // Process upcoming events
        const upcoming = (eventsData?.data || [])
          .filter((event: Event) => {
            try {
              return event?.startDate && new Date(event.startDate) > new Date();
            } catch {
              return false;
            }
          })
          .slice(0, 3);

        setUpcomingEvents(upcoming);

        // Set payments and pharmacy data
        setRecentPayments(memberPaymentsData.payments || []);
        setPharmacy(pharmacyData || null);

        // Calculate aggregated stats from member dashboard data
        const { userFinancialSummary, userAttendanceSummary, recentActivity } =
          memberDashboardStats;

        setStats({
          totalDue: userFinancialSummary?.totalDue || 0,
          totalPaid: userFinancialSummary?.totalPaid || 0,
          remainingBalance: userFinancialSummary?.remainingBalance || 0,
          upcomingEvents: upcoming.length,
          attendedEvents: userAttendanceSummary?.attended || 0,
          missedEvents: userAttendanceSummary?.missed || 0,
          documentsCount: documentsData?.length || 0,
          recentActivity: recentActivity || [],
        });

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?._id]);

  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date function
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Get status badge color function
  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'approved':
      case 'completed':
      case 'attended':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'pending':
      case 'in progress':
      case 'awaiting':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'warning':
      case 'late':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      case 'error':
      case 'rejected':
      case 'denied':
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    }
  };

  if (loading) {
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
      {showLoginModal && <LoginNotificationModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Welcome back, {user?.firstName || 'Member'}!
            </h1>
            <p className="text-primary-foreground/90">
              Here's an overview of your account and recent activities
            </p>
          </div>

          {pharmacy && (
            <div className="mt-4 md:mt-0 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <p className="text-sm text-primary-foreground/80">
                Registered pharmacy
              </p>
              <p className="font-medium">{pharmacy.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Financial Summary */}
        <div className="bg-card rounded-lg shadow p-5 border border-border hover:border-primary/40 transition-colors">
          <div className="flex items-center mb-1">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full mr-3">
              <svg
                className="h-5 w-5 text-blue-600 dark:text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">Financial Status</h3>
          </div>

          <div className="mt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Total Due</span>
              <span className="font-medium">
                {formatCurrency(stats.totalDue)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Amount Paid</span>
              <span className="font-medium">
                {formatCurrency(stats.totalPaid)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm font-medium">Balance</span>
              <span
                className={`font-bold ${
                  stats.remainingBalance > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}
              >
                {formatCurrency(stats.remainingBalance)}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => navigate('/payments')}
              className="w-full text-sm px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              View Payment History
            </button>
          </div>
        </div>

        {/* Event Attendance */}
        <div className="bg-card rounded-lg shadow p-5 border border-border hover:border-primary/40 transition-colors">
          <div className="flex items-center mb-1">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-full mr-3">
              <svg
                className="h-5 w-5 text-green-600 dark:text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">Event Attendance</h3>
          </div>

          <div className="mt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Attended</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {stats.attendedEvents}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Missed</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {stats.missedEvents}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm font-medium">Upcoming</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {stats.upcomingEvents}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => navigate('/dashboard/attendance-status')}
              className="w-full text-sm px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              View Attendance Record
            </button>
          </div>
        </div>

        {/* Notifications Widget */}
        <NotificationWidget />

        {/* Quick Access */}
        <div className="bg-card rounded-lg shadow p-5 border border-border hover:border-primary/40 transition-colors">
          <div className="flex items-center mb-1">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-full mr-3">
              <svg
                className="h-5 w-5 text-purple-600 dark:text-purple-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">Quick Access</h3>
          </div>

          <div className="mt-3 space-y-2">
            <button
              onClick={() => navigate('/my-pharmacy')}
              className="w-full text-left text-sm px-3 py-2 bg-card hover:bg-accent rounded-md flex items-center"
            >
              <svg
                className="h-4 w-4 mr-2 text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              My Pharmacy
            </button>
            <button
              onClick={() => navigate('/member/events')}
              className="w-full text-left text-sm px-3 py-2 bg-card hover:bg-accent rounded-md flex items-center"
            >
              <svg
                className="h-4 w-4 mr-2 text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Event Registration
            </button>
            <button
              onClick={() => navigate('/my-documents')}
              className="w-full text-left text-sm px-3 py-2 bg-card hover:bg-accent rounded-md flex items-center"
            >
              <svg
                className="h-4 w-4 mr-2 text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              My Documents
            </button>
          </div>
        </div>

        {/* Profile Completion */}
        <div className="bg-card rounded-lg shadow p-5 border border-border hover:border-primary/40 transition-colors">
          <div className="flex items-center mb-1">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-full mr-3">
              <svg
                className="h-5 w-5 text-amber-600 dark:text-amber-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">My Profile</h3>
          </div>

          <div className="mt-3 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-800 text-xl font-bold mb-3">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <h4 className="font-medium">
              {user?.firstName} {user?.lastName}
            </h4>
            <p className="text-sm text-muted-foreground capitalize">
              {user?.role || 'Member'}
            </p>
          </div>

          <div className="mt-4">
            <button
              onClick={() => navigate('/profile')}
              className="w-full text-sm px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              Edit My Profile
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Events and Recent Payments Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
          <div className="px-6 py-4 bg-accent border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-medium">Upcoming Events</h3>
            <button
              onClick={() => navigate('/member/events')}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              View All
            </button>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="divide-y divide-border">
              {upcomingEvents.map((event) => (
                <div
                  key={event._id}
                  className="p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-800/20 text-blue-800 dark:text-blue-300 rounded-lg p-3 mr-4">
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <div className="mt-1 space-y-1 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <svg
                            className="h-4 w-4 mr-1"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center text-muted-foreground">
                            <svg
                              className="h-4 w-4 mr-1"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span>
                              {event.location.name ||
                                event.location.address ||
                                'Virtual'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <button
                          onClick={() =>
                            navigate(`/member/events/${event._id}`)
                          }
                          className="text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <p>No upcoming events scheduled.</p>
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
          <div className="px-6 py-4 bg-accent border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-medium">Recent Payments</h3>
            <button
              onClick={() => navigate('/payments')}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              View All
            </button>
          </div>

          {recentPayments.length > 0 ? (
            <div className="divide-y divide-border">
              {recentPayments.map((payment) => (
                <div
                  key={payment._id}
                  className="p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-green-100 dark:bg-green-800/20 text-green-800 dark:text-green-300 rounded-lg p-3 mr-4">
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium">
                          {payment.paymentMethod || 'Payment'}
                        </h4>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                            payment.status || payment.approvalStatus || ''
                          )}`}
                        >
                          {payment.status ||
                            payment.approvalStatus ||
                            'Pending'}
                        </span>
                      </div>
                      <div className="mt-1 space-y-1 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <svg
                            className="h-4 w-4 mr-1"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>
                            {payment.paymentDate
                              ? formatDate(payment.paymentDate)
                              : formatDate(payment.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center text-foreground font-medium">
                          <span>Amount: </span>
                          <span className="ml-1">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <p>No recent payment records.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-card shadow overflow-hidden sm:rounded-md border border-border">
        <div className="px-4 py-5 sm:px-6 border-b border-border">
          <h3 className="text-lg leading-6 font-medium text-foreground">
            Recent Activity
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Latest updates and system activities.
          </p>
        </div>

        <ul className="divide-y divide-border">
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity) => (
              <li
                key={activity.id}
                className="hover:bg-accent/50 transition-colors"
              >
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
                      <p>{formatDate(activity.timestamp)}</p>
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

      {/* Login Notification Modal */}
      <LoginNotificationModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
};

export default MemberDashboard;
