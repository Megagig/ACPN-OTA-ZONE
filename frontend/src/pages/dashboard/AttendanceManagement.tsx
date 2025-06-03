import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  Heading,
  Text,
  Box,
  HStack,
  VStack,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Input,
  Flex,
  useToast,
  Checkbox,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FaCalendarCheck,
  FaUserCheck,
  FaDownload,
  FaExclamationTriangle,
} from 'react-icons/fa';
import eventService from '../../services/event.service';
import type {
  Event,
  EventAttendance,
  EventFilters,
  EventType,
  AttendanceMarkingData,
} from '../../types/event.types';
import type { User } from '../../types/auth.types';

interface AttendeeWithUser {
  _id: string;
  eventId: string;
  userId: User;
  status: string;
  paymentStatus: string;
  paymentReference?: string;
  registeredAt: string;
  createdAt?: string;
  updatedAt?: string;
}

const AttendanceManagement: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<AttendeeWithUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [attendanceStatus, setAttendanceStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [eventType, setEventType] = useState<string>('all');
  const [calculatingPenalties, setCalculatingPenalties] =
    useState<boolean>(false);
  const [sendingWarnings, setSendingWarnings] = useState<boolean>(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isWarningOpen,
    onOpen: onWarningOpen,
    onClose: onWarningClose,
  } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const filters: EventFilters = {};
      if (eventType !== 'all') {
        filters.eventType = eventType as EventType;
      }

      const response = await eventService.getAllEvents(filters);
      const yearEvents =
        response.data?.filter((event: Event) => {
          const eventYear = new Date(event.startDate).getFullYear();
          return eventYear === year;
        }) || [];

      setEvents(yearEvents);

      if (yearEvents.length > 0 && !selectedEvent) {
        // Only auto-select if no event is currently selected
        setSelectedEvent(yearEvents[0]);
      } else if (yearEvents.length === 0) {
        setSelectedEvent(null);
        setAttendees([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error fetching events',
        description: 'Unable to load events. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [year, eventType, toast, selectedEvent]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEventSelection = useCallback(
    async (event: Event) => {
      try {
        setLoading(true);
        setSelectedEvent(event);

        // Get attendance data from the event
        const attendanceData = await eventService.getEventAttendance(event._id);

        // Get all registrations with attendance status
        const registrationsResponse = await eventService.getEventRegistrations(
          event._id
        );
        const attendeesList = registrationsResponse.data || [];

        // Map attendance status
        const attendanceMap: { [key: string]: boolean } = {};
        if (attendanceData && attendanceData.data) {
          attendanceData.data.forEach((record: EventAttendance) => {
            if (record.userId && typeof record.userId === 'object') {
              attendanceMap[(record.userId as User)._id] = !!record.attendedAt;
            } else if (typeof record.userId === 'string') {
              attendanceMap[record.userId] = !!record.attendedAt;
            }
          });
        }

        setAttendanceStatus(attendanceMap);
        setAttendees(attendeesList as unknown as AttendeeWithUser[]);
      } catch (error) {
        console.error('Error fetching event details:', error);
        toast({
          title: 'Error',
          description: 'Unable to load event details. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Auto-load event data when selectedEvent changes
  useEffect(() => {
    if (selectedEvent) {
      handleEventSelection(selectedEvent);
    }
  }, [selectedEvent, handleEventSelection]);

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

      const attendanceList: AttendanceMarkingData[] = Object.entries(
        attendanceStatus
      )
        .filter(([, attended]) => attended) // Only mark attended users
        .map(([userId]) => ({
          userId,
          eventId: selectedEvent._id,
        }));

      await eventService.markAttendance(selectedEvent._id, attendanceList);

      toast({
        title: 'Attendance saved',
        description: 'Attendance has been successfully recorded.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh attendance data
      handleEventSelection(selectedEvent);
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: 'Error',
        description: 'Unable to save attendance. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePenalties = async () => {
    try {
      setCalculatingPenalties(true);

      // Call API to calculate penalties for the current year
      await eventService.calculateMeetingPenalties(year);

      toast({
        title: 'Penalties calculated',
        description: `Penalties for ${year} have been calculated successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error('Error calculating penalties:', error);
      toast({
        title: 'Error',
        description: 'Unable to calculate penalties. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCalculatingPenalties(false);
    }
  };

  const handleSendWarnings = async () => {
    try {
      setSendingWarnings(true);

      // Call API to send attendance warnings for the current year
      await eventService.sendAttendanceWarnings(year);

      toast({
        title: 'Warnings sent',
        description: `Attendance warnings for ${year} have been sent successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onWarningClose();
    } catch (error) {
      console.error('Error sending warnings:', error);
      toast({
        title: 'Error',
        description: 'Unable to send warnings. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSendingWarnings(false);
    }
  };

  const filterAttendees = () => {
    if (!searchTerm) return attendees;

    return attendees.filter((attendee) => {
      const user = attendee.userId;
      const name = `${user?.firstName || ''} ${
        user?.lastName || ''
      }`.toLowerCase();
      const email = (user?.email || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      return name.includes(searchLower) || email.includes(searchLower);
    });
  };

  const exportAttendanceCSV = () => {
    if (!selectedEvent || !attendees.length) return;

    const headers = ['Name', 'Email', 'Registration Date', 'Attendance Status'];
    const data = attendees.map((attendee) => {
      const user = attendee.userId;
      const name = `${user?.firstName || ''} ${user?.lastName || ''}`;
      const email = user?.email || '';
      const registrationDate = new Date(
        attendee.registeredAt || ''
      ).toLocaleDateString();
      const status = attendanceStatus[user?._id] ? 'Present' : 'Absent';

      return [name, email, registrationDate, status];
    });

    const csvContent = [headers, ...data]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedEvent.title}_attendance.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAttendees = filterAttendees();

  return (
    <Box className="p-5">
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">Attendance Management</Heading>
          <Text color="gray.500">
            Track and manage attendance for events and meetings
          </Text>
        </Box>

        <HStack spacing={4}>
          <Button
            leftIcon={<FaCalendarCheck />}
            colorScheme="blue"
            onClick={() => navigate('/admin/events')}
          >
            Event Management
          </Button>

          {/* Only show these buttons for the current year */}
          {year === new Date().getFullYear() && (
            <>
              <Button
                leftIcon={<FaExclamationTriangle />}
                colorScheme="orange"
                onClick={onWarningOpen}
              >
                Send Warnings
              </Button>

              <Button
                leftIcon={<FaUserCheck />}
                colorScheme="green"
                onClick={onOpen}
              >
                Calculate Penalties
              </Button>
            </>
          )}
        </HStack>
      </Flex>

      <Card mb={6}>
        <CardBody>
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <HStack spacing={4}>
              <Box>
                <Text fontWeight="medium" mb={1}>
                  Filter by Year
                </Text>
                <Select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  width="150px"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </Box>

              <Box>
                <Text fontWeight="medium" mb={1}>
                  Event Type
                </Text>
                <Select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  width="180px"
                >
                  <option value="all">All Events</option>
                  <option value="meetings">Meetings Only</option>
                  <option value="conference">Conferences</option>
                  <option value="workshop">Workshops</option>
                  <option value="seminar">Seminars</option>
                  <option value="training">Training</option>
                  <option value="social">Social</option>
                </Select>
              </Box>
            </HStack>

            {selectedEvent && (
              <HStack spacing={4}>
                <Box>
                  <Text fontWeight="medium" mb={1}>
                    Search Attendees
                  </Text>
                  <Input
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    width="250px"
                  />
                </Box>

                <Button
                  leftIcon={<FaDownload />}
                  onClick={exportAttendanceCSV}
                  variant="outline"
                  colorScheme="blue"
                  disabled={!selectedEvent || !attendees.length}
                >
                  Export CSV
                </Button>
              </HStack>
            )}
          </Flex>
        </CardBody>
      </Card>

      <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
        <Card width={{ base: '100%', md: '350px' }}>
          <CardBody>
            <Heading size="md" mb={4}>
              Events
            </Heading>

            {loading && !selectedEvent ? (
              <Flex justify="center" py={8}>
                <Spinner />
              </Flex>
            ) : events.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={4}>
                No events found for the selected filters
              </Text>
            ) : (
              <VStack
                spacing={3}
                align="stretch"
                maxHeight="600px"
                overflow="auto"
              >
                {events.map((event) => (
                  <Box
                    key={event._id}
                    p={3}
                    borderWidth={1}
                    borderRadius="md"
                    cursor="pointer"
                    bg={selectedEvent?._id === event._id ? 'blue.50' : 'white'}
                    borderColor={
                      selectedEvent?._id === event._id ? 'blue.500' : 'gray.200'
                    }
                    _hover={{ bg: 'gray.50' }}
                    onClick={() => handleEventSelection(event)}
                  >
                    <Text fontWeight="medium">{event.title}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(event.startDate).toLocaleDateString()}
                    </Text>
                    <Flex mt={2} gap={2} wrap="wrap">
                      <Badge
                        colorScheme={
                          event.eventType === 'meetings' ? 'green' : 'blue'
                        }
                      >
                        {event.eventType}
                      </Badge>
                      <Badge colorScheme="purple">
                        {event.attendees?.length || 0} attendees
                      </Badge>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </CardBody>
        </Card>

        <Card flex={1}>
          <CardBody>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">
                {selectedEvent
                  ? `${selectedEvent.title} Attendance`
                  : 'Select an Event'}
              </Heading>

              {selectedEvent && (
                <Button
                  colorScheme="green"
                  onClick={handleSaveAttendance}
                  isLoading={loading}
                >
                  Save Attendance
                </Button>
              )}
            </Flex>

            {loading && selectedEvent ? (
              <Flex justify="center" py={8}>
                <Spinner />
              </Flex>
            ) : !selectedEvent ? (
              <Text color="gray.500" textAlign="center" py={8}>
                Select an event to manage attendance
              </Text>
            ) : filteredAttendees.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={8}>
                No attendees found for this event
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Email</Th>
                      <Th>Registration Date</Th>
                      <Th>Present</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredAttendees.map((attendee) => {
                      const user = attendee.userId;
                      return (
                        <Tr key={user?._id || attendee._id}>
                          <Td>
                            {user?.firstName} {user?.lastName}
                          </Td>
                          <Td>{user?.email}</Td>
                          <Td>
                            {new Date(
                              attendee.registeredAt || ''
                            ).toLocaleDateString()}
                          </Td>
                          <Td>
                            <Checkbox
                              isChecked={!!attendanceStatus[user?._id]}
                              onChange={(e) =>
                                handleAttendanceChange(
                                  user?._id,
                                  e.target.checked
                                )
                              }
                              colorScheme="green"
                            />
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>
      </Flex>

      {/* Confirmation Dialog for Calculating Penalties */}
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
              This will calculate penalties for members who didn't meet the 50%
              attendance threshold for meetings in {year}.
              <br />
              <br />
              The penalty will be half of the total annual dues for each member
              below the threshold.
              <br />
              <br />
              Are you sure you want to continue?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleCalculatePenalties}
                ml={3}
                isLoading={calculatingPenalties}
              >
                Calculate Penalties
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Confirmation Dialog for Sending Attendance Warnings */}
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
              This will send warning notifications to members who are currently
              below the 50% attendance threshold for meetings in {year}.
              <br />
              <br />
              The warnings will help members avoid penalties by encouraging them
              to attend remaining meetings this year.
              <br />
              <br />
              Are you sure you want to send these warnings?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onWarningClose}>
                Cancel
              </Button>
              <Button
                colorScheme="orange"
                onClick={handleSendWarnings}
                ml={3}
                isLoading={sendingWarnings}
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
