import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Heading,
  Text,
  Box,
  VStack,
  HStack,
  Flex,
  Progress,
  Badge,
  Select,
  Spinner,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tab,
} from '@chakra-ui/react';
import { toast } from 'react-toastify';
import { FaExclamationTriangle } from 'react-icons/fa';
import eventService from '../../services/event.service';
import type { Event, PenaltyInfo } from '../../types/event.types';

const MemberAttendanceStatus: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [events, setEvents] = useState<Event[]>([]);
  const [meetingEvents, setMeetingEvents] = useState<Event[]>([]);
  const [attendedEvents, setAttendedEvents] = useState<string[]>([]);
  const [penalties, setPenalties] = useState<PenaltyInfo | null>(null);
  const [attendancePercentage, setAttendancePercentage] = useState<number>(0);
  const [belowThreshold, setBelowThreshold] = useState<boolean>(false);

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  // Fetch all data needed for the dashboard
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get events filtered by year on the backend for better performance
        const startOfYear = new Date(year, 0, 1).toISOString();
        const endOfYear = new Date(year, 11, 31, 23, 59, 59).toISOString();

        const eventsResponse = await eventService.getAllEvents(
          {
            startDate: startOfYear,
            endDate: endOfYear,
          },
          1,
          100
        ); // Increase limit since we're filtering by year

        if (eventsResponse && eventsResponse.data) {
          setEvents(eventsResponse.data);

          // Filter out meeting events
          const meetings = eventsResponse.data.filter(
            (event) => event.eventType === 'meetings'
          );
          setMeetingEvents(meetings);
        }

        // Get user's event history which includes attendance records
        const userHistory = await eventService.getUserEventHistory();
        if (userHistory && userHistory.data) {
          // Extract attended event IDs from the attendance records
          // Handle both old and new API response structures
          const attendanceData = userHistory.data.attendance || [];
          const attendedIds = attendanceData
            .filter((attendance) => attendance.attended === true)
            .map((attendance) => {
              // Handle both populated and unpopulated eventId
              if (
                typeof attendance.eventId === 'object' &&
                attendance.eventId._id
              ) {
                return attendance.eventId._id;
              }
              return attendance.eventId as string;
            })
            .filter((id): id is string => typeof id === 'string');
          setAttendedEvents(attendedIds);
        }

        // Get penalty information
        const penaltyResponse = await eventService.getUserPenalties();
        if (penaltyResponse) {
          setPenalties(penaltyResponse);
        }
      } catch (error: any) {
        console.error('Error fetching attendance data:', error);

        // More specific error messages
        if (error?.code === 'ECONNABORTED') {
          toast.error(
            'Request timed out. Please check your connection and try again.',
            {
              autoClose: 5000,
            }
          );
        } else if (error?.response?.status === 401) {
          toast.error('Please log in again to view your attendance status.', {
            autoClose: 5000,
          });
        } else {
          toast.error('Unable to load attendance data. Please try again.', {
            autoClose: 5000,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year]);

  // Calculate attendance percentage when meeting events or attended events change
  useEffect(() => {
    const meetingsCount = meetingEvents.length;
    if (meetingsCount > 0) {
      const attendedMeetings = meetingEvents.filter((meeting) =>
        attendedEvents.includes(meeting._id)
      ).length;
      const percentage = (attendedMeetings / meetingsCount) * 100;
      setAttendancePercentage(percentage);
      setBelowThreshold(percentage < 50);
    } else {
      setAttendancePercentage(0);
      setBelowThreshold(false);
    }
  }, [meetingEvents, attendedEvents]);

  // Format date function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get progress bar color based on attendance percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'green';
    if (percentage >= 50) return 'blue';
    if (percentage >= 25) return 'yellow';
    return 'red';
  };

  return (
    <Box className="p-5">
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">My Attendance Status</Heading>
          <Text color="gray.500">
            Track your attendance record for events and meetings
          </Text>
        </Box>

        <HStack spacing={4}>
          <Box>
            <Text fontWeight="medium" mb={1}>
              Select Year
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
        </HStack>
      </Flex>

      {loading ? (
        <Flex justify="center" py={8}>
          <Spinner size="xl" />
        </Flex>
      ) : (
        <>
          {/* Attendance Summary Card */}
          <Card mb={6}>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" mb={4}>
                    Meeting Attendance Overview for {year}
                  </Heading>

                  <Flex
                    direction={{ base: 'column', md: 'row' }}
                    gap={6}
                    mb={4}
                  >
                    <Stat>
                      <StatLabel>Total Meetings</StatLabel>
                      <StatNumber>{meetingEvents.length}</StatNumber>
                      <StatHelpText>Required Events</StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel>Meetings Attended</StatLabel>
                      <StatNumber>
                        {
                          meetingEvents.filter((event) =>
                            attendedEvents.includes(event._id)
                          ).length
                        }
                      </StatNumber>
                      <StatHelpText>
                        {attendancePercentage.toFixed(0)}% Attendance Rate
                      </StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel>Required Threshold</StatLabel>
                      <StatNumber>50%</StatNumber>
                      <StatHelpText>
                        {belowThreshold ? (
                          <Badge colorScheme="red">Below Threshold</Badge>
                        ) : (
                          <Badge colorScheme="green">Meeting Threshold</Badge>
                        )}
                      </StatHelpText>
                    </Stat>

                    {penalties && (
                      <Stat>
                        <StatLabel>Penalty Amount</StatLabel>
                        <StatNumber>
                          {penalties.penaltyAmount
                            ? `₦${penalties.penaltyAmount.toLocaleString()}`
                            : '₦0'}
                        </StatNumber>
                        <StatHelpText>
                          {penalties.isPaid ? (
                            <Badge colorScheme="green">Paid</Badge>
                          ) : penalties.penaltyAmount > 0 ? (
                            <Badge colorScheme="red">Unpaid</Badge>
                          ) : (
                            <Badge colorScheme="gray">None</Badge>
                          )}
                        </StatHelpText>
                      </Stat>
                    )}
                  </Flex>

                  <Box mb={4}>
                    <Text fontWeight="medium" mb={2}>
                      Attendance Progress
                    </Text>
                    <Progress
                      value={attendancePercentage}
                      colorScheme={getProgressColor(attendancePercentage)}
                      height="24px"
                      borderRadius="md"
                    />
                    <Flex justify="space-between" mt={1}>
                      <Text fontSize="sm">0%</Text>
                      <Text
                        fontSize="sm"
                        fontWeight={
                          attendancePercentage >= 50 ? 'bold' : 'normal'
                        }
                      >
                        50% (Required)
                      </Text>
                      <Text fontSize="sm">100%</Text>
                    </Flex>
                  </Box>

                  {belowThreshold && (
                    <Alert status="warning" borderRadius="md">
                      <AlertIcon as={FaExclamationTriangle} />
                      Your attendance is below the required 50% threshold. You
                      may be subject to penalties at the end of the year.
                    </Alert>
                  )}
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Attendance Details Tabs */}
          <Card>
            <CardBody>
              <Tabs variant="enclosed">
                <TabList>
                  <Tab>Meetings</Tab>
                  <Tab>All Events</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel>
                    <Heading size="md" mb={4}>
                      Meeting Attendance
                    </Heading>

                    {meetingEvents.length === 0 ? (
                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        No meetings found for {year}.
                      </Alert>
                    ) : (
                      <Box overflowX="auto">
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Meeting</Th>
                              <Th>Date</Th>
                              <Th>Venue</Th>
                              <Th>Status</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {meetingEvents
                              .sort(
                                (a, b) =>
                                  new Date(b.startDate).getTime() -
                                  new Date(a.startDate).getTime()
                              )
                              .map((event) => (
                                <Tr key={event._id}>
                                  <Td fontWeight="medium">{event.title}</Td>
                                  <Td>{formatDate(event.startDate)}</Td>
                                  <Td>
                                    {event.location.virtual
                                      ? 'Virtual Meeting'
                                      : event.location.name}
                                  </Td>
                                  <Td>
                                    {attendedEvents.includes(event._id) ? (
                                      <Badge colorScheme="green">Present</Badge>
                                    ) : new Date(event.endDate) > new Date() ? (
                                      <Badge colorScheme="blue">Upcoming</Badge>
                                    ) : (
                                      <Badge colorScheme="red">Absent</Badge>
                                    )}
                                  </Td>
                                </Tr>
                              ))}
                          </Tbody>
                        </Table>
                      </Box>
                    )}
                  </TabPanel>

                  <TabPanel>
                    <Heading size="md" mb={4}>
                      All Events Attendance
                    </Heading>

                    {events.length === 0 ? (
                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        No events found for {year}.
                      </Alert>
                    ) : (
                      <Box overflowX="auto">
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Event</Th>
                              <Th>Type</Th>
                              <Th>Date</Th>
                              <Th>Venue</Th>
                              <Th>Status</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {events
                              .sort(
                                (a, b) =>
                                  new Date(b.startDate).getTime() -
                                  new Date(a.startDate).getTime()
                              )
                              .map((event) => (
                                <Tr key={event._id}>
                                  <Td fontWeight="medium">{event.title}</Td>
                                  <Td>
                                    <Badge
                                      colorScheme={
                                        event.eventType === 'meetings'
                                          ? 'yellow'
                                          : event.eventType === 'conference'
                                          ? 'purple'
                                          : event.eventType === 'workshop'
                                          ? 'green'
                                          : event.eventType === 'seminar'
                                          ? 'blue'
                                          : 'gray'
                                      }
                                    >
                                      {event.eventType}
                                    </Badge>
                                  </Td>
                                  <Td>{formatDate(event.startDate)}</Td>
                                  <Td>
                                    {event.location.virtual
                                      ? 'Virtual Event'
                                      : event.location.name}
                                  </Td>
                                  <Td>
                                    {attendedEvents.includes(event._id) ? (
                                      <Badge colorScheme="green">Present</Badge>
                                    ) : new Date(event.endDate) > new Date() ? (
                                      <Badge colorScheme="blue">Upcoming</Badge>
                                    ) : (
                                      <Badge colorScheme="red">Absent</Badge>
                                    )}
                                  </Td>
                                </Tr>
                              ))}
                          </Tbody>
                        </Table>
                      </Box>
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>
        </>
      )}
    </Box>
  );
};

export default MemberAttendanceStatus;
