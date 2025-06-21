import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Button,
  Icon,
  VStack,
  HStack,
  Text,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,  Avatar,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  AvatarGroup,
} from '@chakra-ui/react';
import {
  FiUserCheck,
  FiClock,
  FiMapPin,
  FiEdit3,
  FiEye,
  FiMoreVertical,
  FiSearch,
  FiFilter,
  FiDownload,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiBarChart,
  FiTrendingUp,
  FiUserPlus,
} from 'react-icons/fi';

interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  memberRole: string;
  avatar?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  expectedAttendees: number;
  checkedInCount: number;
}

const AttendanceManagement: React.FC = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState(0);

  // Theme colors
  const bg = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  // Mock data for events
  const [events] = useState<Event[]>([
    {
      id: '1',
      title: 'Annual Pharmacy Conference 2024',
      date: '2024-03-15',
      time: '09:00',
      location: 'Lagos State University Teaching Hospital',
      type: 'conference',
      expectedAttendees: 200,
      checkedInCount: 145,
    },
    {
      id: '2',
      title: 'CPD Workshop: Clinical Pharmacy',
      date: '2024-02-28',
      time: '14:00',
      location: 'ACPN Ota Zone Office',
      type: 'workshop',
      expectedAttendees: 50,
      checkedInCount: 38,
    },
    {
      id: '3',
      title: 'Monthly General Meeting',
      date: '2024-02-20',
      time: '10:00',
      location: 'Community Hall, Ota',
      type: 'meeting',
      expectedAttendees: 80,
      checkedInCount: 67,
    },
  ]);

  // Mock attendance data
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: '1',
      memberId: 'M001',
      memberName: 'Dr. Adebayo Smith',
      memberEmail: 'adebayo.smith@email.com',
      eventId: '1',
      eventTitle: 'Annual Pharmacy Conference 2024',
      eventDate: '2024-03-15',
      checkInTime: '09:15',
      checkOutTime: '17:30',
      status: 'present',
      memberRole: 'Chairman',
    },
    {
      id: '2',
      memberId: 'M002',
      memberName: 'Pharm. Johnson Emmanuel',
      memberEmail: 'johnson.emmanuel@email.com',
      eventId: '1',
      eventTitle: 'Annual Pharmacy Conference 2024',
      eventDate: '2024-03-15',
      checkInTime: '09:45',
      status: 'late',
      memberRole: 'Secretary',
    },
    {
      id: '3',
      memberId: 'M003',
      memberName: 'Dr. Sarah Williams',
      memberEmail: 'sarah.williams@email.com',
      eventId: '1',
      eventTitle: 'Annual Pharmacy Conference 2024',
      eventDate: '2024-03-15',
      status: 'absent',
      memberRole: 'Member',
      notes: 'Emergency at hospital',
    },
    {
      id: '4',
      memberId: 'M004',
      memberName: 'Pharm. Michael Chen',
      memberEmail: 'michael.chen@email.com',
      eventId: '2',
      eventTitle: 'CPD Workshop: Clinical Pharmacy',
      eventDate: '2024-02-28',
      checkInTime: '14:00',
      checkOutTime: '18:00',
      status: 'present',
      memberRole: 'Member',
    },
    {
      id: '5',
      memberId: 'M005',
      memberName: 'Dr. Elizabeth Okafor',
      memberEmail: 'elizabeth.okafor@email.com',
      eventId: '2',
      eventTitle: 'CPD Workshop: Clinical Pharmacy',
      eventDate: '2024-02-28',
      status: 'excused',
      memberRole: 'Treasurer',
      notes: 'Pre-approved absence',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'green';
      case 'late': return 'yellow';
      case 'absent': return 'red';
      case 'excused': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return FiCheckCircle;
      case 'late': return FiAlertCircle;
      case 'absent': return FiXCircle;
      case 'excused': return FiCheckCircle;
      default: return FiAlertCircle;
    }
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    onOpen();
  };

  const handleMarkAttendance = (recordId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendanceRecords(records =>
      records.map(record =>
        record.id === recordId
          ? { ...record, status, checkInTime: status === 'present' ? new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined }
          : record
      )
    );
    toast({
      title: 'Attendance updated',
      description: `Member marked as ${status}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.memberEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEvent = filterEvent === 'all' || record.eventId === filterEvent;
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesEvent && matchesStatus;
  });

  const getAttendanceStats = () => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const late = attendanceRecords.filter(r => r.status === 'late').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const excused = attendanceRecords.filter(r => r.status === 'excused').length;
    
    return { total, present, late, absent, excused };
  };

  const stats = getAttendanceStats();

  const EventCard: React.FC<{ event: Event }> = ({ event }) => {
    const attendanceRate = event.expectedAttendees > 0 ? (event.checkedInCount / event.expectedAttendees) * 100 : 0;
    
    return (
      <Card bg={cardBg} shadow="sm" borderRadius="xl" border="1px" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Flex justify="space-between" align="start">
            <VStack align="start" spacing={1} flex={1}>
              <Heading size="sm" color="gray.800">{event.title}</Heading>
              <HStack spacing={2}>
                <Badge colorScheme="blue" size="sm">{event.type}</Badge>
                <Text fontSize="xs" color={textColor}>
                  {new Date(event.date).toLocaleDateString()}
                </Text>
              </HStack>
            </VStack>
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<Icon as={FiMoreVertical} />}
                variant="ghost"
                size="sm"
              />
              <MenuList>
                <MenuItem icon={<Icon as={FiEye} />}>View Details</MenuItem>
                <MenuItem icon={<Icon as={FiUserCheck} />}>Mark Attendance</MenuItem>
                <MenuItem icon={<Icon as={FiBarChart} />}>View Reports</MenuItem>
                <MenuItem icon={<Icon as={FiDownload} />}>Export List</MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </CardHeader>
        <CardBody pt={0}>
          <VStack align="start" spacing={3}>
            <HStack spacing={4} w="full">
              <HStack spacing={1}>
                <Icon as={FiClock} color={textColor} size="sm" />
                <Text fontSize="sm" color={textColor}>{event.time}</Text>
              </HStack>
              <HStack spacing={1}>
                <Icon as={FiMapPin} color={textColor} size="sm" />
                <Text fontSize="sm" color={textColor} noOfLines={1}>
                  {event.location}
                </Text>
              </HStack>
            </HStack>
            
            <Box w="full">
              <Flex justify="space-between" mb={2}>
                <Text fontSize="sm" color={textColor}>Attendance Rate</Text>
                <Text fontSize="sm" fontWeight="semibold">
                  {event.checkedInCount}/{event.expectedAttendees} ({attendanceRate.toFixed(0)}%)
                </Text>
              </Flex>
              <Progress
                value={attendanceRate}
                colorScheme={attendanceRate >= 80 ? 'green' : attendanceRate >= 60 ? 'yellow' : 'red'}
                borderRadius="full"
                size="sm"
              />
            </Box>

            {/* Recent attendees avatars */}
            <Box w="full">
              <Text fontSize="xs" color={textColor} mb={2}>Recent Check-ins</Text>
              <AvatarGroup size="sm" max={5}>
                {attendanceRecords
                  .filter(r => r.eventId === event.id && r.status === 'present')
                  .slice(0, 5)
                  .map(record => (
                    <Avatar key={record.id} name={record.memberName} size="sm" />
                  ))
                }
              </AvatarGroup>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  return (
    <Box p={6} bg={bg} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="gray.800">
              Attendance Management
            </Heading>
            <Text color={textColor}>
              Track and manage event attendance for ACPN Ota Zone
            </Text>
          </VStack>
          <HStack>
            <Button
              leftIcon={<Icon as={FiUserPlus} />}
              colorScheme="brand"
              size="md"
              borderRadius="xl"
            >
              Manual Check-in
            </Button>
            <Button
              leftIcon={<Icon as={FiDownload} />}
              variant="outline"
              size="md"
              borderRadius="xl"
            >
              Export Report
            </Button>
          </HStack>
        </Flex>

        {/* Stats Cards */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(5, 1fr)" }} gap={6}>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Total Records</StatLabel>
                  <StatNumber>{stats.total}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    8% this month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Present</StatLabel>
                  <StatNumber color="green.500">{stats.present}</StatNumber>
                  <StatHelpText>
                    {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}% of total
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Late</StatLabel>
                  <StatNumber color="yellow.500">{stats.late}</StatNumber>
                  <StatHelpText>
                    {stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}% of total
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Absent</StatLabel>
                  <StatNumber color="red.500">{stats.absent}</StatNumber>
                  <StatHelpText>
                    {stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}% of total
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Excused</StatLabel>
                  <StatNumber color="blue.500">{stats.excused}</StatNumber>
                  <StatHelpText>
                    {stats.total > 0 ? Math.round((stats.excused / stats.total) * 100) : 0}% of total
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Main Content */}
        <Card bg={cardBg} shadow="sm" borderRadius="xl">
          <CardBody>
            <Tabs index={activeTab} onChange={setActiveTab}>
              <TabList>
                <Tab>Attendance Records</Tab>
                <Tab>Event Overview</Tab>
                <Tab>Analytics</Tab>
              </TabList>

              <TabPanels>
                {/* Attendance Records Tab */}
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {/* Filters */}
                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                      <HStack spacing={4} flex={1}>
                        <InputGroup maxW="300px">
                          <InputLeftElement>
                            <Icon as={FiSearch} color={textColor} />
                          </InputLeftElement>
                          <Input
                            placeholder="Search members..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            borderRadius="xl"
                          />
                        </InputGroup>
                        
                        <Select
                          placeholder="All Events"
                          value={filterEvent}
                          onChange={(e) => setFilterEvent(e.target.value)}
                          maxW="200px"
                          borderRadius="xl"
                        >
                          {events.map(event => (
                            <option key={event.id} value={event.id}>
                              {event.title}
                            </option>
                          ))}
                        </Select>

                        <Select
                          placeholder="All Status"
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          maxW="150px"
                          borderRadius="xl"
                        >
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="absent">Absent</option>
                          <option value="excused">Excused</option>
                        </Select>
                      </HStack>

                      <HStack>
                        <IconButton
                          icon={<Icon as={FiFilter} />}
                          aria-label="Advanced filters"
                          variant="outline"
                          borderRadius="xl"
                        />
                        <IconButton
                          icon={<Icon as={FiDownload} />}
                          aria-label="Export records"
                          variant="outline"
                          borderRadius="xl"
                        />
                      </HStack>
                    </Flex>

                    {/* Records Table */}
                    <TableContainer>
                      <Table variant="simple">
                        <Thead bg={headerBg}>
                          <Tr>
                            <Th>Member</Th>
                            <Th>Event</Th>
                            <Th>Date</Th>
                            <Th>Check-in Time</Th>
                            <Th>Status</Th>
                            <Th>Notes</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredRecords.map((record) => (
                            <Tr key={record.id}>
                              <Td>
                                <HStack spacing={3}>
                                  <Avatar size="sm" name={record.memberName} />
                                  <VStack align="start" spacing={0}>
                                    <Text fontWeight="medium" fontSize="sm">
                                      {record.memberName}
                                    </Text>
                                    <Text fontSize="xs" color={textColor}>
                                      {record.memberRole}
                                    </Text>
                                  </VStack>
                                </HStack>
                              </Td>
                              <Td>
                                <Text fontSize="sm" noOfLines={1}>
                                  {record.eventTitle}
                                </Text>
                              </Td>
                              <Td>
                                <Text fontSize="sm">
                                  {new Date(record.eventDate).toLocaleDateString()}
                                </Text>
                              </Td>
                              <Td>
                                <Text fontSize="sm">
                                  {record.checkInTime || '-'}
                                </Text>
                              </Td>
                              <Td>
                                <Badge
                                  colorScheme={getStatusColor(record.status)}
                                  variant="subtle"
                                  display="flex"
                                  alignItems="center"
                                  w="fit-content"
                                >
                                  <Icon as={getStatusIcon(record.status)} mr={1} />
                                  {record.status}
                                </Badge>
                              </Td>
                              <Td>
                                <Text fontSize="sm" noOfLines={1}>
                                  {record.notes || '-'}
                                </Text>
                              </Td>
                              <Td>
                                <Menu>
                                  <MenuButton
                                    as={IconButton}
                                    icon={<Icon as={FiMoreVertical} />}
                                    variant="ghost"
                                    size="sm"
                                  />
                                  <MenuList>
                                    <MenuItem
                                      icon={<Icon as={FiEdit3} />}
                                      onClick={() => handleEditRecord(record)}
                                    >
                                      Edit Record
                                    </MenuItem>
                                    <MenuItem
                                      icon={<Icon as={FiCheckCircle} />}
                                      onClick={() => handleMarkAttendance(record.id, 'present')}
                                    >
                                      Mark Present
                                    </MenuItem>
                                    <MenuItem
                                      icon={<Icon as={FiXCircle} />}
                                      onClick={() => handleMarkAttendance(record.id, 'absent')}
                                    >
                                      Mark Absent
                                    </MenuItem>
                                    <MenuItem
                                      icon={<Icon as={FiAlertCircle} />}
                                      onClick={() => handleMarkAttendance(record.id, 'late')}
                                    >
                                      Mark Late
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>

                    {filteredRecords.length === 0 && (
                      <Box textAlign="center" py={10}>
                        <Icon as={FiUserCheck} boxSize={12} color={textColor} mb={4} />
                        <Heading size="md" color={textColor} mb={2}>
                          No attendance records found
                        </Heading>
                        <Text color={textColor}>
                          {searchTerm || filterEvent !== 'all' || filterStatus !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Attendance records will appear here'
                          }
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* Event Overview Tab */}
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    <Flex justify="between" align="center">
                      <Heading size="md">Recent Events</Heading>
                      <Button size="sm" variant="outline" borderRadius="xl">
                        View All Events
                      </Button>
                    </Flex>
                    
                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "repeat(2, 1fr)",
                        lg: "repeat(3, 1fr)",
                      }}
                      gap={6}
                    >
                      {events.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </Grid>
                  </VStack>
                </TabPanel>

                {/* Analytics Tab */}
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    <Heading size="md">Attendance Analytics</Heading>
                    
                    <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
                      <GridItem>
                        <Card bg={cardBg} shadow="sm">
                          <CardHeader>
                            <Heading size="sm">Attendance Trends</Heading>
                          </CardHeader>
                          <CardBody>
                            <Box h="300px" display="flex" alignItems="center" justifyContent="center" color={textColor}>
                              <VStack>
                                <Icon as={FiTrendingUp} boxSize={12} />
                                <Text>Chart component would go here</Text>
                                <Text fontSize="sm">Showing attendance trends over time</Text>
                              </VStack>
                            </Box>
                          </CardBody>
                        </Card>
                      </GridItem>
                      
                      <GridItem>
                        <Card bg={cardBg} shadow="sm">
                          <CardHeader>
                            <Heading size="sm">Top Attendees</Heading>
                          </CardHeader>
                          <CardBody>
                            <VStack spacing={3} align="stretch">
                              {attendanceRecords
                                .filter(r => r.status === 'present')
                                .slice(0, 5)
                                .map((record, index) => (
                                  <HStack key={record.id} justify="space-between">
                                    <HStack>
                                      <Text fontSize="sm" fontWeight="bold" color={textColor}>
                                        #{index + 1}
                                      </Text>
                                      <Avatar size="sm" name={record.memberName} />
                                      <VStack align="start" spacing={0}>
                                        <Text fontSize="sm" fontWeight="medium">
                                          {record.memberName}
                                        </Text>
                                        <Text fontSize="xs" color={textColor}>
                                          {record.memberRole}
                                        </Text>
                                      </VStack>
                                    </HStack>
                                    <Badge colorScheme="green" size="sm">
                                      Present
                                    </Badge>
                                  </HStack>
                                ))
                              }
                            </VStack>
                          </CardBody>
                        </Card>
                      </GridItem>
                    </Grid>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>

      {/* Edit Record Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>Edit Attendance Record</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Member</FormLabel>
                <Text fontWeight="medium">{selectedRecord?.memberName}</Text>
                <Text fontSize="sm" color={textColor}>{selectedRecord?.memberEmail}</Text>
              </FormControl>

              <FormControl>
                <FormLabel>Event</FormLabel>
                <Text fontWeight="medium">{selectedRecord?.eventTitle}</Text>
                <Text fontSize="sm" color={textColor}>
                  {selectedRecord?.eventDate && new Date(selectedRecord.eventDate).toLocaleDateString()}
                </Text>
              </FormControl>

              <HStack w="full" spacing={4}>
                <FormControl>
                  <FormLabel>Check-in Time</FormLabel>
                  <Input
                    type="time"
                    borderRadius="xl"
                    defaultValue={selectedRecord?.checkInTime}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Check-out Time</FormLabel>
                  <Input
                    type="time"
                    borderRadius="xl"
                    defaultValue={selectedRecord?.checkOutTime}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select borderRadius="xl" defaultValue={selectedRecord?.status}>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="excused">Excused</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Input
                  placeholder="Add any notes..."
                  borderRadius="xl"
                  defaultValue={selectedRecord?.notes}
                />
              </FormControl>

              <HStack spacing={4} w="full" pt={4}>
                <Button variant="outline" onClick={onClose} flex={1} borderRadius="xl">
                  Cancel
                </Button>
                <Button colorScheme="brand" flex={1} borderRadius="xl">
                  Update Record
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AttendanceManagement;
