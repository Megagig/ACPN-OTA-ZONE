import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Grid,
  GridItem,
  VStack,
  HStack,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Checkbox,
  Badge,
  Spinner,
  Center,
  Icon,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  useToast,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { 
  CalendarIcon, 
  SearchIcon, 
  DownloadIcon, 
  CheckCircleIcon,
  EmailIcon
} from '@chakra-ui/icons';
import { FiUsers, FiCalendar } from 'react-icons/fi';
import attendanceService from '../../services/attendanceService';
import type { Event, AttendeeWithUser } from '../../services/attendanceService';

const AttendanceManagement: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isWarningOpen, onOpen: onWarningOpen, onClose: onWarningClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<AttendeeWithUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [attendanceStatus, setAttendanceStatus] = useState<{[key: string]: boolean}>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [eventType, setEventType] = useState<string>('all');
  const [calculatingPenalties, setCalculatingPenalties] = useState<boolean>(false);
  const [sendingWarnings, setSendingWarnings] = useState<boolean>(false);
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const bgGradient = useColorModeValue('linear(to-br, gray.50, gray.100)', 'linear(to-br, gray.900, gray.800)');

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  // Fetch events when year changes
  useEffect(() => {
    fetchEvents();
  }, [year]);
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const fetchedEvents = await attendanceService.getEvents(year);
      setEvents(fetchedEvents);
      if (fetchedEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(fetchedEvents[0]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch events',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventSelection = async (event: Event) => {
    setSelectedEvent(event);
    setLoading(true);
    
    try {
      const fetchedAttendees = await attendanceService.getEventAttendees(event._id);
      setAttendees(fetchedAttendees);
      
      // Initialize attendance status from fetched attendees, skipping any with null userId
      const initialStatus = fetchedAttendees.reduce((acc, attendee) => {
        if (attendee.userId && attendee.userId._id) {
          return {
            ...acc,
            [attendee.userId._id]: attendee.attended
          };
        }
        return acc;
      }, {});      setAttendanceStatus(initialStatus);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch attendees',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Error fetching attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (userId: string, attended: boolean) => {
    setAttendanceStatus((prev) => ({
      ...prev,
      [userId]: attended,
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedEvent) return;

    try {
      setLoading(true);
      const attendanceData = Object.entries(attendanceStatus).map(([userId, present]) => ({
        userId,
        attended: present
      }));
        await attendanceService.updateAttendance(selectedEvent._id, attendanceData);
      toast({
        title: 'Success',
        description: 'Attendance has been successfully recorded!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to save attendance. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Error saving attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePenalties = async () => {    try {
      setCalculatingPenalties(true);
      await attendanceService.calculatePenalties(year);
      onClose();
      toast({
        title: 'Success',
        description: `Penalties for ${year} have been calculated successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to calculate penalties. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Error calculating penalties:', error);
    } finally {
      setCalculatingPenalties(false);
    }
  };

  const handleSendWarnings = async () => {    try {
      setSendingWarnings(true);
      await attendanceService.sendWarnings(year);
      onWarningClose();
      toast({
        title: 'Success',
        description: `Attendance warnings for ${year} have been sent successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to send warnings. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Error sending warnings:', error);
    } finally {
      setSendingWarnings(false);
    }
  };

  const filterAttendees = () => {
    if (!searchTerm) return attendees;

    return attendees.filter((attendee) => {
      const user = attendee.userId;
      const name = `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase();
      const email = (user?.email || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      return name.includes(searchLower) || email.includes(searchLower);
    });
  };

  const exportAttendanceCSV = async () => {
    if (!selectedEvent || !attendees.length) return;
    
    try {
      const blob = await attendanceService.exportAttendanceCSV(selectedEvent._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedEvent.title}-attendance.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export attendance data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Error exporting attendance:', error);
    }
  };

  const filteredAttendees = filterAttendees();
  const getEventTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'meetings': return 'blue';
      case 'conference': return 'purple';
      case 'workshop': return 'yellow';
      case 'training': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Box 
      minH="100vh" 
      bgGradient={bgGradient}
      p={{ base: 4, md: 6 }}
    >
      <Container maxW="7xl">
        {/* Header */}
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          justify="space-between" 
          align={{ base: 'stretch', md: 'center' }}
          mb={8}
          gap={4}
        >
          <VStack align="flex-start" spacing={2}>
            <Heading size="xl" color="gray.800">
              Attendance Management
            </Heading>
            <Text color="gray.600">
              Track and manage attendance for events and meetings
            </Text>
          </VStack>

          <HStack spacing={3} flexWrap="wrap">
            <Button
              leftIcon={<CalendarIcon />}
              colorScheme="blue"
              variant="solid"
              size="md"
              onClick={() => navigate('/admin/events')}
            >
              Event Management
            </Button>

            {year === new Date().getFullYear() && (
              <>
                <Button
                  leftIcon={<EmailIcon />}
                  colorScheme="orange"
                  variant="solid"
                  size="md"
                  onClick={onWarningOpen}
                >
                  Send Warnings
                </Button>

                <Button
                  leftIcon={<CheckCircleIcon />}
                  colorScheme="green"
                  variant="solid"
                  size="md"
                  onClick={onOpen}
                >
                  Calculate Penalties
                </Button>
              </>
            )}
          </HStack>
        </Flex>

        {/* Statistics Cards */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6} mb={8}>
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Stat>
                <StatLabel>Total Events</StatLabel>
                <StatNumber>{events.length}</StatNumber>
                <StatGroup>
                  <Text fontSize="sm" color="gray.500">
                    For {year}
                  </Text>
                </StatGroup>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Stat>
                <StatLabel>Selected Event Attendees</StatLabel>
                <StatNumber>{selectedEvent?.attendees?.length || 0}</StatNumber>
                <StatGroup>
                  <Text fontSize="sm" color="gray.500">
                    {selectedEvent ? 'Registered' : 'No event selected'}
                  </Text>
                </StatGroup>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Stat>
                <StatLabel>Present Attendees</StatLabel>
                <StatNumber>
                  {Object.values(attendanceStatus).filter(Boolean).length}
                </StatNumber>
                <StatGroup>
                  <Text fontSize="sm" color="gray.500">
                    Marked present
                  </Text>
                </StatGroup>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Stat>
                <StatLabel>Attendance Rate</StatLabel>
                <StatNumber>
                  {attendees.length > 0 
                    ? Math.round((Object.values(attendanceStatus).filter(Boolean).length / attendees.length) * 100)
                    : 0}%
                </StatNumber>
                <StatGroup>
                  <Text fontSize="sm" color="gray.500">
                    Current event
                  </Text>
                </StatGroup>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Filters Card */}
        <Card bg={cardBg} shadow="md" mb={8}>
          <CardBody>
            <Flex 
              direction={{ base: 'column', lg: 'row' }} 
              justify="space-between" 
              align={{ base: 'stretch', lg: 'end' }}
              gap={4}
            >
              <HStack spacing={4} flexWrap="wrap">
                <VStack align="flex-start" spacing={1}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    Filter by Year
                  </Text>
                  <Select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    w={{ base: 'full', sm: '160px' }}
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Select>
                </VStack>

                <VStack align="flex-start" spacing={1}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    Event Type
                  </Text>
                  <Select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    w={{ base: 'full', sm: '180px' }}
                  >
                    <option value="all">All Events</option>
                    <option value="meetings">Meetings Only</option>
                    <option value="conference">Conferences</option>
                    <option value="workshop">Workshops</option>
                    <option value="seminar">Seminars</option>
                    <option value="training">Training</option>
                    <option value="social">Social</option>
                  </Select>
                </VStack>
              </HStack>

              {selectedEvent && (
                <HStack spacing={4} flexWrap="wrap">
                  <VStack align="flex-start" spacing={1}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Search Attendees
                    </Text>
                    <InputGroup w={{ base: 'full', sm: '240px' }}>
                      <InputLeftElement>
                        <SearchIcon color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search by name or email"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </VStack>

                  <Button
                    leftIcon={<DownloadIcon />}
                    variant="outline"
                    colorScheme="blue"
                    mt={6}
                    onClick={exportAttendanceCSV}
                    isDisabled={!selectedEvent || !attendees.length}
                  >
                    Export CSV
                  </Button>
                </HStack>
              )}
            </Flex>
          </CardBody>
        </Card>        {/* Main Content */}
        <Grid templateColumns={{ base: '1fr', lg: '1fr 2fr' }} gap={6}>
          {/* Events Panel */}
          <GridItem>
            <Card bg={cardBg} shadow="md" h="full">
              <CardHeader>
                <Heading size="lg">Events</Heading>
              </CardHeader>
              <CardBody>
                {loading && !selectedEvent ? (
                  <Center py={8}>
                    <Spinner size="lg" color="blue.500" />
                  </Center>
                ) : events.length === 0 ? (
                  <Center py={8}>
                    <VStack spacing={3}>
                      <Icon as={FiCalendar} boxSize={12} color="gray.400" />
                      <Text color="gray.500" textAlign="center">
                        No events found for the selected filters
                      </Text>
                    </VStack>
                  </Center>
                ) : (
                  <VStack spacing={4} maxH="600px" overflowY="auto">
                    {events.map((event) => (
                      <Card
                        key={event._id}
                        w="full"
                        cursor="pointer"
                        variant={selectedEvent?._id === event._id ? 'filled' : 'outline'}
                        colorScheme={selectedEvent?._id === event._id ? 'blue' : undefined}
                        onClick={() => handleEventSelection(event)}
                        _hover={{ shadow: 'md' }}
                        transition="all 0.2s"
                      >
                        <CardBody>
                          <Flex justify="space-between" align="flex-start" mb={2}>
                            <Heading size="sm" color="gray.800">
                              {event.title}
                            </Heading>
                            <Badge 
                              colorScheme={getEventTypeBadgeColor(event.eventType)}
                              variant="solid"
                              fontSize="xs"
                            >
                              {event.eventType}
                            </Badge>
                          </Flex>
                          <Text fontSize="sm" color="gray.600" mb={3}>
                            {new Date(event.startDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </Text>
                          <HStack spacing={4} fontSize="sm" color="gray.500">
                            <HStack spacing={1}>
                              <Icon as={FiUsers} color="blue.500" />
                              <Text>{event.attendees?.length || 0} attendees</Text>
                            </HStack>
                            <HStack spacing={1}>
                              <CheckCircleIcon color="green.500" />
                              <Text>Completed</Text>
                            </HStack>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                )}
              </CardBody>
            </Card>
          </GridItem>

          {/* Attendance Panel */}
          <GridItem>
            <Card bg={cardBg} shadow="md" h="full">
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="lg">
                    {selectedEvent ? `${selectedEvent.title} Attendance` : 'Select an Event'}
                  </Heading>

                  {selectedEvent && (
                    <Button
                      colorScheme="green"
                      size="md"
                      onClick={handleSaveAttendance}
                      isLoading={loading}
                      loadingText="Saving..."
                      leftIcon={<CheckCircleIcon />}
                    >
                      Save Attendance
                    </Button>
                  )}
                </Flex>
              </CardHeader>
              <CardBody>
                {loading && selectedEvent ? (
                  <Center py={8}>
                    <Spinner size="lg" color="blue.500" />
                  </Center>
                ) : !selectedEvent ? (
                  <Center py={12}>
                    <VStack spacing={4}>
                      <Icon as={CalendarIcon} boxSize={16} color="gray.400" />
                      <Text color="gray.500" textAlign="center">
                        Select an event to manage attendance
                      </Text>
                    </VStack>
                  </Center>
                ) : filteredAttendees.length === 0 ? (
                  <Center py={12}>
                    <VStack spacing={4}>
                      <Icon as={FiUsers} boxSize={16} color="gray.400" />
                      <Text color="gray.500" textAlign="center">
                        No attendees found for this event
                      </Text>
                    </VStack>
                  </Center>
                ) : (
                  <TableContainer>
                    <Table variant="simple" size="md">
                      <Thead>
                        <Tr>
                          <Th>Name</Th>
                          <Th>Email</Th>
                          <Th>Registration Date</Th>
                          <Th textAlign="center">Present</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredAttendees.map((attendee) => {
                          const user = attendee.userId;
                          if (!user) return null;
                          return (
                            <Tr key={user._id || attendee._id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                              <Td>
                                <Text fontWeight="medium">
                                  {user.firstName} {user.lastName}
                                </Text>
                              </Td>
                              <Td>
                                <Text color="gray.600">{user.email}</Text>
                              </Td>
                              <Td>
                                <Text color="gray.600">
                                  {new Date(attendee.markedAt || '').toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </Text>
                              </Td>
                              <Td textAlign="center">
                                <Checkbox
                                  colorScheme="green"
                                  size="lg"
                                  isChecked={!!attendanceStatus[user._id]}
                                  onChange={(e) =>
                                    handleAttendanceChange(
                                      user._id,
                                      e.target.checked
                                    )
                                  }
                                />
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </Container>      {/* Calculate Penalties Modal */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Calculate Attendance Penalties
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack spacing={4} align="flex-start">
                <Text>
                  This will calculate penalties for members who didn't meet the 50%
                  attendance threshold for meetings in {year}.
                </Text>
                <Text>
                  The penalty will be half of the total annual dues for each member
                  below the threshold.
                </Text>
                <Text fontWeight="medium" color="orange.600">
                  Are you sure you want to continue?
                </Text>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleCalculatePenalties}
                isLoading={calculatingPenalties}
                loadingText="Calculating..."
                ml={3}
              >
                Calculate Penalties
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Send Warnings Modal */}
      <AlertDialog
        isOpen={isWarningOpen}
        leastDestructiveRef={cancelRef}
        onClose={onWarningClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Send Attendance Warnings
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack spacing={4} align="flex-start">
                <Text>
                  This will send warning notifications to members who are currently
                  below the 50% attendance threshold for meetings in {year}.
                </Text>
                <Text>
                  The warnings will help members avoid penalties by encouraging them
                  to attend remaining meetings this year.
                </Text>
                <Text fontWeight="medium" color="orange.600">
                  Are you sure you want to send these warnings?
                </Text>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onWarningClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="orange" 
                onClick={handleSendWarnings}
                isLoading={sendingWarnings}
                loadingText="Sending..."
                ml={3}
              >
                Send Warnings
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default AttendanceManagement;