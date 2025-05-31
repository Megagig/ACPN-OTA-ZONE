import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  TextField,
  FormControlLabel,
  Checkbox,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  CalendarToday,
  LocationOn,
  Person,
  AttachMoney,
  CheckCircle,
  ArrowBack,
} from '@mui/icons-material';
import { EventService } from '../../services/event.service';
import type {
  Event,
  EventType,
  EventRegistrationData,
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

const MemberEventRegistration: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [formData, setFormData] = useState<EventRegistrationData>({
    eventId: eventId || '',
    notes: '',
    emergencyContact: '',
    dietaryRequirements: '',
    specialNeeds: '',
  });

  const [agreements, setAgreements] = useState({
    terms: false,
    waiver: false,
    photography: false,
  });

  const loadEventDetails = useCallback(async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError(null);

      const eventData = await EventService.getEventById(eventId);
      setEvent(eventData);

      // Check if user is already registered
      const registrations = await EventService.getUserRegistrations(
        user?._id,
        1,
        100
      );
      const existingRegistration = registrations.data.find(
        (reg) => reg.eventId === eventId
      );

      if (existingRegistration) {
        navigate(`/member/events/${eventId}`, {
          state: { message: 'You are already registered for this event' },
        });
        return;
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [eventId, user?._id, navigate]);

  useEffect(() => {
    loadEventDetails();
  }, [loadEventDetails]);

  const handleInputChange = (
    field: keyof EventRegistrationData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAgreementChange = (
    field: keyof typeof agreements,
    checked: boolean
  ) => {
    setAgreements((prev) => ({
      ...prev,
      [field]: checked,
    }));
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return true; // Event details - just informational
      case 1:
        return true; // Registration form - all fields are optional
      case 2:
        return (
          agreements.terms &&
          (event?.eventType !== 'training' || agreements.waiver)
        );
      default:
        return false;
    }
  };

  const handleRegister = async () => {
    if (!event || !user) return;

    try {
      setRegistering(true);

      await EventService.registerForEvent(event._id, formData);

      setShowConfirmDialog(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to register for event');
    } finally {
      setRegistering(false);
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    navigate(`/member/events/${eventId}`);
  };

  const isRegistrationFull = () => {
    if (!event || !event.capacity) return false;
    const registeredCount =
      event.registrations?.filter((r) => r.status === 'confirmed').length || 0;
    return registeredCount >= event.capacity;
  };

  const canRegister = () => {
    if (!event || !user) return false;
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

  if (!canRegister()) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Registration is not available for this event
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/member/events/${eventId}`)}
        >
          Back to Event Details
        </Button>
      </Box>
    );
  }

  const steps = [
    {
      label: 'Event Details',
      content: (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {event.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {event.description}
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday />
                  </ListItemIcon>
                  <ListItemText
                    primary="Date & Time"
                    secondary={`${format(
                      new Date(event.startDate),
                      'EEEE, MMMM dd, yyyy • h:mm a'
                    )} - ${format(new Date(event.endDate), 'h:mm a')}`}
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
                        : `${event.location.name}, ${event.location.city}`
                    }
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText
                    primary="Organizer"
                    secondary={event.organizer}
                  />
                </ListItem>

                {event.registrationFee && (
                  <ListItem>
                    <ListItemIcon>
                      <AttachMoney />
                    </ListItemIcon>
                    <ListItemText
                      primary="Registration Fee"
                      secondary={`₦${event.registrationFee.toLocaleString()}`}
                    />
                  </ListItem>
                )}
              </List>

              {isRegistrationFull() && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  This event is at capacity. You will be added to the waitlist.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      ),
    },
    {
      label: 'Registration Information',
      content: (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Additional Information
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Please provide any additional information that may be helpful
                for event planning.
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Notes or Comments"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any special requirements, questions, or comments..."
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Emergency Contact"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      handleInputChange('emergencyContact', e.target.value)
                    }
                    placeholder="Name and phone number"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Dietary Requirements"
                    value={formData.dietaryRequirements}
                    onChange={(e) =>
                      handleInputChange('dietaryRequirements', e.target.value)
                    }
                    placeholder="Allergies, vegetarian, etc."
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Special Needs or Accessibility Requirements"
                    value={formData.specialNeeds}
                    onChange={(e) =>
                      handleInputChange('specialNeeds', e.target.value)
                    }
                    placeholder="Wheelchair access, hearing assistance, etc."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      ),
    },
    {
      label: 'Terms & Agreements',
      content: (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Terms and Conditions
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreements.terms}
                    onChange={(e) =>
                      handleAgreementChange('terms', e.target.checked)
                    }
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to the{' '}
                    <Link href="#" onClick={(e) => e.preventDefault()}>
                      terms and conditions
                    </Link>{' '}
                    for this event
                  </Typography>
                }
                sx={{ mb: 2 }}
              />

              {event.eventType === 'training' && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreements.waiver}
                      onChange={(e) =>
                        handleAgreementChange('waiver', e.target.checked)
                      }
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I acknowledge and accept the{' '}
                      <Link href="#" onClick={(e) => e.preventDefault()}>
                        liability waiver
                      </Link>{' '}
                      for this training event
                    </Typography>
                  }
                  sx={{ mb: 2 }}
                />
              )}

              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreements.photography}
                    onChange={(e) =>
                      handleAgreementChange('photography', e.target.checked)
                    }
                  />
                }
                label={
                  <Typography variant="body2">
                    I consent to photography and video recording during the
                    event for promotional purposes (optional)
                  </Typography>
                }
              />

              {event.registrationFee && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>Payment:</strong> A registration fee of ₦
                    {event.registrationFee.toLocaleString()} applies. Payment
                    instructions will be provided after registration
                    confirmation.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/member/events" underline="hover">
          Events
        </Link>
        <Link
          component={RouterLink}
          to={`/member/events/${eventId}`}
          underline="hover"
        >
          {event.title}
        </Link>
        <Typography color="text.primary">Register</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/member/events/${eventId}`)}
          variant="outlined"
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          Event Registration
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel>{step.label}</StepLabel>
                  <StepContent>
                    {step.content}

                    <Box sx={{ mb: 2 }}>
                      <Button
                        variant="contained"
                        onClick={
                          index === steps.length - 1
                            ? handleRegister
                            : handleNext
                        }
                        disabled={!canProceed() || registering}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        {index === steps.length - 1 ? (
                          registering ? (
                            <CircularProgress size={20} />
                          ) : (
                            'Complete Registration'
                          )
                        ) : (
                          'Continue'
                        )}
                      </Button>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Back
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Registration Summary
              </Typography>

              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Event
                </Typography>
                <Typography variant="body2">{event.title}</Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body2">
                  {eventTypeLabels[event.eventType]}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body2">
                  {format(new Date(event.startDate), 'MMM dd, yyyy')}
                </Typography>
              </Box>

              {event.registrationFee && (
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Registration Fee
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ₦{event.registrationFee.toLocaleString()}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Registrant
                </Typography>
                <Typography variant="body2">
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>

              {isRegistrationFull() && (
                <Alert severity="warning">
                  You will be added to the waitlist
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={handleConfirmClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="success" />
            Registration Successful!
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Thank you for registering for "{event.title}".
          </Typography>

          {event.registrationFee ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              Please complete your payment of ₦
              {event.registrationFee.toLocaleString()} to confirm your
              registration. Payment instructions have been sent to your email.
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mt: 2 }}>
              Your registration is confirmed. Event details and any updates will
              be sent to your email.
            </Alert>
          )}

          {isRegistrationFull() && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You have been added to the waitlist. We'll notify you if a spot
              becomes available.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose} variant="contained">
            View Event Details
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemberEventRegistration;
