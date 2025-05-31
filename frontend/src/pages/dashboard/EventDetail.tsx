import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import eventService from '../../services/event.service';
import type {
  Event,
  EventRegistration,
  RegistrationStatus,
} from '../../types/event.types';

// UI-specific extension of EventRegistration to include UI state
interface UIEventRegistration extends EventRegistration {
  checkedIn?: boolean;
  checkedInAt?: string;
}

const EventDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<UIEventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'attendees'>(
    'details'
  );

  useEffect(() => {
    if (!id) return;

    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        const [eventData, attendanceData] = await Promise.all([
          eventService.getEventById(id),
          eventService.getEventRegistrations(id),
        ]);

        setEvent(eventData);
        setAttendees(attendanceData.data || []);
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

  // Handle updating registration status
  const handleUpdateRegistrationStatus = async (
    registrationId: string,
    status: RegistrationStatus
  ) => {
    if (!id) return;
    try {
      await eventService.updateRegistrationStatus(id, registrationId, status);
      // Update the attendee status in the state
      setAttendees(
        attendees.map((a) =>
          a._id === registrationId ? { ...a, status: status } : a
        )
      );
    } catch (error) {
      console.error('Error updating registration status:', error);
      alert('Failed to update registration status');
    }
  };

  // Handle attendee check-in
  const handleCheckIn = async (registrationId: string) => {
    if (!id) return;
    try {
      // Since there's no direct check-in method, we'll use updateRegistrationStatus
      // to set status to 'confirmed' as a workaround
      await eventService.updateRegistrationStatus(
        id,
        registrationId,
        'confirmed' as RegistrationStatus
      );
      // Update the attendee status in the state and add a "checked in" flag
      setAttendees(
        attendees.map((a) =>
          a._id === registrationId
            ? {
                ...a,
                status: 'confirmed' as RegistrationStatus,
                checkedIn: true, // This is now properly typed with our UIEventRegistration interface
                checkedInAt: new Date().toISOString(),
              }
            : a
        )
      );
    } catch (error) {
      console.error('Error checking in attendee:', error);
      alert('Failed to check in attendee');
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'draft':
        return 'bg-muted text-muted-foreground';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Get attendee status badge class
  const getAttendeeStatusBadgeClass = (status: RegistrationStatus) => {
    switch (status) {
      case 'registered':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'waitlist':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-3/4"></div>
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="h-40 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-lg shadow-md p-6 text-center border border-border">
          <h2 className="text-xl font-medium text-foreground mb-2">
            Event Not Found
          </h2>
          <p className="text-muted-foreground mb-4">
            The event you are looking for does not exist or has been removed.
          </p>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:focus:ring-offset-background"
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
          <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
          <div className="flex flex-wrap items-center mt-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                event.status
              )} mr-2`}
            >
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
              {event.eventType.charAt(0).toUpperCase() +
                event.eventType.slice(1)}
            </span>
          </div>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            className="bg-card border border-border text-foreground px-4 py-2 rounded-md text-sm shadow hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:focus:ring-offset-background"
            onClick={() => navigate('/events')}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to List
          </button>
          <button
            className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-background"
            onClick={() => navigate(`/events/${id}/edit`)}
          >
            <i className="fas fa-edit mr-2"></i>
            Edit Event
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`${
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            onClick={() => setActiveTab('details')}
          >
            Event Details
          </button>
          <button
            className={`${
              activeTab === 'attendees'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            onClick={() => setActiveTab('attendees')}
          >
            Attendees ({attendees.length})
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'details' ? (
        <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
          {/* Event image or icon */}
          {event.imageUrl ? (
            <div
              className="h-48 w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${event.imageUrl})` }}
            ></div>
          ) : (
            <div className="h-48 w-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center">
              <i className="fas fa-calendar-alt text-white text-5xl"></i>
            </div>
          )}

          <div className="p-6">
            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Description
              </h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Event details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Date and time */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Date & Time
                </h3>
                <div className="bg-muted p-4 rounded-lg border border-border">
                  <div className="flex items-center mb-2">
                    <i className="fas fa-calendar text-blue-500 dark:text-blue-400 mr-3"></i>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {formatDate(event.startDate)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(event.startDate)} -{' '}
                        {formatTime(event.endDate)}
                      </div>
                    </div>
                  </div>
                  {event.requiresRegistration && (
                    <div className="flex items-center mt-3">
                      <i className="fas fa-user-check text-green-500 dark:text-green-400 mr-3"></i>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          Registration Deadline
                        </div>
                        <div className="text-xs text-muted-foreground">
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
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Location
                </h3>
                <div className="bg-muted p-4 rounded-lg border border-border">
                  <div className="flex items-center">
                    <i
                      className={`${
                        event.location.virtual
                          ? 'fas fa-video'
                          : 'fas fa-map-marker-alt'
                      } text-blue-500 dark:text-blue-400 mr-3`}
                    ></i>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {event.location.name}
                        {event.location.virtual && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">
                            Virtual
                          </span>
                        )}
                      </div>
                      {!event.location.virtual ? (
                        <div className="text-xs text-muted-foreground">
                          {event.location.address}, {event.location.city},{' '}
                          {event.location.state}
                        </div>
                      ) : event.location.meetingLink ? (
                        <div className="text-xs text-blue-500 dark:text-blue-400">
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
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Registration
                </h3>
                <div className="bg-muted p-4 rounded-lg border border-border">
                  {event.requiresRegistration ? (
                    <>
                      <div className="flex items-center mb-2">
                        <i className="fas fa-clipboard-check text-green-500 dark:text-green-400 mr-3"></i>
                        <div className="text-sm text-foreground">
                          Registration required
                        </div>
                      </div>
                      {event.registrationFee ? (
                        <div className="flex items-center mb-2">
                          <i className="fas fa-money-bill-wave text-green-500 dark:text-green-400 mr-3"></i>
                          <div className="text-sm text-foreground">
                            Fee: ₦{event.registrationFee.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center mb-2">
                          <i className="fas fa-ticket-alt text-green-500 dark:text-green-400 mr-3"></i>
                          <div className="text-sm text-foreground">
                            Free event
                          </div>
                        </div>
                      )}
                      {event.capacity ? (
                        <div className="flex items-center">
                          <i className="fas fa-users text-blue-500 dark:text-blue-400 mr-3"></i>
                          <div className="text-sm text-foreground">
                            Limited to {event.capacity} attendees
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <i className="fas fa-users text-blue-500 dark:text-blue-400 mr-3"></i>
                          <div className="text-sm text-foreground">
                            Unlimited attendance
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center">
                      <i className="fas fa-door-open text-blue-500 dark:text-blue-400 mr-3"></i>
                      <div className="text-sm text-foreground">
                        No registration required
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Organizer details */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Organizer
                </h3>
                <div className="bg-muted p-4 rounded-lg border border-border">
                  <div className="flex items-center">
                    <i className="fas fa-user-tie text-blue-500 dark:text-blue-400 mr-3"></i>
                    <div className="text-sm text-foreground">
                      {event.organizer}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Tags
                </h3>
                <div className="flex flex-wrap">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 mr-2 mb-2"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap justify-between items-center border-t border-border pt-6 mt-6">
              <div className="text-sm text-muted-foreground mb-4 md:mb-0">
                Created: {formatDate(event.createdAt || '')}
                {event.updatedAt &&
                  event.updatedAt !== event.createdAt &&
                  ` • Updated: ${formatDate(event.updatedAt)}`}
              </div>
              <div className="flex space-x-3">
                {event.status === 'published' && (
                  <button
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-background"
                    onClick={() => navigate(`/events/${id}/register`)}
                  >
                    <i className="fas fa-user-plus mr-2"></i>
                    Register Attendee
                  </button>
                )}
                <button
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-background"
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
        <div className="bg-card rounded-lg shadow-md border border-border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-foreground">Attendees</h2>
            <div className="flex space-x-2">
              <button
                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-background"
                onClick={() => navigate(`/events/${id}/register`)}
              >
                <i className="fas fa-user-plus mr-2"></i>
                Add Attendee
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-background"
                onClick={() => navigate(`/events/${id}/check-in`)}
              >
                <i className="fas fa-clipboard-check mr-2"></i>
                Check-in Attendees
              </button>
            </div>
          </div>

          {attendees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <i className="fas fa-users text-muted-foreground/50 text-4xl mb-3"></i>
              <p>No attendees registered for this event yet.</p>
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
                      Attendee
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Pharmacy
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Registered On
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Payment
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Check-in
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {attendees.map((attendee) => (
                    <tr key={attendee._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <i className="fas fa-user text-muted-foreground"></i>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">
                              {attendee.userId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">N/A</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {formatDate(
                            attendee.registeredAt || attendee.createdAt || ''
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(
                            attendee.registeredAt || attendee.createdAt || ''
                          )}
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
                        {attendee.paymentStatus === 'paid' ? (
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              Paid
                            </span>
                            {attendee.paymentReference && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Ref: {attendee.paymentReference}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                            {attendee.paymentStatus.charAt(0).toUpperCase() +
                              attendee.paymentStatus.slice(1)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {attendee.status === 'confirmed' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            <i className="fas fa-check-circle mr-1"></i> Checked
                            In
                          </span>
                        ) : (
                          <button
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-background rounded px-2 py-1"
                            onClick={() => handleCheckIn(attendee._id)}
                          >
                            Check In
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-background rounded p-2"
                            onClick={() =>
                              navigate(
                                `/events/${id}/attendees/${attendee._id}`
                              )
                            }
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-background rounded p-2"
                            onClick={() => {
                              if (
                                window.confirm(
                                  'Are you sure you want to remove this attendee?'
                                )
                              ) {
                                handleUpdateRegistrationStatus(
                                  attendee._id,
                                  'cancelled' as RegistrationStatus
                                );
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
