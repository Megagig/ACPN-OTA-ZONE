import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import eventService from '../../services/event.service';
import { Event, EventAttendee } from '../../types/event.types';

const EventDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'attendees'>(
    'details'
  );

  useEffect(() => {
    if (!id) return;

    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        const [eventData, attendeeData] = await Promise.all([
          eventService.getEventById(id),
          eventService.getEventAttendees(id),
        ]);

        setEvent(eventData);
        setAttendees(attendeeData);
      } catch (error) {
        console.error('Error fetching event details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'long',
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

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
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
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
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
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{event.title}</h1>
          <div className="flex flex-wrap items-center mt-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                event.status
              )} mr-2`}
            >
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
            </span>
          </div>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm shadow hover:bg-gray-50"
            onClick={() => navigate('/events')}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to List
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow"
            onClick={() => navigate(`/events/${id}/edit`)}
          >
            <i className="fas fa-edit mr-2"></i>
            Edit Event
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('details')}
          >
            Event Details
          </button>
          <button
            className={`${
              activeTab === 'attendees'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('attendees')}
          >
            Attendees ({attendees.length})
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'details' ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Event image or icon */}
          {event.thumbnail ? (
            <div
              className="h-48 w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${event.thumbnail})` }}
            ></div>
          ) : (
            <div className="h-48 w-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center">
              <i className="fas fa-calendar-alt text-white text-5xl"></i>
            </div>
          )}

          <div className="p-6">
            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Description
              </h2>
              <p className="text-gray-600 whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Event details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Date and time */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Date & Time
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <i className="fas fa-calendar text-blue-500 mr-3"></i>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {formatDate(event.startDate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(event.startDate)} -{' '}
                        {formatTime(event.endDate)}
                      </div>
                    </div>
                  </div>
                  {event.registrationRequired && (
                    <div className="flex items-center mt-3">
                      <i className="fas fa-user-check text-green-500 mr-3"></i>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          Registration Deadline
                        </div>
                        <div className="text-xs text-gray-500">
                          {event.registrationDeadline
                            ? formatDate(event.registrationDeadline) +
                              ' at ' +
                              formatTime(event.registrationDeadline)
                            : 'No deadline set'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Location
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <i
                      className={`${
                        event.location.virtual
                          ? 'fas fa-video'
                          : 'fas fa-map-marker-alt'
                      } text-blue-500 mr-3`}
                    ></i>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {event.location.name}
                        {event.location.virtual && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Virtual
                          </span>
                        )}
                      </div>
                      {!event.location.virtual ? (
                        <div className="text-xs text-gray-500">
                          {event.location.address}, {event.location.city},{' '}
                          {event.location.state}
                        </div>
                      ) : event.location.meetingLink ? (
                        <div className="text-xs text-blue-500">
                          <a
                            href={event.location.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            Join Meeting
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration details */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Registration
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {event.registrationRequired ? (
                    <>
                      <div className="flex items-center mb-2">
                        <i className="fas fa-clipboard-check text-green-500 mr-3"></i>
                        <div className="text-sm text-gray-800">
                          Registration required
                        </div>
                      </div>
                      {event.registrationFee ? (
                        <div className="flex items-center mb-2">
                          <i className="fas fa-money-bill-wave text-green-500 mr-3"></i>
                          <div className="text-sm text-gray-800">
                            Fee: ₦{event.registrationFee.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center mb-2">
                          <i className="fas fa-ticket-alt text-green-500 mr-3"></i>
                          <div className="text-sm text-gray-800">
                            Free event
                          </div>
                        </div>
                      )}
                      {event.maxAttendees ? (
                        <div className="flex items-center">
                          <i className="fas fa-users text-blue-500 mr-3"></i>
                          <div className="text-sm text-gray-800">
                            Limited to {event.maxAttendees} attendees
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <i className="fas fa-users text-blue-500 mr-3"></i>
                          <div className="text-sm text-gray-800">
                            Unlimited attendance
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center">
                      <i className="fas fa-door-open text-blue-500 mr-3"></i>
                      <div className="text-sm text-gray-800">
                        No registration required
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Organizer details */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Organizer
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <i className="fas fa-user-tie text-blue-500 mr-3"></i>
                    <div className="text-sm text-gray-800">
                      {event.organizerName}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
                <div className="flex flex-wrap">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2 mb-2"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap justify-between items-center border-t pt-6 mt-6">
              <div className="text-sm text-gray-500 mb-4 md:mb-0">
                Created: {formatDate(event.createdAt || '')}
                {event.updatedAt &&
                  event.updatedAt !== event.createdAt &&
                  ` • Updated: ${formatDate(event.updatedAt)}`}
              </div>
              <div className="flex space-x-3">
                {event.status === 'published' && (
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm shadow"
                    onClick={() => navigate(`/events/${id}/register`)}
                  >
                    <i className="fas fa-user-plus mr-2"></i>
                    Register Attendee
                  </button>
                )}
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow"
                  onClick={() => setActiveTab('attendees')}
                >
                  <i className="fas fa-users mr-2"></i>
                  Manage Attendees
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Attendees</h2>
            <div className="flex space-x-2">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm shadow"
                onClick={() => navigate(`/events/${id}/register`)}
              >
                <i className="fas fa-user-plus mr-2"></i>
                Add Attendee
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow"
                onClick={() => navigate(`/events/${id}/check-in`)}
              >
                <i className="fas fa-clipboard-check mr-2"></i>
                Check-in Attendees
              </button>
            </div>
          </div>

          {attendees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-users text-gray-300 text-4xl mb-3"></i>
              <p>No attendees registered for this event yet.</p>
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
                      Attendee
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Pharmacy
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Registered On
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Payment
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Check-in
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
                  {attendees.map((attendee) => (
                    <tr key={attendee._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <i className="fas fa-user text-gray-500"></i>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {attendee.userName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {attendee.pharmacyName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(attendee.registeredAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(attendee.registeredAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getAttendeeStatusBadgeClass(
                            attendee.status
                          )}`}
                        >
                          {attendee.status.charAt(0).toUpperCase() +
                            attendee.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attendee.paid ? (
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Paid
                            </span>
                            {attendee.paymentMethod && (
                              <div className="text-xs text-gray-500 mt-1">
                                via {attendee.paymentMethod}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {attendee.checkedIn ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <i className="fas fa-check-circle mr-1"></i> Checked
                            In
                          </span>
                        ) : (
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={async () => {
                              try {
                                await eventService.checkInAttendee(
                                  id!,
                                  attendee._id
                                );
                                // Update the attendee in the state
                                setAttendees(
                                  attendees.map((a) =>
                                    a._id === attendee._id
                                      ? {
                                          ...a,
                                          checkedIn: true,
                                          checkedInAt: new Date().toISOString(),
                                        }
                                      : a
                                  )
                                );
                              } catch (error) {
                                console.error(
                                  'Error checking in attendee:',
                                  error
                                );
                                alert('Failed to check in attendee');
                              }
                            }}
                          >
                            Check In
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() =>
                              navigate(
                                `/events/${id}/attendees/${attendee._id}`
                              )
                            }
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={async () => {
                              if (
                                window.confirm(
                                  'Are you sure you want to remove this attendee?'
                                )
                              ) {
                                try {
                                  await eventService.updateAttendeeStatus(
                                    id!,
                                    attendee._id,
                                    'canceled'
                                  );
                                  // Update the attendee status in the state
                                  setAttendees(
                                    attendees.map((a) =>
                                      a._id === attendee._id
                                        ? { ...a, status: 'canceled' }
                                        : a
                                    )
                                  );
                                } catch (error) {
                                  console.error(
                                    'Error removing attendee:',
                                    error
                                  );
                                  alert('Failed to remove attendee');
                                }
                              }
                            }}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventDetail;
