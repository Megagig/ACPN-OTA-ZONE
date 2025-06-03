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
  AlertTriangleIcon,
} from 'lucide-react';
import { EventService } from '../../services/event.service';
import { useToast } from '../../hooks/useToast';
import type {
  Event,
  EventRegistration,
  AttendanceMarkingData,
  PaginatedResponse,
} from '../../types/event.types';

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

      // Load event registrations with attendance data with retry mechanism
      const fetchRegistrations = async (
        retryCount = 0
      ): Promise<PaginatedResponse<EventRegistration>> => {
        try {
          return await EventService.getEventRegistrations(
            id as string,
            page,
            ITEMS_PER_PAGE
          );
        } catch (error: unknown) {
          const axiosError = error as { code?: string };
          if (axiosError?.code === 'ECONNABORTED' && retryCount < 3) {
            // Wait 2 seconds before retrying
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return fetchRegistrations(retryCount + 1);
          }
          throw error;
        }
      };

      const registrationsData = await fetchRegistrations();

      // Update pagination info
      setTotalPages(registrationsData.totalPages || 1);

      // Transform registration data to match our component's expected format
      const populatedRegistrations =
        registrationsData.data as unknown as PopulatedRegistration[];

      const attendeeUsers: AttendanceUser[] = populatedRegistrations.map(
        (registration) => {
          const user = registration.userId;
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

      // Update users based on page
      if (page === 1) {
        setUsers(attendeeUsers);
      } else {
        setUsers((prev) => [...prev, ...attendeeUsers]);
      }

      // Show success message for manual refresh
      if (showToast) {
        toast({
          title: 'Success',
          description: `Loaded ${attendeeUsers.length} registered members for this event`,
        });
      }

      setHasInitialLoad(true);
      return true;
    } catch (error: unknown) {
      console.error('Error fetching event registrations:', error);
      if (page === 1) {
        // Only show error for initial load
        setUsers([]);

        const axiosError = error as { code?: string };
        toast({
          title: 'Warning',
          description:
            axiosError?.code === 'ECONNABORTED'
              ? 'The server took too long to respond. Try loading fewer records at a time.'
              : 'Failed to load registrations. The event may not have any registrations yet.',
          variant: 'warning',
        });
      }
      return false;
    }
  };

  const loadEventAndAttendees = useCallback(async () => {
    try {
      setLoading(true);
      const eventLoaded = await loadEventDetails();
      if (eventLoaded) {
        await loadRegistrations(1);
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
      setLoading(false);
      setLoadingMore(false);
    }
  }, [navigate, toast, loadEventDetails, loadRegistrations]);

  useEffect(() => {
    if (id) {
      loadEventAndAttendees();
    }
  }, [id, loadEventAndAttendees]);

  const handleMarkAttendance = async () => {
    if (!selectedUser || !id) return;

    try {
      setMarkingAttendance(selectedUser._id);

      const attendanceData: AttendanceMarkingData = {
        userId: selectedUser._id,
        eventId: id,
        notes: attendanceNotes.trim() || undefined,
      };

      await EventService.markAttendance(id, [attendanceData]);

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
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive',
      });
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

  const isEventActive = () => {
    if (!event) return false;
    const now = new Date();
    const startTime = new Date(event.startDate);
    const endTime = new Date(event.endDate);
    return now >= startTime && now <= endTime;
  };

  const canMarkAttendance = () => {
    if (!event) return false;

    // For meetings, only allow during event time
    if (event.eventType === 'meetings') {
      return isEventActive();
    }

    // For other events, allow from start time onwards
    const now = new Date();
    const startTime = new Date(event.startDate);
    return now >= startTime;
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.pharmacy?.name &&
        user.pharmacy.name.toLowerCase().includes(searchLower))
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

          {/* Attendance Status Alert */}
          {!canMarkAttendance() && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangleIcon className="w-5 h-5" />
                <span className="font-medium">
                  {event.eventType === 'meetings'
                    ? 'Attendance can only be marked during the meeting time'
                    : 'Attendance marking will be available when the event starts'}
                </span>
              </div>
            </div>
          )}

          {isEventActive() && event.eventType === 'meetings' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircleIcon className="w-5 h-5" />
                <span className="font-medium">
                  Meeting is currently active - attendance marking is available
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users by name, email, or pharmacy..."
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
          <CardTitle>Registered Members</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm
                  ? 'No users found matching your search'
                  : 'No registered users found'}
              </p>
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
