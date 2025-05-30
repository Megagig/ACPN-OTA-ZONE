import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import eventService from '../../services/event.service';
import ChartComponent from '../../components/common/ChartComponent';
import type { Event, EventAttendee } from '../../types/event.types';

const EventReports: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportType, setReportType] = useState<
    'overview' | 'attendance' | 'financial'
  >('overview');
  const [dateRange, setDateRange] = useState<
    'all' | 'year' | 'quarter' | 'month'
  >('all');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all events
        const eventsData = await eventService.getEvents();
        setEvents(eventsData);

        // Fetch attendees for all events
        const allAttendees: EventAttendee[] = [];

        // For performance in a real app, you might want to implement a separate API endpoint
        // that returns all attendees or attendee statistics in a single call
        for (const event of eventsData) {
          const eventAttendees = await eventService.getEventAttendees(
            event._id
          );
          allAttendees.push(...eventAttendees);
        }

        setAttendees(allAttendees);
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data based on date range
  const getFilteredEvents = () => {
    const now = new Date();

    switch (dateRange) {
      case 'month':
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return events.filter(
          (event) => new Date(event.startDate) >= oneMonthAgo
        );

      case 'quarter':
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return events.filter(
          (event) => new Date(event.startDate) >= threeMonthsAgo
        );

      case 'year':
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        return events.filter(
          (event) => new Date(event.startDate) >= oneYearAgo
        );

      case 'all':
      default:
        return events;
    }
  };

  // Get filtered attendees based on filtered events
  const getFilteredAttendees = () => {
    const filteredEvents = getFilteredEvents();
    const eventIds = filteredEvents.map((event) => event._id);

    return attendees.filter((attendee) =>
      typeof attendee.event === 'string'
        ? eventIds.includes(attendee.event)
        : eventIds.includes((attendee.event as Event)._id)
    );
  };

  // Calculate event type distribution data
  const getEventTypeData = () => {
    const filteredEvents = getFilteredEvents();

    // Count events by type
    const typeCount: Record<string, number> = {};

    filteredEvents.forEach((event) => {
      if (typeCount[event.type]) {
        typeCount[event.type]++;
      } else {
        typeCount[event.type] = 1;
      }
    });

    // Format for Chart.js
    return {
      labels: Object.keys(typeCount).map(
        (type) => type.charAt(0).toUpperCase() + type.slice(1)
      ),
      datasets: [
        {
          data: Object.values(typeCount),
          backgroundColor: [
            '#4BC0C0',
            '#36A2EB',
            '#FFCE56',
            '#FF6384',
            '#9966FF',
            '#FF9F40',
            '#C9CBCF',
          ],
          hoverBackgroundColor: [
            '#4BC0C0',
            '#36A2EB',
            '#FFCE56',
            '#FF6384',
            '#9966FF',
            '#FF9F40',
            '#C9CBCF',
          ],
        },
      ],
    };
  };

  // Calculate attendance status distribution data
  const getAttendanceStatusData = () => {
    const filteredAttendees = getFilteredAttendees();

    // Count attendees by status
    const statusCount: Record<string, number> = {};

    filteredAttendees.forEach((attendee) => {
      if (statusCount[attendee.status]) {
        statusCount[attendee.status]++;
      } else {
        statusCount[attendee.status] = 1;
      }
    });

    // Format for Chart.js
    return {
      labels: Object.keys(statusCount).map(
        (status) => status.charAt(0).toUpperCase() + status.slice(1)
      ),
      datasets: [
        {
          data: Object.values(statusCount),
          backgroundColor: [
            '#4BC0C0',
            '#36A2EB',
            '#FFCE56',
            '#FF6384',
            '#9966FF',
            '#FF9F40',
          ],
          hoverBackgroundColor: [
            '#4BC0C0',
            '#36A2EB',
            '#FFCE56',
            '#FF6384',
            '#9966FF',
            '#FF9F40',
          ],
        },
      ],
    };
  };

  // Calculate payment status distribution data
  const getPaymentStatusData = () => {
    const filteredAttendees = getFilteredAttendees();

    // Count paid vs unpaid
    const paidCount = filteredAttendees.filter(
      (attendee) => attendee.paid
    ).length;
    const unpaidCount = filteredAttendees.filter(
      (attendee) => !attendee.paid
    ).length;

    // Format for Chart.js
    return {
      labels: ['Paid', 'Unpaid'],
      datasets: [
        {
          data: [paidCount, unpaidCount],
          backgroundColor: ['#4BC0C0', '#FF6384'],
          hoverBackgroundColor: ['#4BC0C0', '#FF6384'],
        },
      ],
    };
  };

  // Calculate event attendance data
  const getEventAttendanceData = () => {
    const filteredEvents = getFilteredEvents();

    // Top 5 events by attendance
    const eventAttendanceCounts = filteredEvents.map((event) => {
      const eventAttendees = attendees.filter((attendee) =>
        typeof attendee.event === 'string'
          ? attendee.event === event._id
          : (attendee.event as Event)._id === event._id
      );

      return {
        event,
        count: eventAttendees.length,
      };
    });

    // Sort by attendance count (descending)
    eventAttendanceCounts.sort((a, b) => b.count - a.count);

    // Take top 5
    const top5 = eventAttendanceCounts.slice(0, 5);

    // Format for Chart.js
    return {
      labels: top5.map((item) => item.event.title),
      datasets: [
        {
          label: 'Attendees',
          data: top5.map((item) => item.count),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Calculate event revenue data
  const getEventRevenueData = () => {
    const filteredEvents = getFilteredEvents();

    // Calculate revenue for each event
    const eventRevenue = filteredEvents.map((event) => {
      const eventAttendees = attendees.filter((attendee) =>
        typeof attendee.event === 'string'
          ? attendee.event === event._id
          : (attendee.event as Event)._id === event._id
      );

      // Only count paid attendees
      const paidAttendees = eventAttendees.filter((attendee) => attendee.paid);

      // Calculate total revenue (registration fee × number of paid attendees)
      const revenue = (event.registrationFee || 0) * paidAttendees.length;

      return {
        event,
        revenue,
      };
    });

    // Sort by revenue (descending)
    eventRevenue.sort((a, b) => b.revenue - a.revenue);

    // Take top 5
    const top5 = eventRevenue.slice(0, 5);

    // Format for Chart.js
    return {
      labels: top5.map((item) => item.event.title),
      datasets: [
        {
          label: 'Revenue (₦)',
          data: top5.map((item) => item.revenue),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Format date range for display
  const getDateRangeDisplay = () => {
    const now = new Date();

    switch (dateRange) {
      case 'month':
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return `${oneMonthAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`;

      case 'quarter':
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return `${threeMonthsAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`;

      case 'year':
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        return `${oneYearAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`;

      case 'all':
      default:
        return 'All Time';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Event Reports</h1>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm shadow"
            onClick={() => window.print()}
          >
            <i className="fas fa-print mr-2"></i>
            Print Report
          </button>
          <button
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-2 rounded-md text-sm shadow"
            onClick={() => navigate('/events')}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Events
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-card rounded-lg shadow-md p-4 mb-6 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="report-type"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Report Type
            </label>
            <select
              id="report-type"
              className="block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background text-foreground sm:text-sm"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
            >
              <option value="overview">Overview</option>
              <option value="attendance">Attendance Analysis</option>
              <option value="financial">Financial Analysis</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="date-range"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Date Range
            </label>
            <select
              id="date-range"
              className="block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background text-foreground sm:text-sm"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
            >
              <option value="all">All Time</option>
              <option value="year">Last 12 Months</option>
              <option value="quarter">Last 3 Months</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card rounded-lg shadow-md p-6 border border-border">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted w-1/4 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Report Header */}
          <div className="bg-card rounded-lg shadow-md p-6 mb-6 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              {reportType === 'overview' && 'Events Overview'}
              {reportType === 'attendance' && 'Attendance Analysis'}
              {reportType === 'financial' && 'Financial Analysis'}
            </h2>
            <div className="flex flex-wrap items-center text-sm text-muted-foreground mb-4">
              <div className="mr-6 mb-2">
                <span className="font-medium">Date Range:</span>{' '}
                {getDateRangeDisplay()}
              </div>
              <div className="mr-6 mb-2">
                <span className="font-medium">Total Events:</span>{' '}
                {getFilteredEvents().length}
              </div>
              <div className="mr-6 mb-2">
                <span className="font-medium">Total Registrations:</span>{' '}
                {getFilteredAttendees().length}
              </div>
              <div className="mb-2">
                <span className="font-medium">Generated:</span>{' '}
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>

          {/* Report Content based on selected report type */}
          {reportType === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Event Types Distribution */}
              <div className="bg-card rounded-lg shadow-md p-4 border border-border">
                <h3 className="text-lg font-semibold mb-4">
                  Event Types Distribution
                </h3>
                {getFilteredEvents().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No events data available for the selected period
                  </div>
                ) : (
                  <ChartComponent
                    type="doughnut"
                    data={getEventTypeData()}
                    height={300}
                  />
                )}
              </div>

              {/* Top Events by Attendance */}
              <div className="bg-card rounded-lg shadow-md p-4 border border-border">
                <h3 className="text-lg font-semibold mb-4">
                  Top Events by Attendance
                </h3>
                {getFilteredEvents().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No events data available for the selected period
                  </div>
                ) : (
                  <ChartComponent
                    type="bar"
                    data={getEventAttendanceData()}
                    height={300}
                    options={{
                      indexAxis: 'y',
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                    }}
                  />
                )}
              </div>

              {/* Payment Status */}
              <div className="bg-card rounded-lg shadow-md p-4 border border-border">
                <h3 className="text-lg font-semibold mb-4">Payment Status</h3>
                {getFilteredAttendees().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No attendance data available for the selected period
                  </div>
                ) : (
                  <ChartComponent
                    type="pie"
                    data={getPaymentStatusData()}
                    height={300}
                  />
                )}
              </div>

              {/* Registration Status */}
              <div className="bg-card rounded-lg shadow-md p-4 border border-border">
                <h3 className="text-lg font-semibold mb-4">
                  Registration Status
                </h3>
                {getFilteredAttendees().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No attendance data available for the selected period
                  </div>
                ) : (
                  <ChartComponent
                    type="doughnut"
                    data={getAttendanceStatusData()}
                    height={300}
                  />
                )}
              </div>
            </div>
          )}

          {reportType === 'attendance' && (
            <div className="space-y-6">
              {/* Attendance Overview */}
              <div className="bg-card rounded-lg shadow-md p-4 border border-border">
                <h3 className="text-lg font-semibold mb-4">
                  Attendance Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-center border border-border">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {getFilteredAttendees().length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Registrations
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 text-center border border-border">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {getFilteredAttendees().filter((a) => a.checkedIn).length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Checked In
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 text-center border border-border">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {
                        getFilteredAttendees().filter((a) => !a.checkedIn)
                          .length
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      No-Shows
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Events by Attendance */}
              <div className="bg-card rounded-lg shadow-md p-4 border border-border">
                <h3 className="text-lg font-semibold mb-4">
                  Top Events by Attendance
                </h3>
                {getFilteredEvents().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No events data available for the selected period
                  </div>
                ) : (
                  <ChartComponent
                    type="bar"
                    data={getEventAttendanceData()}
                    height={300}
                    options={{
                      indexAxis: 'y',
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                    }}
                  />
                )}
              </div>

              {/* Registration Status */}
              <div className="bg-card rounded-lg shadow-md p-4 border border-border">
                <h3 className="text-lg font-semibold mb-4">
                  Registration Status
                </h3>
                {getFilteredAttendees().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No attendance data available for the selected period
                  </div>
                ) : (
                  <ChartComponent
                    type="doughnut"
                    data={getAttendanceStatusData()}
                    height={300}
                  />
                )}
              </div>

              {/* Detailed Attendance Table */}
              <div className="bg-card rounded-lg shadow-md p-4 border border-border">
                <h3 className="text-lg font-semibold mb-4">
                  Detailed Attendance
                </h3>
                {getFilteredEvents().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No events data available for the selected period
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Event
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Registrations
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Checked In
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Attendance Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {getFilteredEvents().map((event) => {
                          const eventAttendees = attendees.filter((attendee) =>
                            typeof attendee.event === 'string'
                              ? attendee.event === event._id
                              : (attendee.event as Event)._id === event._id
                          );

                          const checkedInCount = eventAttendees.filter(
                            (a) => a.checkedIn
                          ).length;
                          const attendanceRate =
                            eventAttendees.length > 0
                              ? Math.round(
                                  (checkedInCount / eventAttendees.length) * 100
                                )
                              : 0;

                          return (
                            <tr key={event._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-foreground">
                                  {event.title}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {event.type}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-foreground">
                                  {new Date(
                                    event.startDate
                                  ).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                {eventAttendees.length}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                {checkedInCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="w-full bg-muted rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full ${
                                      attendanceRate > 70
                                        ? 'bg-green-600 dark:bg-green-400'
                                        : attendanceRate > 40
                                        ? 'bg-yellow-400 dark:bg-yellow-300'
                                        : 'bg-red-500 dark:bg-red-400'
                                    }`}
                                    style={{ width: `${attendanceRate}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {attendanceRate}%
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {reportType === 'financial' && (
            <div className="space-y-6">
              {/* Financial Overview */}
              <div className="bg-card rounded-lg shadow-md p-4 border border-border">
                <h3 className="text-lg font-semibold mb-4">
                  Financial Overview
                </h3>
                {getFilteredEvents().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No events data available for the selected period
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(() => {
                      // Calculate total expected revenue
                      const totalExpectedRevenue = getFilteredEvents().reduce(
                        (total, event) => {
                          const eventAttendees = attendees.filter((attendee) =>
                            typeof attendee.event === 'string'
                              ? attendee.event === event._id
                              : (attendee.event as Event)._id === event._id
                          );

                          return (
                            total +
                            (event.registrationFee || 0) * eventAttendees.length
                          );
                        },
                        0
                      );

                      // Calculate total actual revenue (from paid attendees)
                      const totalActualRevenue = getFilteredEvents().reduce(
                        (total, event) => {
                          const eventAttendees = attendees.filter((attendee) =>
                            typeof attendee.event === 'string'
                              ? attendee.event === event._id
                              : (attendee.event as Event)._id === event._id
                          );

                          // Only count paid attendees
                          const paidAttendees = eventAttendees.filter(
                            (attendee) => attendee.paid
                          );

                          return (
                            total +
                            (event.registrationFee || 0) * paidAttendees.length
                          );
                        },
                        0
                      );

                      // Calculate outstanding revenue
                      const outstandingRevenue =
                        totalExpectedRevenue - totalActualRevenue;

                      return (
                        <>
                          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 text-center border border-border">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                              ₦{totalActualRevenue.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Total Revenue
                            </div>
                          </div>
                          <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 text-center border border-border">
                            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                              ₦{outstandingRevenue.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Outstanding
                            </div>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-center border border-border">
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                              {getFilteredEvents().length}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Paid Events
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Top Events by Revenue */}
              <div className="bg-card rounded-lg shadow-md p-4 border border-border">
                <h3 className="text-lg font-semibold mb-4">
                  Top Events by Revenue
                </h3>
                {getFilteredEvents().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No events data available for the selected period
                  </div>
                ) : (
                  <ChartComponent
                    type="bar"
                    data={getEventRevenueData()}
                    height={300}
                    options={{
                      indexAxis: 'y',
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                    }}
                  />
                )}
              </div>

              {/* Payment Status */}
              <div className="bg-card rounded-lg shadow-md p-4 border border-border">
                <h3 className="text-lg font-semibold mb-4">Payment Status</h3>
                {getFilteredAttendees().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No attendance data available for the selected period
                  </div>
                ) : (
                  <ChartComponent
                    type="pie"
                    data={getPaymentStatusData()}
                    height={300}
                  />
                )}
              </div>

              {/* Detailed Financial Table */}
              <div className="bg-card rounded-lg shadow-md p-4 border border-border">
                <h3 className="text-lg font-semibold mb-4">
                  Detailed Financial Report
                </h3>
                {getFilteredEvents().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No events data available for the selected period
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Event
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Fee (₦)
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Registrations
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Paid
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Revenue (₦)
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Outstanding (₦)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {getFilteredEvents().map((event) => {
                          const eventAttendees = attendees.filter((attendee) =>
                            typeof attendee.event === 'string'
                              ? attendee.event === event._id
                              : (attendee.event as Event)._id === event._id
                          );

                          const paidCount = eventAttendees.filter(
                            (a) => a.paid
                          ).length;
                          const unpaidCount = eventAttendees.filter(
                            (a) => !a.paid
                          ).length;

                          const revenue =
                            (event.registrationFee || 0) * paidCount;
                          const outstanding =
                            (event.registrationFee || 0) * unpaidCount;

                          return (
                            <tr key={event._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-foreground">
                                  {event.title}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {event.type}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-foreground">
                                  {new Date(
                                    event.startDate
                                  ).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                {event.registrationFee
                                  ? event.registrationFee.toLocaleString()
                                  : 'Free'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                {eventAttendees.length}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                {paidCount} / {eventAttendees.length}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-medium">
                                {revenue.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400 font-medium">
                                {outstanding.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventReports;
