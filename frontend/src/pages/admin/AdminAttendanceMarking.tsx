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
  EventAttendance,
  AttendanceMarkingData,
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
  attendance?: EventAttendance;
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

  const loadEventAndAttendees = useCallback(async () => {
    try {
      setLoading(true);

      // Check if ID is valid first
      if (!id || id === 'new') {
        navigate('/admin/events');
        toast({
          title: 'Error',
          description: 'Invalid event ID',
          variant: 'destructive',
        });
        return;
      }

      try {
        // Load event details
        const eventData = await EventService.getEventById(id);
        setEvent(eventData);
      } catch (error: any) {
        console.error('Error fetching event details:', error);
        if (error?.response?.status === 404) {
          navigate('/admin/events');
          toast({
            title: 'Error',
            description: 'Event not found',
            variant: 'destructive',
          });
          return;
        } else {
          throw error; // Re-throw to be caught by the outer catch
        }
      }

      try {
        // Load event registrations with attendance data
        const registrationsData = await EventService.getEventRegistrations(
          id,
          1,
          100
        );

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
                    registrationNumber:
                      user.pharmacy.registrationNumber || 'N/A',
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
                    eventId: id,
                    attendedAt: registration.attendance.checkedInAt,
                    markedBy: '',
                    notes: registration.attendance.notes || '',
                  }
                : undefined,
            };
          }
        );

        setUsers(attendeeUsers);

        // Show success message if this was a manual refresh (not the initial load)
        if (!loading) {
          toast({
            title: 'Success',
            description: `Loaded ${attendeeUsers.length} registered members for this event`,
          });
        }
      } catch (error) {
        console.error('Error fetching event registrations:', error);
        setUsers([]);
        toast({
          title: 'Warning',
          description:
            'Failed to load registrations. The event may not have any registrations yet.',
          variant: 'warning',
        });
      }
    } catch (error: any) {
      console.error('Failed to load event and attendees:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load event details',
        variant: 'destructive',
      });

      // Navigate back to events list if we can't load this event
      if (error?.code === 'ECONNABORTED') {
        toast({
          title: 'Connection Timeout',
          description:
            'The server took too long to respond. Please try again later.',
          variant: 'destructive',
        });
      }

      navigate('/admin/events');
    } finally {
      setLoading(false);
    }
  }, [id, toast, loading, navigate]);

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
    } catch (error) {
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

  const openMarkDialog = (user: AttendanceUser) => {
    setSelectedUser(user);
    setAttendanceNotes('');
    setShowMarkDialog(true);
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.pharmacy?.name.toLowerCase().includes(searchLower)
    );
  });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
            onClick={loadEventAndAttendees}
            disabled={loading}
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
