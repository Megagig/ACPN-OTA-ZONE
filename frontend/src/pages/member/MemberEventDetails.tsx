import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
  CardMedia,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LocationOn,
  CheckCircle,
  Info,
  Share,
  Schedule,
  ArrowBack,
  Favorite,
  FavoriteBorder,
} from '@mui/icons-material';
import { EventService } from '../../services/event.service';
import type {
  Event,
  EventType,
  EventRegistration,
} from '../../types/event.types';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { format, isPast } from 'date-fns';

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

const MemberEventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [userRegistration, setUserRegistration] =
    useState<EventRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [favorite, setFavorite] = useState(false);

  const loadEventDetails = useCallback(async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError(null);

      const [eventData, registrations] = await Promise.all([
        EventService.getEventById(eventId),
        EventService.getUserRegistrations(user?._id, 1, 100),
      ]);

      setEvent(eventData);

      // Find user's registration for this event
      const userReg = registrations.data.find((reg) => reg.eventId === eventId);
      setUserRegistration(userReg || null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [eventId, user?._id]);

  useEffect(() => {
    loadEventDetails();
  }, [loadEventDetails]);

  const handleRegister = async () => {
    if (!event || !user) return;

    try {
      setRegistering(true);

      const registrationData = {
        eventId: event._id,
        notes: '',
      };

      const registration = await EventService.registerForEvent(
        event._id,
        registrationData
      );
      setUserRegistration(registration);
      setShowRegisterDialog(false);

      // Reload event to get updated registration count
      loadEventDetails();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to register for event');
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!event) return;

    try {
      setRegistering(true);
      await EventService.unregisterFromEvent(event._id);
      setUserRegistration(null);

      // Reload event to get updated registration count
      loadEventDetails();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message || 'Failed to unregister from event'
      );
    } finally {
      setRegistering(false);
    }
  };

  const toggleFavorite = () => {
    setFavorite(!favorite);
    // TODO: Implement favorite API call
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: event?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  };

  const getEventStatus = () => {
    if (!event) return '';
    if (event.status === 'cancelled') return 'Cancelled';
    if (isPast(new Date(event.endDate))) return 'Completed';
    if (isPast(new Date(event.startDate))) return 'Ongoing';
    return 'Upcoming';
  };

  const getStatusColor = ():
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning' => {
    if (!event) return 'default';
    if (event.status === 'cancelled') return 'error';
    if (isPast(new Date(event.endDate))) return 'default';
    if (isPast(new Date(event.startDate))) return 'warning';
    return 'success';
  };

  const canRegister = () => {
    if (!event || !user) return false;
    if (!event.requiresRegistration) return false;
    if (event.status !== 'published') return false;
    if (userRegistration) return false;
    if (
      event.registrationDeadline &&
      isPast(new Date(event.registrationDeadline))
    )
      return false;
    if (isPast(new Date(event.startDate))) return false;
    return true;
  };

  const isRegistrationFull = () => {
    if (!event || !event.capacity) return false;
    const registeredCount =
      event.registrations?.filter((r) => r.status === 'confirmed').length || 0;
    return registeredCount >= event.capacity;
  };

  const getRegistrationStatus = () => {
    if (!userRegistration) return null;

    const statusLabels = {
      pending: 'Registration Pending',
      confirmed: 'Registered',
      waitlist: 'On Waitlist',
      cancelled: 'Registration Cancelled',
    };

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

    return {
      label:
        statusLabels[userRegistration.status as keyof typeof statusLabels] ||
        userRegistration.status,
      color: statusColors[userRegistration.status] || 'default',
    };
  };

  if (loading) {
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

  if (error || !event) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Event not found'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/member/events')}
        >
          Back to Events
        </Button>
      </Box>
    );
  }

  const registrationStatus = getRegistrationStatus();

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/member/events" underline="hover">
          Events
        </Link>
        <Typography color="text.primary">{event.title}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate('/member/events')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" flexGrow={1}>
          {event.title}
        </Typography>
        <Tooltip
          title={favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <IconButton
            onClick={toggleFavorite}
            color={favorite ? 'error' : 'default'}
          >
            {favorite ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Share event">
          <IconButton onClick={handleShare}>
            <Share />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Event Image */}
          {event.imageUrl && (
            <Card sx={{ mb: 3 }}>
              <CardMedia
                component="img"
                height="300"
                image={event.imageUrl}
                alt={event.title}
              />
            </Card>
          )}

          {/* Event Description */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                About This Event
              </Typography>
              <Typography variant="body1" paragraph>
                {event.description}
              </Typography>

              {event.tags && event.tags.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {event.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" />
                    ))}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Event Agenda/Schedule */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Event Schedule
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Schedule />
                  </ListItemIcon>
                  <ListItemText
                    primary="Start"
                    secondary={format(
                      new Date(event.startDate),
                      'EEEE, MMMM dd, yyyy • h:mm a'
                    )}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Schedule />
                  </ListItemIcon>
                  <ListItemText
                    primary="End"
                    secondary={format(
                      new Date(event.endDate),
                      'EEEE, MMMM dd, yyyy • h:mm a'
                    )}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocationOn />
                  </ListItemIcon>
                  <ListItemText
                    primary="Location"
                    secondary={
                      event.location.virtual
                        ? 'Virtual Event'
                        : `${event.location.name}, ${event.location.address}, ${event.location.city}, ${event.location.state}`
                    }
                  />
                </ListItem>
                {event.location.virtual && event.location.meetingLink && (
                  <ListItem>
                    <ListItemIcon>
                      <Info />
                    </ListItemIcon>
                    <ListItemText
                      primary="Meeting Link"
                      secondary="Link will be shared with registered participants"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Registration Status */}
          {registrationStatus && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <CheckCircle color="success" />
                  <Typography variant="h6">Registration Status</Typography>
                </Box>
                <Chip
                  label={registrationStatus.label}
                  color={registrationStatus.color}
                  sx={{ mb: 2 }}
                />
                {userRegistration?.paymentStatus === 'pending' &&
                  event.registrationFee && (
                    <Alert severity="warning">
                      Payment pending: ₦{event.registrationFee.toLocaleString()}
                    </Alert>
                  )}
                {userRegistration?.status === 'confirmed' && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleUnregister}
                    disabled={registering}
                    fullWidth
                  >
                    Unregister
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Event Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Event Information
              </Typography>

              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Type
                  </Typography>
                  <Chip
                    label={eventTypeLabels[event.eventType]}
                    size="small"
                    color="primary"
                  />
                </Box>

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={getEventStatus()}
                    size="small"
                    color={getStatusColor()}
                  />
                </Box>

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Organizer
                  </Typography>
                  <Typography variant="body2">{event.organizer}</Typography>
                </Box>

                {event.registrationFee && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Registration Fee
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ₦{event.registrationFee.toLocaleString()}
                    </Typography>
                  </Box>
                )}

                {event.capacity && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Capacity
                    </Typography>
                    <Typography variant="body2">
                      {event.registrations?.filter(
                        (r) => r.status === 'confirmed'
                      ).length || 0}{' '}
                      / {event.capacity}
                    </Typography>
                  </Box>
                )}

                {event.registrationDeadline && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Registration Deadline
                    </Typography>
                    <Typography variant="body2">
                      {format(
                        new Date(event.registrationDeadline),
                        'MMM dd, yyyy'
                      )}
                    </Typography>
                  </Box>
                )}

                {event.isAttendanceRequired && (
                  <Alert severity="info">
                    <Typography variant="caption">
                      Attendance tracking is enabled for this event
                    </Typography>
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Registration Action */}
          {canRegister() && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Register for Event
                </Typography>

                {isRegistrationFull() ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Event is full. You can join the waitlist.
                  </Alert>
                ) : (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Secure your spot for this event
                  </Typography>
                )}

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => setShowRegisterDialog(true)}
                  disabled={registering}
                  startIcon={<CheckCircle />}
                >
                  {isRegistrationFull() ? 'Join Waitlist' : 'Register Now'}
                </Button>

                {event.registrationFee && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mt={1}
                  >
                    Registration fee: ₦{event.registrationFee.toLocaleString()}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Registration Confirmation Dialog */}
      <Dialog
        open={showRegisterDialog}
        onClose={() => setShowRegisterDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Registration</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to register for "{event.title}"?
          </Typography>

          {event.registrationFee && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Registration fee: ₦{event.registrationFee.toLocaleString()}
            </Alert>
          )}

          {isRegistrationFull() && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This event is full. You will be added to the waitlist.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRegisterDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRegister}
            variant="contained"
            disabled={registering}
          >
            {registering ? (
              <CircularProgress size={20} />
            ) : (
              'Confirm Registration'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemberEventDetails;
