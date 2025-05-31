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
} from '@mui/material';
import {
  CalendarToday,
  CheckCircle,
  Event as EventIcon,
  ArrowForward,
  Refresh,
} from '@mui/icons-material';
import { EventService } from '../../services/event.service';
import type {
  Event,
  EventRegistration,
  PenaltyInfo,
} from '../../types/event.types';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  format,
  isToday,
  isTomorrow,
  isFuture,
  differenceInDays,
} from 'date-fns';

const MemberEventWidget: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [penalties, setPenalties] = useState<PenaltyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [eventsResponse, registrationsResponse, penaltiesData] =
        await Promise.all([
          EventService.getAllEvents({ status: 'published' }, 1, 5),
          EventService.getUserRegistrations(undefined, 1, 10),
          EventService.getUserPenalties().catch(() => null), // Ignore errors for penalties
        ]);

      // Filter upcoming events
      const upcoming = eventsResponse.data
        .filter((event) => isFuture(new Date(event.startDate)))
        .slice(0, 3);

      setUpcomingEvents(upcoming);
      setRegistrations(registrationsResponse.data.slice(0, 5));
      if (penaltiesData) setPenalties(penaltiesData);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load event data');
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

  const getRegistrationStatus = (registration: EventRegistration) => {
    const statusColors: Record<
      string,
      | 'default'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning'
    > = {
      pending: 'warning',
      confirmed: 'success',
      waitlist: 'info',
      cancelled: 'error',
    };

    const statusLabels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      waitlist: 'Waitlist',
      cancelled: 'Cancelled',
    };

    return {
      color: statusColors[registration.status] || 'default',
      label:
        statusLabels[registration.status as keyof typeof statusLabels] ||
        registration.status,
    };
  };

  const handleViewAllEvents = () => {
    navigate('/member/events');
  };

  const handleViewEvent = (eventId: string) => {
    navigate(`/member/events/${eventId}`);
  };

  const handleViewRegistrations = () => {
    navigate('/member/events/my-registrations');
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
              <EventIcon color="primary" />
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
                onClick={handleViewAllEvents}
                sx={{ mt: 1 }}
              >
                Browse Events
              </Button>
            </Box>
          ) : (
            <List disablePadding>
              {upcomingEvents.map((event, index) => (
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
                        sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
                      >
                        <CalendarToday />
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
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {format(new Date(event.startDate), 'h:mm a')} •{' '}
                            {event.location.virtual
                              ? 'Virtual'
                              : event.location.name}
                          </Typography>
                          {event.requiresRegistration && (
                            <Typography variant="caption" color="primary">
                              Registration required
                            </Typography>
                          )}
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

      {/* My Registrations */}
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
              My Registrations
            </Typography>
            <Button
              size="small"
              endIcon={<ArrowForward />}
              onClick={handleViewRegistrations}
            >
              View All
            </Button>
          </Box>

          {registrations.length === 0 ? (
            <Box textAlign="center" py={3}>
              <Typography variant="body2" color="text.secondary">
                No event registrations yet
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleViewAllEvents}
                sx={{ mt: 1 }}
              >
                Find Events
              </Button>
            </Box>
          ) : (
            <List disablePadding>
              {registrations.slice(0, 3).map((registration, index) => {
                const status = getRegistrationStatus(registration);
                return (
                  <React.Fragment key={registration._id}>
                    {index > 0 && <Divider />}
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: `${status.color}.main`,
                          }}
                        >
                          <EventIcon fontSize="small" />
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
                              Event Registration
                            </Typography>
                            <Chip
                              label={status.label}
                              size="small"
                              color={status.color}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption">
                            {registration.registrationDate
                              ? `Registered on ${format(
                                  new Date(registration.registrationDate),
                                  'MMM dd, yyyy'
                                )}`
                              : 'Registration date not available'}
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

      {/* Penalties Warning */}
      {penalties && penalties.totalPenalty && penalties.totalPenalty > 0 && (
        <Card>
          <CardContent>
            <Alert severity="warning">
              <Typography variant="subtitle2" gutterBottom>
                Meeting Attendance Penalties
              </Typography>
              <Typography variant="body2">
                You have ₦{penalties.totalPenalty.toLocaleString()} in meeting
                attendance penalties for {penalties.year}.
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                {penalties.missedMeetings} missed meetings •{' '}
                {penalties.meetingsAttended} attended
              </Typography>
              <Button
                size="small"
                variant="outlined"
                sx={{ mt: 1 }}
                onClick={() => navigate('/member/penalties')}
              >
                View Details
              </Button>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              startIcon={<EventIcon />}
              onClick={handleViewAllEvents}
            >
              Browse Events
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CalendarToday />}
              onClick={() => navigate('/member/events/calendar')}
            >
              Event Calendar
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CheckCircle />}
              onClick={() => navigate('/member/events/history')}
            >
              Event History
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default MemberEventWidget;
