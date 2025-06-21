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
  Textarea,
  Select,
  Switch,
  useToast,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Divider,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiEdit3,
  FiTrash2,
  FiMoreVertical,
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiUserCheck,
  FiBarChart,
} from 'react-icons/fi';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'meeting' | 'workshop' | 'conference' | 'social';
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  maxAttendees?: number;
  registeredCount: number;
  isPublic: boolean;
  organizer: string;
  createdAt: string;
}

const EventManagement: React.FC = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Theme colors
  const bg = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');


  // Mock data
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Annual Pharmacy Conference 2024',
      description: 'Join us for our annual conference featuring the latest in pharmaceutical advances.',
      date: '2024-03-15',
      time: '09:00',
      location: 'Lagos State University Teaching Hospital',
      type: 'conference',
      status: 'published',
      maxAttendees: 200,
      registeredCount: 145,
      isPublic: true,
      organizer: 'Dr. Adebayo Smith',
      createdAt: '2024-01-10',
    },
    {
      id: '2',
      title: 'CPD Workshop: Clinical Pharmacy',
      description: 'Continuing Professional Development workshop on clinical pharmacy practices.',
      date: '2024-02-28',
      time: '14:00',
      location: 'ACPN Ota Zone Office',
      type: 'workshop',
      status: 'published',
      maxAttendees: 50,
      registeredCount: 38,
      isPublic: false,
      organizer: 'Pharm. Johnson Emmanuel',
      createdAt: '2024-01-05',
    },
    {
      id: '3',
      title: 'Monthly General Meeting',
      description: 'Regular monthly meeting to discuss zone activities and updates.',
      date: '2024-02-20',
      time: '10:00',
      location: 'Community Hall, Ota',
      type: 'meeting',
      status: 'completed',
      registeredCount: 67,
      isPublic: false,
      organizer: 'Admin Team',
      createdAt: '2024-01-15',
    },
  ]);

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setIsEditing(false);
    onOpen();
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsEditing(true);
    onOpen();
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
    toast({
      title: 'Event deleted',
      description: 'The event has been successfully deleted.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'green';
      case 'draft': return 'yellow';
      case 'cancelled': return 'red';
      case 'completed': return 'blue';
      default: return 'gray';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'conference': return 'purple';
      case 'workshop': return 'orange';
      case 'meeting': return 'blue';
      case 'social': return 'pink';
      default: return 'gray';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    const matchesType = filterType === 'all' || event.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const EventCard: React.FC<{ event: Event }> = ({ event }) => (
    <Card bg={cardBg} shadow="sm" borderRadius="xl" border="1px" borderColor={borderColor}>
      <CardHeader pb={2}>
        <Flex justify="space-between" align="start">
          <VStack align="start" spacing={1} flex={1}>
            <Heading size="sm" color="gray.800">{event.title}</Heading>
            <HStack spacing={2}>
              <Badge colorScheme={getStatusColor(event.status)} size="sm">
                {event.status}
              </Badge>
              <Badge colorScheme={getTypeColor(event.type)} variant="outline" size="sm">
                {event.type}
              </Badge>
              {!event.isPublic && (
                <Badge colorScheme="gray" size="sm">Private</Badge>
              )}
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
              <MenuItem icon={<Icon as={FiEdit3} />} onClick={() => handleEditEvent(event)}>
                Edit Event
              </MenuItem>
              <MenuItem icon={<Icon as={FiUserCheck} />}>Manage Attendees</MenuItem>
              <MenuItem icon={<Icon as={FiBarChart} />}>View Analytics</MenuItem>
              <Divider />
              <MenuItem 
                icon={<Icon as={FiTrash2} />} 
                color="red.500"
                onClick={() => handleDeleteEvent(event.id)}
              >
                Delete
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </CardHeader>
      <CardBody pt={0}>
        <VStack align="start" spacing={3}>
          <Text fontSize="sm" color={textColor} noOfLines={2}>
            {event.description}
          </Text>
          
          <VStack align="start" spacing={2} w="full">
            <HStack spacing={4}>
              <HStack spacing={1}>
                <Icon as={FiCalendar} color={textColor} size="sm" />
                <Text fontSize="sm" color={textColor}>
                  {new Date(event.date).toLocaleDateString()}
                </Text>
              </HStack>
              <HStack spacing={1}>
                <Icon as={FiClock} color={textColor} size="sm" />
                <Text fontSize="sm" color={textColor}>{event.time}</Text>
              </HStack>
            </HStack>
            
            <HStack spacing={1}>
              <Icon as={FiMapPin} color={textColor} size="sm" />
              <Text fontSize="sm" color={textColor} noOfLines={1}>
                {event.location}
              </Text>
            </HStack>
            
            <HStack spacing={1}>
              <Icon as={FiUsers} color={textColor} size="sm" />
              <Text fontSize="sm" color={textColor}>
                {event.registeredCount} registered
                {event.maxAttendees && ` / ${event.maxAttendees} max`}
              </Text>
            </HStack>
          </VStack>

          <HStack spacing={2} w="full">
            <Avatar size="xs" name={event.organizer} />
            <Text fontSize="xs" color={textColor}>
              Organized by {event.organizer}
            </Text>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <Box p={6} bg={bg} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="gray.800">
              Event Management
            </Heading>
            <Text color={textColor}>
              Create and manage events for ACPN Ota Zone members
            </Text>
          </VStack>
          <Button
            leftIcon={<Icon as={FiPlus} />}
            colorScheme="brand"
            onClick={handleCreateEvent}
            size="md"
            borderRadius="xl"
          >
            Create Event
          </Button>
        </Flex>

        {/* Stats Cards */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={6}>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Total Events</StatLabel>
                  <StatNumber>{events.length}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    12% this month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Published Events</StatLabel>
                  <StatNumber>{events.filter(e => e.status === 'published').length}</StatNumber>
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
                  <StatLabel color={textColor}>Total Registrations</StatLabel>
                  <StatNumber>
                    {events.reduce((sum, event) => sum + event.registeredCount, 0)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    23% this month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Upcoming Events</StatLabel>
                  <StatNumber>
                    {events.filter(e => e.status === 'published' && new Date(e.date) > new Date()).length}
                  </StatNumber>
                  <StatHelpText>Next event in 5 days</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Filters and Search */}
        <Card bg={cardBg} shadow="sm">
          <CardBody>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <HStack spacing={4} flex={1}>
                <InputGroup maxW="300px">
                  <InputLeftElement>
                    <Icon as={FiSearch} color={textColor} />
                  </InputLeftElement>
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    borderRadius="xl"
                  />
                </InputGroup>
                
                <Select
                  placeholder="All Statuses"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  maxW="150px"
                  borderRadius="xl"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>

                <Select
                  placeholder="All Types"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  maxW="150px"
                  borderRadius="xl"
                >
                  <option value="meeting">Meeting</option>
                  <option value="workshop">Workshop</option>
                  <option value="conference">Conference</option>
                  <option value="social">Social</option>
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
                  aria-label="Export events"
                  variant="outline"
                  borderRadius="xl"
                />
              </HStack>
            </Flex>
          </CardBody>
        </Card>

        {/* Events Grid */}
        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          }}
          gap={6}
        >
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </Grid>

        {filteredEvents.length === 0 && (
          <Box textAlign="center" py={10}>
            <Icon as={FiCalendar} boxSize={12} color={textColor} mb={4} />
            <Heading size="md" color={textColor} mb={2}>
              No events found
            </Heading>
            <Text color={textColor}>
              {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first event to get started'
              }
            </Text>
          </Box>
        )}
      </VStack>

      {/* Create/Edit Event Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Event Title</FormLabel>
                <Input
                  placeholder="Enter event title"
                  borderRadius="xl"
                  defaultValue={selectedEvent?.title}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Enter event description"
                  borderRadius="xl"
                  defaultValue={selectedEvent?.description}
                />
              </FormControl>

              <HStack w="full" spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Date</FormLabel>
                  <Input
                    type="date"
                    borderRadius="xl"
                    defaultValue={selectedEvent?.date}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Time</FormLabel>
                  <Input
                    type="time"
                    borderRadius="xl"
                    defaultValue={selectedEvent?.time}
                  />
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel>Location</FormLabel>
                <Input
                  placeholder="Enter event location"
                  borderRadius="xl"
                  defaultValue={selectedEvent?.location}
                />
              </FormControl>

              <HStack w="full" spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Event Type</FormLabel>
                  <Select
                    borderRadius="xl"
                    defaultValue={selectedEvent?.type}
                  >
                    <option value="meeting">Meeting</option>
                    <option value="workshop">Workshop</option>
                    <option value="conference">Conference</option>
                    <option value="social">Social</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Max Attendees</FormLabel>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    borderRadius="xl"
                    defaultValue={selectedEvent?.maxAttendees}
                  />
                </FormControl>
              </HStack>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Public Event</FormLabel>
                <Switch
                  colorScheme="brand"
                  defaultChecked={selectedEvent?.isPublic}
                />
              </FormControl>

              <HStack spacing={4} w="full" pt={4}>
                <Button variant="outline" onClick={onClose} flex={1} borderRadius="xl">
                  Cancel
                </Button>
                <Button colorScheme="brand" flex={1} borderRadius="xl">
                  {isEditing ? 'Update Event' : 'Create Event'}
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default EventManagement;
