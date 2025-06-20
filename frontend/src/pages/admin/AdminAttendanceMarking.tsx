import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/shadcn/button';
import { Input } from '../../components/shadcn/input';
import { Textarea } from '../../components/shadcn/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/shadcn/card';
import { Badge } from '../../components/shadcn/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/shadcn/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/shadcn/dialog';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UsersIcon,
  SearchIcon,
  CalendarIcon,
  MapPinIcon,
} from 'lucide-react';
import { EventService } from '../../services/event.service';
import { useToast } from '../../hooks/useToast';
import type {
  Event,
  EventRegistration,
  AttendanceMarkingData,
  PaginatedResponse,
} from '../../types/event.types';
import UserService from '../../services/user.service';

// Type for user data populated in registration
interface PopulatedUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  pharmacy?: {
    name: string;
    registrationNumber: string;
  };
}

// Type for registration with populated user and attendance data
interface PopulatedRegistration extends Omit<EventRegistration, 'userId'> {
  userId: PopulatedUser;
  attendance?: {
    present: boolean;
    checkedInAt: string;
    notes?: string;
  } | null;
}

// Type for our component's attendee data
interface AttendanceUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  pharmacy?: {
    name: string;
    registrationNumber: string;
  };
  registration?: EventRegistration;
  attendance?: {
    _id: string;
    userId: string;
    eventId: string;
    attendedAt: string;
    markedBy: string;
    notes?: string;
  };
}

