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
import * as financialService from '../../services/financial.service';
import type { Pharmacy } from '../../types/pharmacy.types';

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

  const loadEventDetails = async () => {
    try {
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

      // Load event details
      const eventData = await EventService.getEventById(id);
      setEvent(eventData);
      return true;
    } catch (error: unknown) {
      console.error('Error fetching event details:', error);
      const axiosError = error as { response?: { status?: number } };
      if (axiosError?.response?.status === 404) {
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
  };

  const loadRegistrations = async (page: number, showToast = false) => {
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

      // First, load all pharmacies regardless of registration status
      const pharmacies = await loadAllPharmacies();

      // Then load event registrations with attendance data with retry mechanism
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

      // Create attendance users from registrations first
      const registeredUsers: AttendanceUser[] = populatedRegistrations.map(
        (registration) => {
          const user = registration.userId;
          if (!user || typeof user !== 'object') {
            console.error('Invalid user data in registration:', registration);
            // Create a placeholder user if data is missing
            return {
              _id:
                typeof registration.userId === 'string'
                  ? registration.userId
                  : 'unknown',
              firstName: 'Unknown',
              lastName: 'User',
              email: 'missing@email.com',
              registration: {
                ...registration,
                userId:
                  typeof registration.userId === 'string'
                    ? registration.userId
                    : 'unknown',
              },
            };
          }

          return {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phoneNumber,
            pharmacy: user.pharmacy
              ? {
                  name: user.pharmacy.name || 'N/A',
                  registrationNumber: user.pharmacy.registrationNumber || 'N/A',
                }
              : undefined,
            registration: {
              ...registration,
              userId: user._id, // Convert back to string ID for the registration object
            },
            attendance: registration.attendance
              ? {
                  _id: registration._id, // Using registration ID as attendance ID
                  userId: user._id,
                  eventId: id as string, // Force as string since we know it's valid
                  attendedAt: registration.attendance.checkedInAt,
                  markedBy: '',
                  notes: registration.attendance.notes || '',
                }
              : undefined,
          };
        }
      );

      // Now convert all pharmacies to attendance users
      const allAttendees: AttendanceUser[] = pharmacies.map((pharmacy) =>
        convertPharmacyToAttendanceUser(pharmacy, registeredUsers)
      );

      // Update users with all pharmacies
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
  };

  // Load all pharmacies from the system
  const loadAllPharmacies = async () => {
    try {
      console.log('Loading all pharmacies from the system');
      const pharmacies = await financialService.getAllPharmacies();
      console.log(`Fetched ${pharmacies.length} pharmacies`);
      return pharmacies;
    } catch (error) {
      console.error('Error fetching all pharmacies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pharmacies',
        variant: 'destructive',
      });
      return [];
    }
  };

  // Convert pharmacy data to attendance user format
  const convertPharmacyToAttendanceUser = (
    pharmacy: Pharmacy,
    existingUsers: AttendanceUser[] = []
  ): AttendanceUser => {
    // Check if this pharmacy already exists in users (has registered for event)
    const existingUser = existingUsers.find(
      (user) =>
        user.pharmacy?.registrationNumber === pharmacy.registrationNumber
    );

    if (existingUser) {
      return existingUser;
    }

    // Create a new attendance user from pharmacy data
    return {
      _id: pharmacy._id, // Use pharmacy ID as user ID for non-registered pharmacies
      firstName: pharmacy.superintendentName?.split(' ')[0] || '',
      lastName:
        pharmacy.superintendentName?.split(' ').slice(1).join(' ') || '',
      email: pharmacy.email || '',
      phone: pharmacy.phone || '',
      pharmacy: {
        name: pharmacy.name || pharmacy.businessName || '',
        registrationNumber: pharmacy.registrationNumber || '',
      },
      // No registration or attendance data
    };
  };

  const loadEventAndAttendees = useCallback(async () => {
    try {
      console.log(`Starting loadEventAndAttendees for event ID: ${id}`);
      setLoading(true);

      // First load the event details
      const eventLoaded = await loadEventDetails();
      console.log(`Event details loaded: ${eventLoaded}`);

      if (eventLoaded) {
        // Then attempt to load registrations
        console.log('Loading registrations...');
        const registrationsLoaded = await loadRegistrations(1);
        console.log(`Registrations loaded: ${registrationsLoaded}`);

        // If we failed to load registrations but event loaded successfully
        // We should still show the UI rather than infinite loading
        if (!registrationsLoaded) {
          toast({
            title: 'Warning',
            description:
              'Failed to load registrations. The list may be empty or there might be a server issue.',
            variant: 'warning',
          });
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
        if (loading) {
          console.log(
            'Loading timeout reached - forcing exit of loading state'
          );
          setLoading(false);

          // Show a message to the user
          toast({
            title: 'Loading timeout',
            description:
              'The loading process took too long. Please try refreshing the data.',
            variant: 'warning',
          });
        }
      }, 15000);

      return () => clearTimeout(loadingTimeout);
    }
  }, [id, loadEventAndAttendees, loading, toast]);

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
      const response = await EventService.markAttendance(id, [
        attendanceWithPresence,
      ]);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading event data and registrations...</p>
        <p className="text-sm text-gray-500 mt-2">
          This may take a moment for events with many registrations
        </p>
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
    </div>
  );
};

export default AdminAttendanceMarking;
