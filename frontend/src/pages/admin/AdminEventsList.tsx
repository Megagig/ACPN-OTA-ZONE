import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/shadcn/button';
import { Input } from '../../components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/shadcn/select';
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
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from '../../components/shadcn/dropdown';
import {
  PlusIcon,
  SearchIcon,
  FilterIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  UsersIcon,
  ClipboardListIcon,
  EyeIcon,
} from 'lucide-react';
import eventService from '../../services/event.service';
import { useToast } from '../../hooks/useToast';
import type {
  Event,
  EventType,
  EventStatus,
  EventFilters,
} from '../../types/event.types';

const eventTypeLabels: Record<EventType, string> = {
  conference: 'Conference',
  workshop: 'Workshop',
  seminar: 'Seminar',
  training: 'Training',
  meetings: 'Meeting',
  state_events: 'State Event',
  social: 'Social Event',
  other: 'Other',
};

const statusColors: Record<EventStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

const AdminEventsList: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const filters: EventFilters = {};

      if (searchTerm) filters.search = searchTerm;
      if (selectedType) filters.eventType = selectedType as EventType;
      if (selectedStatus) filters.status = selectedStatus as EventStatus;

      const response = await eventService.getAllEvents(
        filters,
        currentPage,
        20
      );
      setEvents(response.data);
      setTotalPages(response.totalPages);
    } catch (error: unknown) {
      console.error('Failed to load events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedType, selectedStatus, toast]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await eventService.deleteEvent(eventId);
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });
      loadEvents();
    } catch (error: unknown) {
      console.error('Failed to delete event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventTypeColor = (type: EventType) => {
    const colors = {
      conference: 'bg-purple-100 text-purple-800',
      workshop: 'bg-blue-100 text-blue-800',
      seminar: 'bg-indigo-100 text-indigo-800',
      training: 'bg-orange-100 text-orange-800',
      meetings: 'bg-red-100 text-red-800',
      state_events: 'bg-green-100 text-green-800',
      social: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.other;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
        <Button
          onClick={() => navigate('/admin/events/create')}
          className="flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                className="pl-10"
              />
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {Object.entries(eventTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={resetFilters} className="w-full">
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No events found</p>
              <Button
                onClick={() => navigate('/admin/events/create')}
                className="mt-4"
              >
                Create First Event
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {event.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEventTypeColor(event.eventType)}>
                          {eventTypeLabels[event.eventType]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {formatDate(event.startDate)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTime(event.startDate)} -{' '}
                            {formatTime(event.endDate)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {event.location.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {event.location.virtual
                              ? 'Virtual'
                              : `${event.location.city}, ${event.location.state}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[event.status]}>
                          {event.status.charAt(0).toUpperCase() +
                            event.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {event.requiresRegistration ? (
                            <>
                              <div>Required</div>
                              {event.registrationFee && (
                                <div className="text-gray-500">
                                  ₦{event.registrationFee.toLocaleString()}
                                </div>
                              )}
                              {event.capacity && (
                                <div className="text-gray-500">
                                  Max: {event.capacity}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-gray-500">Not required</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button variant="ghost" size="sm">
                              <MoreVerticalIcon className="w-4 h-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownContent align="end">
                            <DropdownItem
                              onClick={() =>
                                navigate(`/admin/events/${event._id}`)
                              }
                            >
                              <EyeIcon className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownItem>
                            <DropdownItem
                              onClick={() =>
                                navigate(`/admin/events/${event._id}/edit`)
                              }
                            >
                              <EditIcon className="w-4 h-4 mr-2" />
                              Edit Event
                            </DropdownItem>
                            <DropdownItem
                              onClick={() => {
                                // Navigate to event detail with attendees tab active
                                navigate(`/admin/events/${event._id}`);
                                // We'll use an approach to activate the attendees tab via URL param
                                // For now we'll add this to localStorage and handle in the detail component
                                localStorage.setItem(
                                  'activeEventTab',
                                  'attendees'
                                );
                              }}
                            >
                              <UsersIcon className="w-4 h-4 mr-2" />
                              Manage Attendees
                            </DropdownItem>
                            <DropdownItem
                              onClick={() =>
                                navigate(
                                  `/admin/events/${event._id}/attendance`
                                )
                              }
                            >
                              <ClipboardListIcon className="w-4 h-4 mr-2" />
                              Mark Attendance
                            </DropdownItem>
                            <DropdownItem
                              onClick={() =>
                                handleDeleteEvent(event._id, event.title)
                              }
                              className="text-red-600"
                            >
                              <TrashIcon className="w-4 h-4 mr-2" />
                              Delete Event
                            </DropdownItem>
                          </DropdownContent>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEventsList;
