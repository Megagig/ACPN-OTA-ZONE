import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import eventService from '../../services/event.service';
import ChartComponent from '../../components/common/ChartComponent';
import StatCard from '../../components/common/StatCard';
import type { Event, EventSummary, EventType } from '../../types/event.types';

const EventDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<EventSummary | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        const summaryData = await eventService.getEventSummary();
        setSummary(summaryData);

        const events = await eventService.getEvents();
        // Filter for upcoming events and sort by start date
        const upcoming = events
          .filter((event) => new Date(event.startDate) > new Date())
          .sort(
            (a, b) =>
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          )
          .slice(0, 5);
        setUpcomingEvents(upcoming);
      } catch (error) {
        console.error('Error fetching event data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get event type chart data
  const getEventTypeChartData = () => {
    if (!summary) return null;

    const labels = Object.keys(summary.byType).filter(
      (type) => summary.byType[type as EventType] > 0
    );
    const data = labels.map((type) => summary.byType[type as EventType]);

    return {
      labels,
      datasets: [
        {
          data,
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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Events Overview</h1>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-offset-background"
            onClick={() => navigate('/events/create')}
          >
            <i className="fas fa-plus mr-2"></i>
            Create Event
          </button>
          <button
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-offset-background"
            onClick={() => navigate('/events/calendar')}
          >
            <i className="fas fa-calendar-alt mr-2"></i>
            Calendar View
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Events"
          value={isLoading ? '-' : summary?.total.toString() || '0'}
          icon={<i className="fas fa-calendar-days"></i>}
          className="border-l-4 border-blue-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Upcoming Events"
          value={isLoading ? '-' : summary?.upcoming.toString() || '0'}
          icon={<i className="fas fa-hourglass-start"></i>}
          className="border-l-4 border-green-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Past Events"
          value={isLoading ? '-' : summary?.past.toString() || '0'}
          icon={<i className="fas fa-hourglass-end"></i>}
          className="border-l-4 border-purple-500"
          isLoading={isLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Event Types Distribution */}
        <div className="bg-card rounded-lg shadow-md border border-border p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Event Types
          </h2>
          {isLoading ? (
            <div className="animate-pulse h-64 bg-muted rounded"></div>
          ) : (
            getEventTypeChartData() && (
              <ChartComponent
                type="doughnut"
                data={getEventTypeChartData()!}
                height={300}
              />
            )
          )}
        </div>

        {/* Top Attended Events */}
        <div className="bg-card rounded-lg shadow-md border border-border p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Top Attended Events
          </h2>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          ) : summary?.topAttendedEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No event attendance data available yet
            </div>
          ) : (
            <div className="space-y-4">
              {summary?.topAttendedEvents.map(({ event, attendeeCount }) => (
                <div
                  key={event._id}
                  className="flex items-center p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/events/${event._id}`)}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mr-4">
                    <i className="fas fa-users text-lg"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {event.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(event.startDate)}
                    </p>
                  </div>
                  <div className="inline-flex items-center text-sm font-semibold text-foreground bg-muted px-2.5 py-0.5 rounded-full">
                    {attendeeCount}{' '}
                    {attendeeCount === 1 ? 'Attendee' : 'Attendees'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="bg-card rounded-lg shadow-md border border-border p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Upcoming Events
          </h2>
          <button
            className="text-primary hover:text-primary/80 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-offset-background"
            onClick={() => navigate('/events')}
          >
            View All
          </button>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No upcoming events scheduled
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingEvents.map((event) => (
              <div
                key={event._id}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition duration-150 ease-in-out"
                onClick={() => navigate(`/events/${event._id}`)}
              >
                <div className="flex">
                  <div className="flex-shrink-0 w-16 bg-primary/10 text-primary flex flex-col items-center justify-center rounded-lg mr-4">
                    <span className="text-sm font-semibold">
                      {new Date(event.startDate).toLocaleDateString('en-NG', {
                        day: '2-digit',
                      })}
                    </span>
                    <span className="text-xs">
                      {new Date(event.startDate).toLocaleDateString('en-NG', {
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-md font-semibold text-foreground mb-1">
                      {event.title}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center text-xs text-muted-foreground mb-2">
                      <span className="flex items-center mr-3">
                        <i className="fas fa-clock mr-1"></i>
                        {formatTime(event.startDate)} -{' '}
                        {formatTime(event.endDate)}
                      </span>
                      <span className="flex items-center">
                        <i className="fas fa-map-marker-alt mr-1"></i>
                        {event.location.virtual
                          ? 'Virtual Event'
                          : event.location.name}
                      </span>
                    </div>
                    <div className="flex items-center mt-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.type === 'conference'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                            : event.type === 'workshop'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : event.type === 'seminar'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                            : event.type === 'meeting'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                            : event.type === 'social'
                            ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {event.type.charAt(0).toUpperCase() +
                          event.type.slice(1)}
                      </span>
                      {event.registrationRequired && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                          Registration Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          className="bg-card hover:bg-muted/50 text-primary font-medium py-4 px-4 rounded-lg shadow border border-border flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-offset-background"
          onClick={() => navigate('/events')}
        >
          <i className="fas fa-list mr-2"></i>
          Manage Events
        </button>
        <button
          className="bg-card hover:bg-muted/50 text-secondary font-medium py-4 px-4 rounded-lg shadow border border-border flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-offset-background"
          onClick={() => navigate('/events/attendees')}
        >
          <i className="fas fa-user-check mr-2"></i>
          Attendance Records
        </button>
        <button
          className="bg-card hover:bg-muted/50 text-foreground font-medium py-4 px-4 rounded-lg shadow border border-border flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-offset-background"
          onClick={() => navigate('/events/report')}
        >
          <i className="fas fa-chart-bar mr-2"></i>
          Event Reports
        </button>
      </div>
    </div>
  );
};

export default EventDashboard;
