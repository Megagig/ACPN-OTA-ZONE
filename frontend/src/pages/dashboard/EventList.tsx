import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import eventService from '../../services/event.service';
import { Event, EventType, EventStatus } from '../../types/event.types';

const EventList = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'past'>(
    'all'
  );

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const data = await eventService.getEvents();
        setEvents(data);
        setFilteredEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    // Apply filters whenever filter state changes
    let results = events;

    // Search term filter
    if (searchTerm) {
      results = results.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Event type filter
    if (typeFilter !== 'all') {
      results = results.filter((event) => event.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      results = results.filter((event) => event.status === statusFilter);
    }

    // Date filter
    const now = new Date();
    if (dateFilter === 'upcoming') {
      results = results.filter((event) => new Date(event.startDate) >= now);
    } else if (dateFilter === 'past') {
      results = results.filter((event) => new Date(event.endDate) < now);
    }

    setFilteredEvents(results);
  }, [events, searchTerm, typeFilter, statusFilter, dateFilter]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status: EventStatus) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get event type badge class
  const getEventTypeBadgeClass = (type: EventType) => {
    switch (type) {
      case 'conference':
        return 'bg-purple-100 text-purple-800';
      case 'workshop':
        return 'bg-green-100 text-green-800';
      case 'seminar':
        return 'bg-blue-100 text-blue-800';
      case 'training':
        return 'bg-indigo-100 text-indigo-800';
      case 'meeting':
        return 'bg-yellow-100 text-yellow-800';
      case 'social':
        return 'bg-pink-100 text-pink-800';
      case 'other':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Delete event handler
  const handleDeleteEvent = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to detail page

    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(eventId);
        // Update the UI by removing the deleted event
        setEvents(events.filter((event) => event._id !== eventId));
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Events Management</h1>
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

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search input */}
          <div className="col-span-1 md:col-span-4 lg:col-span-1">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search Events
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                id="search"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                placeholder="Search by title, description or location"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Event Type filter */}
          <div>
            <label
              htmlFor="event-type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Event Type
            </label>
            <select
              id="event-type"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as EventType | 'all')
              }
            >
              <option value="all">All Types</option>
              <option value="conference">Conference</option>
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminar</option>
              <option value="training">Training</option>
              <option value="meeting">Meeting</option>
              <option value="social">Social</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as EventStatus | 'all')
              }
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="canceled">Canceled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Date filter */}
          <div>
            <label
              htmlFor="date-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date
            </label>
            <select
              id="date-filter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value as 'all' | 'upcoming' | 'past')
              }
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming Events</option>
              <option value="past">Past Events</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="rounded-lg bg-gray-200 h-20 w-full"></div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No events found matching your criteria
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Event
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date & Location
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <tr
                    key={event._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/events/${event._id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded bg-blue-100 flex items-center justify-center text-blue-500">
                          <i className="fas fa-calendar-day"></i>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {event.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {event.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(event.startDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {event.location.virtual
                          ? 'Virtual Event'
                          : event.location.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEventTypeBadgeClass(
                          event.type
                        )}`}
                      >
                        {event.type.charAt(0).toUpperCase() +
                          event.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                          event.status
                        )}`}
                      >
                        {event.status.charAt(0).toUpperCase() +
                          event.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/${event._id}/edit`);
                        }}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={(e) => handleDeleteEvent(event._id, e)}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;
