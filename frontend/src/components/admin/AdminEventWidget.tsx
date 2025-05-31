import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  CalendarToday,
  Event as EventIcon,
  Group,
  CheckCircle,
  Add,
  Edit,
  Visibility,
  ArrowForward,
  Refresh,
  Assessment,
} from '@mui/icons-material';
import { EventService } from '../../services/event.service';
import type { Event, EventStats } from '../../types/event.types';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  format,
  isToday,
  isTomorrow,
  isPast,
  isFuture,
  differenceInDays,
} from 'date-fns';

const AdminEventWidget: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [allEventsResponse, statsResponse] = await Promise.all([
        EventService.getAllEvents({}, 1, 20),
        EventService.getEventStats().catch(() => null),
      ]);

      const events = allEventsResponse.data;
      // Ensure stats has default values even if API returns null
      const statsData = statsResponse || {
        totalEvents: 0,
        upcomingEvents: 0,
        completedEvents: 0,
        totalRegistrations: 0,
        totalAttendees: 0,
        eventsByType: {
          conference: 0,
          workshop: 0,
          seminar: 0,
          training: 0,
          meetings: 0,
          state_events: 0,
          social: 0,
          other: 0,
        },
      };

      // Separate recent and upcoming events
      const recent = events
        .filter((event) => isPast(new Date(event.endDate)))
        .sort(
          (a, b) =>
            new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
        )
        .slice(0, 3);

      const upcoming = events
        .filter((event) => isFuture(new Date(event.startDate)))
        .sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        )
        .slice(0, 3);

      setRecentEvents(recent);
      setUpcomingEvents(upcoming);
      setStats(statsData);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load event data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?._id]);

  const getEventDate = (event: Event) => {
    const startDate = new Date(event.startDate);

    if (isToday(startDate)) return 'Today';
    if (isTomorrow(startDate)) return 'Tomorrow';

    const daysUntil = differenceInDays(startDate, new Date());
    if (daysUntil <= 7) return `In ${daysUntil} days`;

    return format(startDate, 'MMM dd');
  };

  const getStatusColor = (
    event: Event
  ): 'error' | 'warning' | 'default' | 'info' | 'success' => {
    if (event.status === 'cancelled') return 'error';
    if (event.status === 'draft') return 'warning';
    if (isPast(new Date(event.endDate))) return 'default';
    if (isPast(new Date(event.startDate))) return 'info';
    return 'success';
  };

  const getAttendanceRate = (event: Event) => {
    if (!event.registrations || !event.attendees) return 0;
    const registrations = event.registrations.filter(
      (r) => r.status === 'confirmed'
    ).length;
    const attendees = event.attendees.length; // EventAttendance entries indicate attendance
    return registrations > 0
      ? Math.round((attendees / registrations) * 100)
      : 0;
  };

  const handleCreateEvent = () => {
    navigate('/admin/events/create');
  };

  const handleViewAllEvents = () => {
    navigate('/admin/events');
  };

  const handleViewEvent = (eventId: string) => {
    navigate(`/admin/events/${eventId}`);
  };

  const handleEditEvent = (eventId: string) => {
    navigate(`/admin/events/${eventId}/edit`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
          >
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Stats Overview */}
      {stats && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 2,
          }}
        >
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {stats.totalEvents || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Events
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {stats.totalRegistrations || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Registrations
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {stats.totalAttendees || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Attendees
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {stats.upcomingEvents || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upcoming Events
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Upcoming Events */}
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
              <CalendarToday color="primary" />
              Upcoming Events
            </Typography>
            <Box>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={loadDashboardData}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Button
                size="small"
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateEvent}
                sx={{ mr: 1 }}
              >
                Create Event
              </Button>
              <Button
                size="small"
                endIcon={<ArrowForward />}
                onClick={handleViewAllEvents}
              >
                View All
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {upcomingEvents.length === 0 ? (
            <Box textAlign="center" py={3}>
              <Typography variant="body2" color="text.secondary">
                No upcoming events
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={handleCreateEvent}
                sx={{ mt: 1 }}
              >
                Create First Event
              </Button>
            </Box>
          ) : (
            <List disablePadding>
              {upcomingEvents.map((event, index) => (
                <React.Fragment key={event._id}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Avatar
                        sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
                      >
                        <EventIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="subtitle2" noWrap>
                            {event.title}
                          </Typography>
                          <Box display="flex" gap={1}>
                            <Chip
                              label={getEventDate(event)}
                              size="small"
                              color={
                                isToday(new Date(event.startDate)) ||
                                isTomorrow(new Date(event.startDate))
                                  ? 'error'
                                  : 'default'
                              }
                            />
                            <Chip
                              label={event.status}
                              size="small"
                              color={getStatusColor(event)}
                            />
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="caption">
                            {format(new Date(event.startDate), 'h:mm a')} •{' '}
                            {event.location.virtual
                              ? 'Virtual'
                              : event.location.name}
                          </Typography>
                          <Box display="flex" gap={1}>
                            <Tooltip title="View Event">
                              <IconButton
                                size="small"
                                onClick={() => handleViewEvent(event._id)}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Event">
                              <IconButton
                                size="small"
                                onClick={() => handleEditEvent(event._id)}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
              <CheckCircle color="success" />
              Recent Events
            </Typography>
            <Button
              size="small"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/admin/events?status=completed')}
            >
              View All
            </Button>
          </Box>

          {recentEvents.length === 0 ? (
            <Box textAlign="center" py={3}>
              <Typography variant="body2" color="text.secondary">
                No recent events
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {recentEvents.map((event, index) => {
                const attendanceRate = getAttendanceRate(event);
                return (
                  <React.Fragment key={event._id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      onClick={() => handleViewEvent(event._id)}
                      sx={{
                        px: 0,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'success.main',
                          }}
                        >
                          <CheckCircle />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography variant="subtitle2" noWrap>
                              {event.title}
                            </Typography>
                            <Box display="flex" gap={1}>
                              {attendanceRate > 0 && (
                                <Chip
                                  label={`${attendanceRate}% attendance`}
                                  size="small"
                                  color={
                                    attendanceRate >= 80
                                      ? 'success'
                                      : attendanceRate >= 60
                                      ? 'warning'
                                      : 'error'
                                  }
                                />
                              )}
                              <Chip
                                label={event.eventType}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption">
                            Completed on{' '}
                            {format(new Date(event.endDate), 'MMM dd, yyyy')} •{' '}
                            {event.registrations?.filter(
                              (r) => r.status === 'confirmed'
                            ).length || 0}{' '}
                            registrations
                          </Typography>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={handleCreateEvent}
            >
              Create Event
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EventIcon />}
              onClick={handleViewAllEvents}
            >
              Manage Events
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Group />}
              onClick={() => navigate('/admin/events/registrations')}
            >
              View Registrations
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Assessment />}
              onClick={() => navigate('/admin/events/analytics')}
            >
              Event Analytics
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default AdminEventWidget;
