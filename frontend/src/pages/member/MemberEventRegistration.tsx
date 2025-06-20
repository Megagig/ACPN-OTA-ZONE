import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardBody,
  Text,
  SimpleGrid,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Input,
  Textarea,
  Checkbox,
  List,
  ListItem,
  ListIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Link as ChakraLink,
  FormControl,
  FormLabel,
  Heading,
  VStack,
  HStack,
  useSteps,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  Stepper as ChakraStepper,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { toast } from 'react-toastify';
import {
  FaCalendarDay,
  FaMapMarkerAlt,
  FaUser,
  FaDollarSign,
  FaCheckCircle as FaCheckCircleIcon,
  FaArrowLeft,
} from 'react-icons/fa';
import { EventService } from '../../services/event.service';
import type { Event, EventRegistrationData } from '../../types/event.types';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { format, isPast } from 'date-fns';

const MemberEventRegistration: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const stepsConfig = [
    { title: 'Event Details', description: 'Review event information' },
    { title: 'Registration Form', description: 'Provide your details' },
    { title: 'Agreements', description: 'Confirm terms' },
  ];

  const { activeStep, goToNext, goToPrevious } = useSteps({
    index: 0,
    count: stepsConfig.length,
  });

  const loadEventDetails = useCallback(async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError(null);

      const eventData = await EventService.getEventById(eventId);
      setEvent(eventData);

      const registrations = await EventService.getUserRegistrations(
        user?._id,
        1
      );
      const existingRegistration = registrations.data.find(
        (reg: any) => reg.eventId === eventId
      );

      if (existingRegistration) {
        // Use navigate with replace and state for the message
        navigate(`/member/events/${eventId}`, {
          replace: true,
          state: {
            message: 'You are already registered for this event',
            status: 'info',
          },
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
    // Access location state for messages passed via navigate
    // This requires react-router-dom v6 specific way or a custom hook if using older versions with such patterns
    // For now, assuming a modern setup or that the message is handled on the target page
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

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return true;
      case 1:
        return true;
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
      setError(null);
      await EventService.registerForEvent(event._id, formData);
      setShowConfirmDialog(true);
      // Assuming success toast is handled by navigation or confirmation dialog
      setTimeout(() => {
        navigate(`/events/${eventId}`);
      }, 1000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        error.response?.data?.message ||
        'Failed to register for event. An unexpected error occurred.';
      setError(errorMessage);
      toast.error(errorMessage, { autoClose: 5000 });
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
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error && !event) {
    // Show error if event couldn't be loaded
    return (
      <Box p={4}>
        <Alert status="error" mb={3}>
          <AlertIcon />
          <AlertTitle>Error Loading Event!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          leftIcon={<Icon as={FaArrowLeft} />}
          onClick={() => navigate('/member/events')}
        >
          Back to Events
        </Button>
      </Box>
    );
  }

  if (!event) {
    // Fallback if event is null after loading and no specific error was set for it
    return (
      <Box p={4}>
        <Alert status="info" mb={3}>
          <AlertIcon />
          <AlertDescription>
            Event details are currently unavailable.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          leftIcon={<Icon as={FaArrowLeft} />}
          onClick={() => navigate('/member/events')}
        >
          Back to Events
        </Button>
      </Box>
    );
  }

  if (!canRegister()) {
    return (
      <Box p={4}>
        <Alert status="warning" mb={3}>
          <AlertIcon />
          <AlertTitle>Registration Not Available</AlertTitle>
          <AlertDescription>
            Registration is not currently available for this event. This might
            be because the deadline has passed, the event is not published, or
            it does not require registration.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          leftIcon={<Icon as={FaArrowLeft} />}
          onClick={() => navigate(`/member/events/${eventId}`)}
        >
          Back to Event Details
        </Button>
      </Box>
    );
  }

  const stepContents = [
    // Step 1: Event Details
    <Box>
      <Card mb={3} variant="outline">
        <CardBody>
          <Heading size="md" mb={2}>
            {event.title}
          </Heading>
          <Text color="gray.600" mb={4}>
            {event.description}
          </Text>
          <List spacing={3}>
            <ListItem>
              <ListIcon as={FaCalendarDay} color="blue.500" />
              <Text display="inline" fontWeight="bold">
                Date & Time:
              </Text>
              <Text ml={2} display="inline">
                {`${format(
                  new Date(event.startDate),
                  'EEEE, MMMM dd, yyyy • h:mm a'
                )} - ${format(new Date(event.endDate), 'h:mm a')}`}
              </Text>
            </ListItem>
            <ListItem>
              <ListIcon as={FaMapMarkerAlt} color="blue.500" />
              <Text display="inline" fontWeight="bold">
                Location:
              </Text>
              <Text ml={2} display="inline">
                {event.location.virtual
                  ? 'Virtual Event'
                  : `${event.location.name}, ${event.location.city}`}
              </Text>
            </ListItem>
            <ListItem>
              <ListIcon as={FaUser} color="blue.500" />
              <Text display="inline" fontWeight="bold">
                Organizer:
              </Text>
              <Text ml={2} display="inline">
                {event.organizer}
              </Text>
            </ListItem>
            {event.registrationFee && (
              <ListItem>
                <ListIcon as={FaDollarSign} color="blue.500" />
                <Text display="inline" fontWeight="bold">
                  Registration Fee:
                </Text>
                <Text
                  ml={2}
                  display="inline"
                >{`₦${event.registrationFee.toLocaleString()}`}</Text>
              </ListItem>
            )}
          </List>
          {isRegistrationFull() && (
            <Alert status="warning" mt={4}>
              <AlertIcon />
              This event is at capacity. You may be added to the waitlist.
            </Alert>
          )}
        </CardBody>
      </Card>
    </Box>,
    // Step 2: Registration Information
    <Box>
      <Card mb={3} variant="outline">
        <CardBody>
          <Heading size="md" mb={2}>
            Additional Information
          </Heading>
          <Text color="gray.600" mb={4}>
            Please provide any additional information that may be helpful for
            event planning.
          </Text>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel htmlFor="notes">Notes or Comments</FormLabel>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any special requirements, questions, or comments..."
                rows={3}
              />
            </FormControl>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel htmlFor="emergencyContact">
                  Emergency Contact
                </FormLabel>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    handleInputChange('emergencyContact', e.target.value)
                  }
                  placeholder="Name and phone number"
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="dietaryRequirements">
                  Dietary Requirements
                </FormLabel>
                <Input
                  id="dietaryRequirements"
                  value={formData.dietaryRequirements}
                  onChange={(e) =>
                    handleInputChange('dietaryRequirements', e.target.value)
                  }
                  placeholder="Allergies, vegetarian, etc."
                />
              </FormControl>
            </SimpleGrid>
            <FormControl>
              <FormLabel htmlFor="specialNeeds">
                Special Needs or Accessibility Requirements
              </FormLabel>
              <Input
                id="specialNeeds"
                value={formData.specialNeeds}
                onChange={(e) =>
                  handleInputChange('specialNeeds', e.target.value)
                }
                placeholder="Wheelchair access, hearing assistance, etc."
              />
            </FormControl>
          </VStack>
        </CardBody>
      </Card>
    </Box>,
    // Step 3: Terms & Agreements
    <Box>
      <Card mb={3} variant="outline">
        <CardBody>
          <Heading size="md" mb={4}>
            Terms and Conditions
          </Heading>
          <VStack spacing={4} align="stretch">
            <Checkbox
              isChecked={agreements.terms}
              onChange={(e) => handleAgreementChange('terms', e.target.checked)}
            >
              <Text fontSize="sm">
                I agree to the{' '}
                <ChakraLink
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  color="blue.500"
                  isExternal
                >
                  terms and conditions
                </ChakraLink>{' '}
                for this event.
              </Text>
            </Checkbox>
            {event.eventType === 'training' && (
              <Checkbox
                isChecked={agreements.waiver}
                onChange={(e) =>
                  handleAgreementChange('waiver', e.target.checked)
                }
              >
                <Text fontSize="sm">
                  I acknowledge and accept the{' '}
                  <ChakraLink
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    color="blue.500"
                    isExternal
                  >
                    liability waiver
                  </ChakraLink>{' '}
                  for this training event.
                </Text>
              </Checkbox>
            )}
            <Checkbox
              isChecked={agreements.photography}
              onChange={(e) =>
                handleAgreementChange('photography', e.target.checked)
              }
            >
              <Text fontSize="sm">
                I consent to photography and video recording during the event
                for promotional purposes (optional).
              </Text>
            </Checkbox>
          </VStack>
          {event.registrationFee && (
            <Alert status="info" mt={6} variant="subtle">
              <AlertIcon />
              <Box>
                <AlertTitle>Payment Information</AlertTitle>
                <AlertDescription>
                  A registration fee of ₦
                  {event.registrationFee.toLocaleString()} applies. Payment
                  instructions will be provided after registration confirmation.
                </AlertDescription>
              </Box>
            </Alert>
          )}
        </CardBody>
      </Card>
    </Box>,
  ];

  return (
    <Box p={{ base: 2, md: 4 }}>
      <Breadcrumb mb={4} separator="/">
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/member/events">
            Events
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to={`/member/events/${eventId}`}>
            {event?.title || 'Event'}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Register</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Flex align="center" gap={2} mb={6}>
        <Button
          leftIcon={<Icon as={FaArrowLeft} />}
          onClick={() => navigate(`/member/events/${eventId}`)}
          variant="ghost"
          size="sm"
        >
          Back to Event
        </Button>
      </Flex>

      <Heading size="lg" mb={2}>
        Register for: {event.title}
      </Heading>
      <Text fontSize="md" color="gray.600" mb={6}>
        Complete the steps below to secure your spot.
      </Text>

      <ChakraStepper index={activeStep} colorScheme="blue" mb={6}>
        {stepsConfig.map((step, index) => (
          <Step key={index}>
            <StepIndicator>
              <StepStatus
                complete={<StepIcon />}
                incomplete={<StepNumber />}
                active={<StepNumber />}
              />
            </StepIndicator>
            <Box flexShrink="0" width="100%" pl={{ base: 2, md: 4 }}>
              <StepTitle>{step.title}</StepTitle>
              <StepDescription>{step.description}</StepDescription>
              {activeStep === index && (
                <Box mt={4}>
                  {stepContents[index]}
                  <HStack mt={6} spacing={4}>
                    <Button
                      onClick={
                        index === stepsConfig.length - 1
                          ? handleRegister
                          : goToNext
                      }
                      isDisabled={!canProceed() || registering}
                      isLoading={
                        index === stepsConfig.length - 1 && registering
                      }
                      colorScheme="blue"
                      loadingText={
                        index === stepsConfig.length - 1
                          ? 'Registering...'
                          : 'Loading...'
                      }
                    >
                      {index === stepsConfig.length - 1
                        ? 'Complete Registration'
                        : 'Continue'}
                    </Button>
                    <Button
                      isDisabled={index === 0 || registering}
                      onClick={goToPrevious}
                      variant="ghost"
                    >
                      Back
                    </Button>
                  </HStack>
                </Box>
              )}
            </Box>
            {index < stepsConfig.length - 1 && <StepSeparator />}
          </Step>
        ))}
      </ChakraStepper>

      <Modal isOpen={showConfirmDialog} onClose={handleConfirmClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Registration Confirmed!</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="center" textAlign="center" py={4}>
              <Icon as={FaCheckCircleIcon} w={12} h={12} color="green.500" />
              <Heading size="md">Thank You!</Heading>
              <Text>
                Your registration for <strong>\"{event?.title}\"</strong> has
                been successfully submitted.
              </Text>
              <Text fontSize="sm" color="gray.600">
                You will receive a confirmation email shortly with further
                details.
              </Text>
              {event?.registrationFee && event.registrationFee > 0 && (
                <Alert status="info" variant="subtle" borderRadius="md" mt={2}>
                  <AlertIcon />
                  <Box flex="1">
                    <AlertTitle>Payment Required</AlertTitle>
                    <AlertDescription fontSize="sm">
                      Please note: A registration fee of{' '}
                      <strong>₦{event.registrationFee.toLocaleString()}</strong>{' '}
                      applies. Payment instructions will be included in your
                      confirmation email.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="center">
            <Button colorScheme="blue" onClick={handleConfirmClose}>
              View Event Details
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MemberEventRegistration;
