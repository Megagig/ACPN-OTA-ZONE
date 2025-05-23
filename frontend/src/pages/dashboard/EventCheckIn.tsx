import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import eventService from '../../services/event.service';
import { Event, EventAttendee } from '../../types/event.types';

const EventCheckIn: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAttendees, setFilteredAttendees] = useState<EventAttendee[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAttendee, setSelectedAttendee] =
    useState<EventAttendee | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const [eventData, attendeeData] = await Promise.all([
          eventService.getEventById(id),
          eventService.getEventAttendees(id),
        ]);

        setEvent(eventData);
        setAttendees(attendeeData);
        setFilteredAttendees(attendeeData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Filter attendees based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAttendees(attendees);
      return;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = attendees.filter(
      (attendee) =>
        attendee.userName.toLowerCase().includes(lowercaseSearch) ||
        (attendee.pharmacyName &&
          attendee.pharmacyName.toLowerCase().includes(lowercaseSearch))
    );

    setFilteredAttendees(filtered);
  }, [searchTerm, attendees]);

  // Handle check-in of an attendee
  const handleCheckIn = async (attendee: EventAttendee) => {
    if (!id) return;

    setSelectedAttendee(attendee);
    setIsChecking(true);

    try {
      await eventService.checkInAttendee(id, attendee._id);

      // Update the local state
      setAttendees(
        attendees.map((a) =>
          a._id === attendee._id
            ? { ...a, checkedIn: true, checkedInAt: new Date().toISOString() }
            : a
        )
      );

      // Update filtered attendees too
      setFilteredAttendees(
        filteredAttendees.map((a) =>
          a._id === attendee._id
            ? { ...a, checkedIn: true, checkedInAt: new Date().toISOString() }
            : a
        )
      );

      setSelectedAttendee(null);
    } catch (error) {
      console.error('Error checking in attendee:', error);
      alert('Failed to check in attendee');
    } finally {
      setIsChecking(false);
    }
  };

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

  // Get attendee status badge class
  const getAttendeeStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'registered':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'waitlisted':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'attended':
        return 'bg-purple-100 text-purple-800';
      case 'no-show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-12 bg-gray-200 rounded w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            Event Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The event you are looking for does not exist or has been removed.
          </p>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => navigate('/events')}
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Check-In Attendees
          </h1>
          <h2 className="text-lg text-gray-600">{event.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(event.startDate)} at {formatTime(event.startDate)}
          </p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm shadow hover:bg-gray-50"
            onClick={() => navigate(`/events/${id}`)}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Event
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Status</div>
            <div className="flex items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                {attendees.length} Registered
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {attendees.filter((a) => a.checkedIn).length} Checked In
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <div>
              Location:{' '}
              <span className="text-gray-700">{event.location.name}</span>
            </div>
            {event.maxAttendees && (
              <div>
                Capacity:{' '}
                <span className="text-gray-700">
                  {attendees.filter((a) => a.checkedIn).length} /{' '}
                  {event.maxAttendees}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search by name or pharmacy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Attendees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAttendees.length === 0 ? (
          <div className="col-span-2 bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            <i className="fas fa-users text-gray-300 text-3xl mb-2"></i>
            <p>No attendees found</p>
          </div>
        ) : (
          filteredAttendees.map((attendee) => (
            <div
              key={attendee._id}
              className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
                attendee.checkedIn
                  ? 'border-green-500'
                  : attendee.paid
                  ? 'border-blue-500'
                  : 'border-yellow-500'
              }`}
            >
              <div className="flex justify-between">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <i className="fas fa-user text-gray-500"></i>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {attendee.userName}
                    </h3>
                    {attendee.pharmacyName && (
                      <p className="text-sm text-gray-500">
                        {attendee.pharmacyName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAttendeeStatusBadgeClass(
                      attendee.status
                    )}`}
                  >
                    {attendee.status.charAt(0).toUpperCase() +
                      attendee.status.slice(1)}
                  </span>
                  {attendee.paid ? (
                    <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Unpaid
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Registered on {formatDate(attendee.registeredAt)}
                  </div>
                  {attendee.checkedIn ? (
                    <div className="inline-flex items-center text-sm text-green-600">
                      <i className="fas fa-check-circle mr-1"></i>
                      Checked in at{' '}
                      {attendee.checkedInAt
                        ? formatTime(attendee.checkedInAt)
                        : 'N/A'}
                    </div>
                  ) : (
                    <button
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => handleCheckIn(attendee)}
                      disabled={
                        isChecking && selectedAttendee?._id === attendee._id
                      }
                    >
                      {isChecking && selectedAttendee?._id === attendee._id ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Checking in...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-clipboard-check mr-1"></i>
                          Check In
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination and statistics (for a more complete implementation) */}
      <div className="bg-white rounded-lg shadow-md p-4 mt-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-500 mb-4 md:mb-0">
            Showing {filteredAttendees.length} of {attendees.length} attendees
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => window.print()}
            >
              <i className="fas fa-print mr-2"></i>
              Print Check-In List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCheckIn;
