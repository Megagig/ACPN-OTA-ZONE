import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import eventService from '../../services/event.service';
import type {
  Event,
  EventRegistration,
  RegistrationStatus,
} from '../../types/event.types';
import type { User } from '../../types/auth.types';
import { useToast } from '../../hooks/useToast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '../../components/shadcn/alert-dialog';
import { TrashIcon } from 'lucide-react';

// Interface for populated EventRegistration from backend
interface UIEventRegistration extends Omit<EventRegistration, 'userId'> {
  userId: User;
  attendance?: {
    present: boolean;
    checkedInAt: string;
    notes?: string;
  } | null;
}

const AdminEventDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<UIEventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'attendees'>(() => {
    // Check if we have a stored tab preference
    const storedTab = localStorage.getItem('activeEventTab');
    if (storedTab === 'attendees' || storedTab === 'details') {
      // Clear the storage after using it
      localStorage.removeItem('activeEventTab');
      return storedTab;
    }
    return 'details';
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Handle invalid URLs - redirect to events list
    if (id === 'new') {
      navigate('/admin/events/create');
      return;
    }

    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        // Fetch event details first
        let eventData;
        try {
          eventData = await eventService.getEventById(id);
          setEvent(eventData);
        } catch (error: unknown) {
          console.error('Error fetching event details:', error);
          if (
            error &&
            typeof error === 'object' &&
            'response' in error &&
            error.response &&
            typeof error.response === 'object' &&
            'status' in error.response &&
            error.response.status === 404
          ) {
            navigate('/admin/events');
          }
          throw error;
        }

        // Then fetch registrations if event was found
        try {
          const attendanceData = await eventService.getEventRegistrations(id);
          setAttendees(
            (attendanceData.data || []) as unknown as UIEventRegistration[]
          );
        } catch (error: unknown) {
          console.error('Error fetching event registrations:', error);
          // Don't throw here, just continue with empty attendees
          setAttendees([]);
        }
      } catch (error: unknown) {
        console.error('Error fetching event data:', error);
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'ECONNABORTED'
        ) {
          console.error('Connection timeout when loading event data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [id, navigate]);

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

      // Show success message
      const statusText = status.charAt(0).toUpperCase() + status.slice(1);
      const attendee = attendees.find((a) => a._id === registrationId);
      const attendeeName = attendee
        ? `${attendee.userId.firstName} ${attendee.userId.lastName}`
        : 'Attendee';

      // Use browser's built-in notification API if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Registration ${statusText}`, {
          body: `${attendeeName}'s registration is now ${status}`,
        });
      } else {
        // Fallback to alert
        alert(`Registration Updated: ${attendeeName} is now ${status}`);
      }
    } catch (error: unknown) {
      console.error('Error updating registration status:', error);

      let errorMessage = 'Failed to update registration status';
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data
      ) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage += `: ${error.message}`;
      }

      alert(errorMessage);
    }
  };

  // Handle attendee check-in
  const handleCheckIn = async (registrationId: string) => {
    if (!id) return;
    try {
      // First find the attendee to get their information for notifications
      const attendee = attendees.find((a) => a._id === registrationId);
      if (!attendee) {
        alert('Could not find registration record');
        return;
      }

      const attendeeName = `${attendee.userId.firstName} ${attendee.userId.lastName}`;

      // Perform the update
      await eventService.updateRegistrationStatus(
        id,
        registrationId,
        'confirmed' as RegistrationStatus
      );

      // Add a small delay to ensure the backend has time to process before any subsequent requests
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update the attendee status in the state and add attendance data
      setAttendees(
        attendees.map((a) =>
          a._id === registrationId
            ? {
                ...a,
                status: 'confirmed' as RegistrationStatus,
                attendance: {
                  present: true,
                  checkedInAt: new Date().toISOString(),
                },
              }
            : a
        )
      );

      // Show success message
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Attendee Checked In', {
          body: `${attendeeName} has been checked in successfully`,
        });
      } else {
        // Fallback to alert
        alert(`Success: ${attendeeName} has been checked in successfully`);
      }
    } catch (error: unknown) {
      console.error('Error checking in attendee:', error);

      let errorMessage = 'Failed to check in attendee';
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data
      ) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage += `: ${error.message}`;
      }

      alert(errorMessage);
    }
  };

  // Handle publishing the event
  const handlePublishEvent = async () => {
    if (!id) return;
    setIsPublishing(true);
    try {
      const updatedEvent = await eventService.publishEvent(id);

      // Update the event status in the state
      setEvent(updatedEvent);

      toast({
        title: 'Success',
        description: 'Event published successfully',
      });
    } catch (error: unknown) {
      console.error('Error publishing event:', error);

      let errorMessage = 'Failed to publish event';
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data
      ) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage += `: ${error.message}`;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle unpublishing the event
  const handleCancelEvent = async () => {
    if (!id) return;
    setIsPublishing(true);
    try {
      const updatedEvent = await eventService.cancelEvent(id);

      // Update the event status in the state
      setEvent(updatedEvent);

      toast({
        title: 'Success',
        description: 'Event cancelled successfully',
      });
    } catch (error: unknown) {
      console.error('Error cancelling event:', error);

      let errorMessage = 'Failed to cancel event';
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data
      ) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage += `: ${error.message}`;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
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

  const handleDeleteEvent = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await eventService.deleteEvent(id);
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });
      setDeleteDialogOpen(false);
      navigate('/admin/events');
    } catch (error: unknown) {
      console.error('Failed to delete event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
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
            onClick={() => navigate('/admin/events')}
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
            onClick={() => navigate('/admin/events')}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to List
          </button>
          <button
            className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-background"
            onClick={() => navigate(`/admin/events/${id}/edit`)}
          >
            <i className="fas fa-edit mr-2"></i>
            Edit Event
          </button>
          {event.status === 'draft' && (
            <button
              className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-background"
              onClick={handlePublishEvent}
              disabled={isPublishing}
            >
              <i className="fas fa-upload mr-2"></i>
              {isPublishing ? 'Publishing...' : 'Publish Event'}
            </button>
          )}
          {event.status === 'published' && (
            <button
              className="bg-amber-600 dark:bg-amber-700 hover:bg-amber-700 dark:hover:bg-amber-800 text-white px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-background"
              onClick={handleCancelEvent}
              disabled={isPublishing}
            >
              <i className="fas fa-ban mr-2"></i>
              {isPublishing ? 'Cancelling...' : 'Cancel Event'}
            </button>
          )}
          <button
            className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-background"
            onClick={() => navigate(`/admin/events/${id}/attendance`)}
          >
            <i className="fas fa-users mr-2"></i>
            Mark Attendance
          </button>
          <button
            className="bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-background"
            onClick={handleDeleteEvent}
            disabled={isDeleting}
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete Event'}
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
                  {event.requiresRegistration && event.registrationDeadline && (
                    <div className="flex items-center mt-3">
                      <i className="fas fa-user-check text-green-500 dark:text-green-400 mr-3"></i>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          Registration Deadline
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(event.registrationDeadline)}
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
                    <i className="fas fa-map-marker-alt text-red-500 dark:text-red-400 mr-3"></i>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {event.location?.name || 'Location not specified'}
                      </div>
                      {event.location?.virtual && (
                        <div className="text-xs text-muted-foreground">
                          Virtual Event
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Capacity */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Capacity
                </h3>
                <div className="bg-muted p-4 rounded-lg border border-border">
                  <div className="flex items-center">
                    <i className="fas fa-users text-purple-500 dark:text-purple-400 mr-3"></i>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {event.maxAttendees
                          ? `${attendees.length} / ${event.maxAttendees}`
                          : 'Unlimited'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Registered Attendees
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Cost
                </h3>
                <div className="bg-muted p-4 rounded-lg border border-border">
                  <div className="flex items-center">
                    <i className="fas fa-money-bill-wave text-green-500 dark:text-green-400 mr-3"></i>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {event.registrationFee && event.registrationFee > 0
                          ? `₦${event.registrationFee}`
                          : 'Free'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Registration Fee
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration settings */}
            {event.requiresRegistration && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Registration Settings
                </h3>
                <div className="bg-muted p-4 rounded-lg border border-border">
                  <div className="flex items-center">
                    <i className="fas fa-clipboard-check text-blue-500 dark:text-blue-400 mr-3"></i>
                    <span className="text-sm text-foreground">
                      Registration Required
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Attendees Tab */
        <div className="bg-card rounded-lg shadow-md border border-border">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Event Attendees
              </h2>
              <div className="text-sm text-muted-foreground">
                Total: {attendees.length}
              </div>
            </div>

            {attendees.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-users text-muted-foreground text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No Attendees Yet
                </h3>
                <p className="text-muted-foreground">
                  No one has registered for this event yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Attendee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Attendance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Registered Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {attendees.map((attendee) => (
                      <tr key={attendee._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {attendee.userId?.firstName?.[0] || 'U'}
                                  {attendee.userId?.lastName?.[0] || ''}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-foreground">
                                {attendee.userId?.firstName || 'Unknown'}{' '}
                                {attendee.userId?.lastName || 'User'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {attendee.userId?.pcnLicense ||
                                  'No PCN License'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {attendee.userId?.email || 'No email'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAttendeeStatusBadgeClass(
                              attendee.status
                            )}`}
                          >
                            {attendee.status.charAt(0).toUpperCase() +
                              attendee.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(attendee.registeredAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {attendee.status !== 'confirmed' && (
                              <button
                                className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                                onClick={() =>
                                  handleUpdateRegistrationStatus(
                                    attendee._id,
                                    'confirmed'
                                  )
                                }
                              >
                                Confirm
                              </button>
                            )}
                            {attendee.status !== 'cancelled' && (
                              <button
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                onClick={() =>
                                  handleUpdateRegistrationStatus(
                                    attendee._id,
                                    'cancelled'
                                  )
                                }
                              >
                                Cancel
                              </button>
                            )}
                            {!attendee.attendance?.present && (
                              <button
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                                onClick={() => handleCheckIn(attendee._id)}
                              >
                                Check In
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent variant="destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction loading={isDeleting} onClick={confirmDeleteEvent} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminEventDetail;
