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

  const handlePublishEvent = async (eventId: string, eventTitle: string) => {
    try {
      await eventService.publishEvent(eventId);
      toast({
        title: 'Success',
        description: `"${eventTitle}" has been published successfully`,
      });
      loadEvents();
    } catch (error: unknown) {
      console.error('Failed to publish event:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish the event',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEvent = async (eventId: string, eventTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to cancel "${eventTitle}"? This will notify all registered attendees.`
      )
    ) {
      return;
    }

    try {
      await eventService.cancelEvent(eventId);
      toast({
        title: 'Success',
        description: `"${eventTitle}" has been cancelled`,
      });
      loadEvents();
    } catch (error: unknown) {
      console.error('Failed to cancel event:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel the event',
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Events</CardTitle>
          <div className="text-sm text-gray-500">
            {events.length} event{events.length !== 1 && 's'} found
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-gray-500">No events found</p>
              {!searchTerm && !selectedType && !selectedStatus ? (
                <Button
                  onClick={() => navigate('/admin/events/create')}
                  className="mt-4 flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create First Event
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Location
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Registration
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow
                      key={event._id}
                      className="relative hover:bg-gray-50"
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {event.description?.length > 60
                              ? `${event.description.substring(0, 60)}...`
                              : event.description}
                          </div>
                          {/* Mobile-only type badge */}
                          <div className="md:hidden mt-1">
                            <Badge
                              className={getEventTypeColor(event.eventType)}
                            >
                              {eventTypeLabels[event.eventType]}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
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
                      <TableCell className="hidden md:table-cell">
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
                        <div className="flex flex-col gap-2">
                          <Badge className={statusColors[event.status]}>
                            {event.status.charAt(0).toUpperCase() +
                              event.status.slice(1)}
                          </Badge>

                          {event.status === 'draft' && (
                            <button
                              onClick={() =>
                                handlePublishEvent(event._id, event.title)
                              }
                              className="text-xs font-medium text-green-600 hover:text-green-800 flex items-center"
                            >
                              <svg
                                className="w-3 h-3 mr-1"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 19V5" />
                                <path d="M5 12l7-7 7 7" />
                              </svg>
                              Publish
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          {event.requiresRegistration ? (
                            <>
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                <span>Required</span>
                              </div>
                              {event.registrationFee ? (
                                <div className="text-gray-500 mt-1">
                                  ₦{event.registrationFee.toLocaleString()}
                                </div>
                              ) : (
                                <div className="text-gray-500 mt-1">Free</div>
                              )}
                              {event.capacity && (
                                <div className="text-gray-500 mt-1 flex items-center">
                                  <UsersIcon className="w-3 h-3 mr-1" />
                                  <span>Max: {event.capacity}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center text-gray-500">
                              <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                              <span>Not required</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="hidden md:inline-flex"
                            onClick={() =>
                              navigate(`/admin/events/${event._id}`)
                            }
                          >
                            <EyeIcon className="w-4 h-4" />
                            <span className="sr-only md:not-sr-only md:ml-2">
                              View
                            </span>
                          </Button>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full hover:bg-gray-100 transition-colors duration-200"
                              >
                                <MoreVerticalIcon className="w-4 h-4" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownContent
                              align="end"
                              className="w-52 p-1 shadow-lg border border-gray-100 rounded-lg"
                            >
                              {/* View & Edit Actions - Primary actions */}
                              <div className="space-y-0.5 mb-1">
                                <DropdownItem
                                  onClick={() =>
                                    navigate(`/admin/events/${event._id}`)
                                  }
                                  className="flex items-center px-3 py-2 hover:bg-blue-50 rounded-md transition-colors duration-150"
                                >
                                  <EyeIcon className="w-4 h-4 mr-2 text-blue-600" />
                                  <span className="font-medium">
                                    View Details
                                  </span>
                                </DropdownItem>
                                <DropdownItem
                                  onClick={() =>
                                    navigate(`/admin/events/${event._id}/edit`)
                                  }
                                  className="flex items-center px-3 py-2 hover:bg-blue-50 rounded-md transition-colors duration-150"
                                >
                                  <EditIcon className="w-4 h-4 mr-2 text-blue-600" />
                                  <span className="font-medium">
                                    Edit Event
                                  </span>
                                </DropdownItem>
                              </div>

                              {/* Status Actions - Contextual */}
                              {(event.status === 'draft' ||
                                event.status === 'published') && (
                                <div className="pt-1 pb-1 border-t border-gray-100">
                                  {event.status === 'draft' && (
                                    <DropdownItem
                                      onClick={() =>
                                        handlePublishEvent(
                                          event._id,
                                          event.title
                                        )
                                      }
                                      className="flex items-center px-3 py-2 hover:bg-green-50 rounded-md transition-colors duration-150"
                                    >
                                      <svg
                                        className="w-4 h-4 mr-2 text-green-600"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M12 19V5" />
                                        <path d="M5 12l7-7 7 7" />
                                      </svg>
                                      <span className="text-green-600 font-medium">
                                        Publish Event
                                      </span>
                                    </DropdownItem>
                                  )}
                                  {event.status === 'published' && (
                                    <DropdownItem
                                      onClick={() =>
                                        handleCancelEvent(
                                          event._id,
                                          event.title
                                        )
                                      }
                                      className="flex items-center px-3 py-2 hover:bg-amber-50 rounded-md transition-colors duration-150"
                                    >
                                      <svg
                                        className="w-4 h-4 mr-2 text-amber-600"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                      </svg>
                                      <span className="text-amber-600 font-medium">
                                        Cancel Event
                                      </span>
                                    </DropdownItem>
                                  )}
                                </div>
                              )}

                              {/* Management Actions */}
                              <div className="pt-1 pb-1 border-t border-gray-100">
                                <DropdownItem
                                  onClick={() => {
                                    navigate(`/admin/events/${event._id}`);
                                    localStorage.setItem(
                                      'activeEventTab',
                                      'attendees'
                                    );
                                  }}
                                  className="flex items-center px-3 py-2 hover:bg-gray-50 rounded-md transition-colors duration-150"
                                >
                                  <UsersIcon className="w-4 h-4 mr-2 text-gray-600" />
                                  <span className="font-medium">
                                    Manage Attendees
                                  </span>
                                </DropdownItem>
                                <DropdownItem
                                  onClick={() =>
                                    navigate(
                                      `/admin/events/${event._id}/attendance`
                                    )
                                  }
                                  className="flex items-center px-3 py-2 hover:bg-gray-50 rounded-md transition-colors duration-150"
                                >
                                  <ClipboardListIcon className="w-4 h-4 mr-2 text-gray-600" />
                                  <span className="font-medium">
                                    Mark Attendance
                                  </span>
                                </DropdownItem>
                              </div>

                              {/* Destructive Actions */}
                              <div className="pt-1 border-t border-gray-100">
                                <DropdownItem
                                  onClick={() =>
                                    handleDeleteEvent(event._id, event.title)
                                  }
                                  className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors duration-150"
                                >
                                  <TrashIcon className="w-4 h-4 mr-2" />
                                  <span className="font-medium">
                                    Delete Event
                                  </span>
                                </DropdownItem>
                              </div>
                            </DropdownContent>
                          </Dropdown>
                        </div>
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
