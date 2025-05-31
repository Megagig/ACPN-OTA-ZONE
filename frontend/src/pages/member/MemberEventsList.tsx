import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  CircularProgress,
  Alert,
  Stack,
  Avatar,
  CardMedia,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CalendarToday,
  LocationOn,
  Person,
  AttachMoney,
  CheckCircle,
  Cancel,
  Info,
  Favorite,
  FavoriteBorder,
  Share,
} from '@mui/icons-material';
import { EventService } from '../../services/event.service';
import type {
  Event,
  EventType,
  EventStatus,
  EventFilters,
} from '../../types/event.types';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { format, isPast, isFuture } from 'date-fns';

const eventTypeLabels: Record<EventType, string> = {
  conference: 'Conference',
  workshop: 'Workshop',
  seminar: 'Seminar',
  training: 'Training',
  meetings: 'Meeting',
  state_events: 'State Event',
  social: 'Social',
  other: 'Other',
};

const eventTypeColors: Record<
  EventType,
  'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
> = {
  conference: 'primary',
  workshop: 'info',
  seminar: 'secondary',
  training: 'success',
  meetings: 'error',
  state_events: 'warning',
  social: 'primary',
  other: 'secondary',
};

const MemberEventsList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<EventFilters>({
    status: 'published',
  });

  const [searchTerm, setSearchTerm] = useState('');

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchFilters: EventFilters = {
        ...filters,
        search: searchTerm || undefined,
      };

      const response = await EventService.getAllEvents(searchFilters, page, 12);
      setEvents(response.data);
      setTotalPages(response.totalPages);
      setTotalEvents(response.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [page, filters, searchTerm]);

  const handleFilterChange = (field: keyof EventFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleViewEvent = (eventId: string) => {
    navigate(`/member/events/${eventId}`);
  };

  const handleRegister = (eventId: string) => {
    navigate(`/member/events/${eventId}/register`);
  };

  const toggleFavorite = (eventId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(eventId)) {
        newFavorites.delete(eventId);
      } else {
        newFavorites.add(eventId);
      }
      return newFavorites;
    });
  };

  const getEventStatus = (event: Event) => {
    if (event.status === 'cancelled') return 'Cancelled';
    if (isPast(new Date(event.endDate))) return 'Completed';
    if (isPast(new Date(event.startDate))) return 'Ongoing';
    return 'Upcoming';
  };

  const getStatusColor = (event: Event) => {
    if (event.status === 'cancelled') return 'error';
    if (isPast(new Date(event.endDate))) return 'default';
    if (isPast(new Date(event.startDate))) return 'warning';
    return 'success';
  };

  const canRegister = (event: Event) => {
    if (!event.requiresRegistration) return false;
    if (event.status !== 'published') return false;
    if (
      event.registrationDeadline &&
      isPast(new Date(event.registrationDeadline))
    )
      return false;
    if (isPast(new Date(event.startDate))) return false;
    return true;
  };

  const isRegistrationFull = (event: Event) => {
    if (!event.capacity) return false;
    const registeredCount =
      event.registrations?.filter((r) => r.status === 'confirmed').length || 0;
    return registeredCount >= event.capacity;
  };

  if (loading && events.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Events
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover and register for upcoming events
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search events..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={filters.eventType || ''}
                  onChange={(e) =>
                    handleFilterChange('eventType', e.target.value)
                  }
                  label="Event Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {Object.entries(eventTypeLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.dateRange || ''}
                  onChange={(e) =>
                    handleFilterChange('dateRange', e.target.value)
                  }
                  label="Date Range"
                >
                  <MenuItem value="">All Dates</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="this-month">This Month</MenuItem>
                  <MenuItem value="next-month">Next Month</MenuItem>
                  <MenuItem value="past">Past Events</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Registration</InputLabel>
                <Select
                  value={filters.requiresRegistration?.toString() || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'requiresRegistration',
                      e.target.value === 'true'
                    )
                  }
                  label="Registration"
                >
                  <MenuItem value="">All Events</MenuItem>
                  <MenuItem value="true">Registration Required</MenuItem>
                  <MenuItem value="false">No Registration</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Events Grid */}
      <Grid container spacing={3}>
        {events.map((event) => (
          <Grid item xs={12} md={6} lg={4} key={event._id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              {/* Event Image */}
              {event.imageUrl && (
                <CardMedia
                  component="img"
                  height="200"
                  image={event.imageUrl}
                  alt={event.title}
                />
              )}

              <CardContent
                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
              >
                {/* Header */}
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  mb={2}
                >
                  <Box flexGrow={1}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {event.title}
                    </Typography>
                    <Box display="flex" gap={1} mb={1}>
                      <Chip
                        label={eventTypeLabels[event.eventType]}
                        color={eventTypeColors[event.eventType]}
                        size="small"
                      />
                      <Chip
                        label={getEventStatus(event)}
                        color={getStatusColor(event) as any}
                        size="small"
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Tooltip
                      title={
                        favorites.has(event._id)
                          ? 'Remove from favorites'
                          : 'Add to favorites'
                      }
                    >
                      <IconButton
                        size="small"
                        onClick={() => toggleFavorite(event._id)}
                        color={favorites.has(event._id) ? 'error' : 'default'}
                      >
                        {favorites.has(event._id) ? (
                          <Favorite />
                        ) : (
                          <FavoriteBorder />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Share event">
                      <IconButton size="small">
                        <Share />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Description */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {event.description}
                </Typography>

                {/* Event Details */}
                <Stack spacing={1} mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarToday fontSize="small" color="action" />
                    <Typography variant="body2">
                      {format(
                        new Date(event.startDate),
                        'MMM dd, yyyy • h:mm a'
                      )}
                      {event.startDate !== event.endDate && (
                        <>
                          {' '}
                          -{' '}
                          {format(
                            new Date(event.endDate),
                            'MMM dd, yyyy • h:mm a'
                          )}
                        </>
                      )}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2">
                      {event.location.virtual
                        ? 'Virtual Event'
                        : `${event.location.name}, ${event.location.city}`}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    <Person fontSize="small" color="action" />
                    <Typography variant="body2">{event.organizer}</Typography>
                  </Box>

                  {event.registrationFee && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <AttachMoney fontSize="small" color="action" />
                      <Typography variant="body2">
                        ₦{event.registrationFee.toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                </Stack>

                {/* Registration Info */}
                {event.requiresRegistration && (
                  <Box mb={2}>
                    {isRegistrationFull(event) && (
                      <Alert severity="warning" size="small">
                        Registration full
                      </Alert>
                    )}
                    {event.registrationDeadline &&
                      isFuture(new Date(event.registrationDeadline)) && (
                        <Typography variant="caption" color="text.secondary">
                          Registration ends:{' '}
                          {format(
                            new Date(event.registrationDeadline),
                            'MMM dd, yyyy'
                          )}
                        </Typography>
                      )}
                  </Box>
                )}

                {/* Actions */}
                <Box mt="auto" display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleViewEvent(event._id)}
                    startIcon={<Info />}
                    fullWidth
                  >
                    View Details
                  </Button>
                  {canRegister(event) && !isRegistrationFull(event) && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleRegister(event._id)}
                      startIcon={<CheckCircle />}
                      fullWidth
                    >
                      Register
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {!loading && events.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No events found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search filters
          </Typography>
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Loading Overlay */}
      {loading && events.length > 0 && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgcolor="rgba(255, 255, 255, 0.7)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default MemberEventsList;
