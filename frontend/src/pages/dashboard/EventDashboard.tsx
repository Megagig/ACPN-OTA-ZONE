import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import eventService from '../../services/event.service';
import ChartComponent from '../../components/common/ChartComponent';
import StatCard from '../../components/common/StatCard';
import { Event, EventSummary, EventType } from '../../types/event.types';

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
        <h1 className="text-2xl font-bold text-gray-800">Events Overview</h1>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow"
            onClick={() => navigate('/events/create')}
          >
            <i className="fas fa-plus mr-2"></i>
            Create Event
          </button>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm shadow"
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
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">Event Types</h2>
          {isLoading ? (
            <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
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
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">Top Attended Events</h2>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : summary?.topAttendedEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No event attendance data available yet
            </div>
          ) : (
            <div className="space-y-4">
              {summary?.topAttendedEvents.map(({ event, attendeeCount }) => (
                <div
                  key={event._id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/events/${event._id}`)}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 text-indigo-500 rounded-lg flex items-center justify-center mr-4">
                    <i className="fas fa-users text-lg"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {event.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(event.startDate)}
                    </p>
                  </div>
                  <div className="inline-flex items-center text-sm font-semibold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-full">
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
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Upcoming Events</h2>
          <button
            className="text-blue-600 hover:text-blue-800 text-sm"
            onClick={() => navigate('/events')}
          >
            View All
          </button>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No upcoming events scheduled
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingEvents.map((event) => (
              <div
                key={event._id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out"
                onClick={() => navigate(`/events/${event._id}`)}
              >
                <div className="flex">
                  <div className="flex-shrink-0 w-16 bg-blue-50 text-blue-600 flex flex-col items-center justify-center rounded-lg mr-4">
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
                    <h3 className="text-md font-semibold text-gray-900 mb-1">
                      {event.title}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 mb-2">
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
                            ? 'bg-purple-100 text-purple-800'
                            : event.type === 'workshop'
                            ? 'bg-green-100 text-green-800'
                            : event.type === 'seminar'
                            ? 'bg-blue-100 text-blue-800'
                            : event.type === 'meeting'
                            ? 'bg-yellow-100 text-yellow-800'
                            : event.type === 'social'
                            ? 'bg-pink-100 text-pink-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {event.type.charAt(0).toUpperCase() +
                          event.type.slice(1)}
                      </span>
                      {event.registrationRequired && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
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
          className="bg-white hover:bg-gray-50 text-blue-600 font-medium py-4 px-4 rounded-lg shadow flex items-center justify-center transition-colors duration-150"
          onClick={() => navigate('/events')}
        >
          <i className="fas fa-list mr-2"></i>
          Manage Events
        </button>
        <button
          className="bg-white hover:bg-gray-50 text-purple-600 font-medium py-4 px-4 rounded-lg shadow flex items-center justify-center transition-colors duration-150"
          onClick={() => navigate('/events/attendees')}
        >
          <i className="fas fa-user-check mr-2"></i>
          Attendance Records
        </button>
        <button
          className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-4 px-4 rounded-lg shadow flex items-center justify-center transition-colors duration-150"
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