const AdminAttendanceMarking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Define loading state type
  const [loadingStage, setLoadingStage] = useState<
    'event' | 'registrations' | 'pharmacies' | 'complete'
  >('event');

  const [event, setEvent] = useState<Event | null>(null);
  const [users, setUsers] = useState<AttendanceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [markingAttendance, setMarkingAttendance] = useState<string | null>(
    null
  );
  const [selectedUser, setSelectedUser] = useState<AttendanceUser | null>(null);
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [showMarkDialog, setShowMarkDialog] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const ITEMS_PER_PAGE = 20; // Smaller batch size to reduce load time

  const [bulkRegistering, setBulkRegistering] = useState(false);

  const loadEventDetails = useCallback(async () => {
    try {
      setLoadingStage('event');
      // Check if ID is valid first
      if (!id || id === 'new') {
        navigate('/admin/events');
        toast({
          title: 'Error',
          description: 'Invalid event ID',
          variant: 'destructive',
        });
        return false;
      }

      console.log(`Loading event details for ID: ${id}`);

      // Load event details with timeout handling
      const eventData = await EventService.getEventById(id);
      console.log('Event data loaded successfully:', eventData?._id);
      setEvent(eventData);
      return true;
    } catch (error: unknown) {
      console.error('Error fetching event details:', error);

      // Handle different types of errors
      const axiosError = error as {
        response?: { status?: number; data?: any };
        code?: string;
        message?: string;
      };

      if (axiosError?.code === 'ECONNABORTED') {
        toast({
          title: 'Connection Timeout',
          description:
            'The request took too long. Please check your connection and try again.',
          variant: 'destructive',
        });
      } else if (axiosError?.response?.status === 401) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in again to access this page.',
          variant: 'destructive',
        });
        // Redirect to login
        window.location.href = '/login';
        return false;
      } else if (axiosError?.response?.status === 404) {
        navigate('/admin/events');
        toast({
          title: 'Error',
          description: 'Event not found',
          variant: 'destructive',
        });
      } else {
        const errorMsg =
          error instanceof Error
            ? error.message
            : 'Failed to load event details';
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        navigate('/admin/events');
      }
      return false;
    }
  }, [id, navigate, toast]);

  const loadRegistrations = useCallback(
    async (page: number, showToast = false) => {
      try {
        // Only set full loading on first page
        if (page === 1) {
          if (!hasInitialLoad) {
            setLoading(true);
          }
        } else {
          setLoadingMore(true);
        }
        console.log(`Loading registrations for event: ${id}, page: ${page}`);

        // Then load event registrations with attendance data with retry mechanism
        setLoadingStage('registrations');
        const fetchRegistrations = async (
          retryCount = 0
        ): Promise<PaginatedResponse<EventRegistration>> => {
          try {
            const data = await EventService.getEventRegistrations(
              id as string,
              page,
              ITEMS_PER_PAGE
            );
            console.log(
              `Fetched ${data.data?.length || 0} registrations for event ${id}`
            );
            return data;
          } catch (error: unknown) {
            console.error(
              `Error fetching registrations (attempt ${retryCount + 1}):`,
              error
            );
            const axiosError = error as { code?: string; message?: string };
            if (axiosError?.code === 'ECONNABORTED' && retryCount < 3) {
              console.log(`Retrying after timeout, attempt ${retryCount + 1}`);
              // Wait 2 seconds before retrying
              await new Promise((resolve) => setTimeout(resolve, 2000));
              return fetchRegistrations(retryCount + 1);
            }
            throw error;
          }
        };

        const registrationsData = await fetchRegistrations();

        // Update pagination info - we won't use pagination now since we're showing all pharmacies
        setTotalPages(1);

        // Transform registration data to match our component's expected format
        const populatedRegistrations =
          registrationsData.data as unknown as PopulatedRegistration[];

        // Fetch all members
        const allMembers = await loadAllMembers();

        // Merge registration and attendance data for each member
        const allAttendees: AttendanceUser[] = allMembers.map((member: any) => {
          const registration = populatedRegistrations.find(
            (reg) => reg.userId._id === member._id
          );
          // Map registration to EventRegistration type if present
          let mappedRegistration = undefined;
          if (registration) {
            mappedRegistration = {
              _id: registration._id,
              eventId: registration.eventId,
              userId: registration.userId._id, // convert to string
              status: registration.status,
              paymentStatus: registration.paymentStatus,
              paymentReference: registration.paymentReference,
              registeredAt: registration.registeredAt,
              registrationDate: registration.registrationDate,
              createdAt: registration.createdAt,
              updatedAt: registration.updatedAt,
            };
          }
          return {
            _id: member._id,
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            phone: member.phoneNumber,
            registration: mappedRegistration,
            attendance: registration && registration.attendance
              ? {
                  _id: registration._id,
                  userId: member._id,
                  eventId: id as string,
                  attendedAt: registration.attendance.checkedInAt,
                  markedBy: '',
                  notes: registration.attendance.notes || '',
                }
              : undefined,
          };
        });
        setUsers(allAttendees);

        // Show success message for manual refresh
        if (showToast) {
          toast({
            title: 'Success',
            description: `Loaded ${allAttendees.length} pharmacies for attendance marking`,
          });
        }

        setHasInitialLoad(true);
        return true;
      } catch (error: unknown) {
        console.error('Error fetching event registrations:', error);
        if (page === 1) {
          // Only show error for initial load
          setUsers([]);

          // Try to extract more detailed error information
          let errorMessage = 'Failed to load registrations';
          const axiosError = error as {
            code?: string;
            message?: string;
            response?: {
              status?: number;
              data?: {
                message?: string;
                error?: string;
              };
            };
          };

          if (axiosError.response?.data?.message) {
            errorMessage += `: ${axiosError.response.data.message}`;
          } else if (axiosError.message) {
            errorMessage += `: ${axiosError.message}`;
          }

          console.error(errorMessage);

          toast({
            title: 'Warning',
            description:
              axiosError?.code === 'ECONNABORTED'
                ? 'The server took too long to respond. Try loading fewer records at a time.'
                : errorMessage,
            variant: 'warning',
          });
        }
        return false;
      } finally {
        if (page === 1) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [id, toast, hasInitialLoad]
  );

  const loadEventAndAttendees = useCallback(async () => {
    try {
      console.log(`Starting loadEventAndAttendees for event ID: ${id}`);
      setLoading(true);

      let eventLoaded = false;

      try {
        // First load the event details
        setLoadingStage('event');
        eventLoaded = await loadEventDetails();
        console.log(`Event details loaded: ${eventLoaded}`);
      } catch (error) {
        console.error('Failed to load event details:', error);
        toast({
          title: 'Warning',
          description:
            'Could not load event details. Please check your connection and try again.',
          variant: 'warning',
        });
        return;
      }

      if (eventLoaded) {
        // Then attempt to load registrations
        try {
          setLoadingStage('registrations');
          console.log('Loading registrations...');
          const registrationsLoaded = await loadRegistrations(1);
          console.log(`Registrations loaded: ${registrationsLoaded}`);

          // If we failed to load registrations but event loaded successfully
          if (!registrationsLoaded) {
            toast({
              title: 'Warning',
              description:
                'Failed to load all registrations. Some data may be incomplete.',
              variant: 'warning',
            });
          }
        } catch (error) {
          console.error('Failed to load registrations:', error);
          toast({
            title: 'Warning',
            description:
              'Failed to load registrations. Please try refreshing later.',
            variant: 'warning',
          });
        } finally {
          setLoadingStage('complete');
        }
      }
    } catch (error: unknown) {
      console.error('Failed to load event and attendees:', error);
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to load event details';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });

      navigate('/admin/events');
    } finally {
      // Always set loading to false to avoid infinite loading state
      setLoading(false);
      setLoadingMore(false);
    }
  }, [id, navigate, toast, loadEventDetails, loadRegistrations]);

  useEffect(() => {
    if (id) {
      loadEventAndAttendees();

      // Set up a timeout to force exit the loading state after 15 seconds
      // This prevents the UI from being stuck in loading state indefinitely
      const loadingTimeout = setTimeout(() => {
        console.log('Loading timeout reached - forcing exit of loading state');
        setLoading(false);

        // Show a message to the user
        toast({
          title: 'Loading timeout',
          description:
            'The loading process took too long. Showing partial data. Try refreshing for complete information.',
          variant: 'warning',
        });
      }, 15000);

      return () => clearTimeout(loadingTimeout);
    }
  }, [id]);

  const handleMarkAttendance = async () => {
    if (!selectedUser || !id) return;

    try {
      setMarkingAttendance(selectedUser._id);
      console.log(
        `Marking attendance for user/pharmacy: ${selectedUser._id} in event: ${id}`
      );

      // If the user doesn't have registration data but has pharmacy data,
      // we can still mark attendance using the pharmacy ID
      const attendanceData: AttendanceMarkingData = {
        userId: selectedUser._id,
        eventId: id,
        notes: attendanceNotes.trim() || undefined,
        // Include pharmacy info if available
        pharmacyId: selectedUser.pharmacy ? selectedUser._id : undefined,
        pharmacyName: selectedUser.pharmacy?.name,
        pharmacyRegNumber: selectedUser.pharmacy?.registrationNumber,
      };

      // Add a flag to indicate the user is present (required by backend)
      const attendanceWithPresence = {
        ...attendanceData,
        attended: true, // Make sure we're marking as present
      };

      console.log('Sending attendance data:', attendanceWithPresence);

      // Try to mark attendance
      // Import the retry utility to use for this API call
      const { postWithRetry } = await import('../../utils/apiRetryUtils');
      const response = await postWithRetry(
        `/events/${id}/attendance`,
        { attendanceList: [attendanceWithPresence] }, // Fix: Use attendanceList instead of attendees
        { timeout: 15000 }
      );
      console.log('Attendance marking response:', response);

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user._id === selectedUser._id
            ? {
                ...user,
                attendance: {
                  _id: 'new-attendance',
                  eventId: id,
                  userId: selectedUser._id,
                  attendedAt: new Date().toISOString(),
                  markedBy: 'current-admin', // Would come from auth context
                  notes: attendanceNotes.trim() || undefined,
                },
              }
            : user
        )
      );

      toast({
        title: 'Success',
        description: `Attendance marked for ${selectedUser.firstName} ${selectedUser.lastName}`,
      });

      setShowMarkDialog(false);
      setSelectedUser(null);
      setAttendanceNotes('');
    } catch (error: unknown) {
      console.error('Failed to mark attendance:', error);

      // Try to get more detailed error information
      let errorMessage = 'Failed to mark attendance';
      const axiosError = error as {
        response?: {
          data?: {
            message?: string;
            error?: string;
          };
          status?: number;
        };
        message?: string;
      };

      if (axiosError?.response?.data?.message) {
        errorMessage += `: ${axiosError.response.data.message}`;
      } else if (axiosError?.response?.data?.error) {
        errorMessage += `: ${axiosError.response.data.error}`;
      } else if (axiosError?.message) {
        errorMessage += `: ${axiosError.message}`;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      // Don't close the dialog on error so the user can try again
    } finally {
      setMarkingAttendance(null);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || currentPage >= totalPages) return;

    const nextPage = currentPage + 1;
    const success = await loadRegistrations(nextPage);
    if (success) {
      setCurrentPage(nextPage);
    }
  };

  const handleRefresh = async () => {
    await loadRegistrations(1, true);
  };

  const openMarkDialog = (user: AttendanceUser) => {
    setSelectedUser(user);
    setAttendanceNotes('');
    setShowMarkDialog(true);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canMarkAttendance = () => {
    // Always allow attendance marking regardless of event time
    return !!event; // Only require that the event exists
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      !searchTerm ||
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.pharmacy?.name &&
        user.pharmacy.name.toLowerCase().includes(searchLower)) ||
      (user.pharmacy?.registrationNumber &&
        user.pharmacy.registrationNumber.toLowerCase().includes(searchLower))
    );
  });

  // Fetch all members for attendance marking
  const loadAllMembers = useCallback(async () => {
    try {
      const response = await UserService.getUsers({ role: 'member', status: 'active' });
      return response.data;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load members',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  const handleBulkRegisterAll = async () => {
    setBulkRegistering(true);
    try {
      await EventService.bulkRegisterAllMembers(id as string);
      toast({ title: 'Success', description: 'All members registered for event.' });
      await loadRegistrations(1, true);
    } catch (error) {
      toast({ title: 'Error', description: 'Bulk registration failed.', variant: 'destructive' });
    } finally {
      setBulkRegistering(false);
    }
  };

  if (loading) {
    // Calculate progress based on loading stage
    let progress = 0;
    let stageDescription = '';

    switch (loadingStage) {
      case 'event':
        progress = 25;
        stageDescription = 'Loading event details from the server...';
        break;
      case 'registrations':
        progress = 50;
        stageDescription = 'Fetching attendance registrations...';
        break;
      case 'pharmacies':
        progress = 75;
        stageDescription =
          'Loading pharmacy data in smaller batches to prevent timeouts...';
        break;
      case 'complete':
        progress = 95;
        stageDescription = 'Processing data and preparing display...';
        break;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-xl font-medium text-gray-700">
              {loadingStage === 'event' && 'Loading event data...'}
              {loadingStage === 'registrations' &&
                'Loading event registrations...'}
              {loadingStage === 'pharmacies' && 'Loading pharmacy data...'}
              {loadingStage === 'complete' && 'Finalizing...'}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <p className="text-sm text-gray-600 mb-2">{stageDescription}</p>

          <p className="text-xs text-gray-500 mt-2 text-center">
            {loadingStage === 'pharmacies'
              ? 'This may take a moment as we optimize data loading to prevent timeouts. The system will display partial data if the full dataset cannot be loaded.'
              : "Please wait while we load the attendance data. If loading takes too long, you'll be able to see partial data."}
          </p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Event not found</p>
        <Button onClick={() => navigate('/admin/events')} className="mt-4">
          Back to Events
        </Button>
      </div>
    );
  }

  const attendedCount = users.filter((user) => user.attendance).length;
  const totalUsers = users.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
        <Button variant="outline" onClick={() => navigate('/admin/events')}>
          Back to Events
        </Button>
      </div>

      {/* Event Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {event.title}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || loadingMore}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{formatDateTime(event.startDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                {event.location.virtual ? 'Virtual Event' : event.location.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                {attendedCount} / {totalUsers} attended
              </span>
            </div>
          </div>

          {/* Notice about all pharmacies being displayed */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="font-medium">
                Showing all registered pharmacies. Attendance can be marked at
                any time.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search pharmacies by name, registration number, or superintendent..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Attendees Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Pharmacies</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? 'No pharmacies found matching your search'
                  : 'No pharmacies found in the system'}
              </p>

              {!searchTerm && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    No registered pharmacies were found in the system. Please
                    make sure pharmacies are properly registered.
                  </p>

                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={handleRefresh}
                      className="flex items-center"
                    >
                      <ClockIcon className="w-4 h-4 mr-2" />
                      Refresh Registrations
                    </Button>

                    <Button
                      onClick={() => navigate(`/admin/events/${id}`)}
                      className="flex items-center"
                    >
                      <UsersIcon className="w-4 h-4 mr-2" />
                      View Event Details
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Pharmacy</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{user.phone || 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        {user.pharmacy ? (
                          <div>
                            <div className="font-medium">
                              {user.pharmacy.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.pharmacy.registrationNumber}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">No pharmacy</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.registration ? (
                          <Badge className="bg-green-100 text-green-800">
                            Registered
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            Not Registered
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.attendance ? (
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                            <div>
                              <div className="text-sm font-medium text-green-600">
                                Present
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDateTime(user.attendance.attendedAt)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircleIcon className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-600">Absent</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {!user.attendance && canMarkAttendance() ? (
                          <Button
                            size="sm"
                            onClick={() => openMarkDialog(user)}
                            disabled={markingAttendance === user._id}
                          >
                            {markingAttendance === user._id ? (
                              <>
                                <ClockIcon className="w-4 h-4 mr-2 animate-spin" />
                                Marking...
                              </>
                            ) : (
                              'Mark Present'
                            )}
                          </Button>
                        ) : user.attendance ? (
                          <span className="text-sm text-green-600">Marked</span>
                        ) : (
                          <span className="text-sm text-gray-500">
                            {canMarkAttendance()
                              ? 'Available'
                              : 'Not available'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Load More Button */}
              {users.length > 0 && currentPage < totalPages && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="mx-auto"
                  >
                    {loadingMore ? (
                      <>
                        <ClockIcon className="w-4 h-4 mr-2 animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      `Load More (${users.length}/${
                        totalPages * ITEMS_PER_PAGE
                      })`
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mark Attendance Dialog */}
      <Dialog isOpen={showMarkDialog} onClose={() => setShowMarkDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>
              Mark attendance for {selectedUser?.firstName}{' '}
              {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">
                Notes (optional)
              </label>
              <Textarea
                id="notes"
                value={attendanceNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setAttendanceNotes(e.target.value)
                }
                placeholder="Add any notes about the attendance..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMarkDialog(false)}
              disabled={markingAttendance !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAttendance}
              disabled={markingAttendance !== null}
            >
              {markingAttendance ? 'Marking...' : 'Mark Present'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Register All Button */}
      <div className="mt-6 text-center">
        <Button
          variant="outline"
          onClick={handleBulkRegisterAll}
          disabled={bulkRegistering}
        >
          {bulkRegistering ? (
            <>
              <ClockIcon className="w-4 h-4 mr-2 animate-spin" />
              Registering...
            </>
          ) : (
            'Bulk Register All'
          )}
        </Button>
      </div>
    </div>
  );
};

export default AdminAttendanceMarking;
