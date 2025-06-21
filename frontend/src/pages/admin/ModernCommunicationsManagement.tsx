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
  ModalOverlay,  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Divider,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Checkbox,
  CheckboxGroup,
  Stack,
} from '@chakra-ui/react';
import {
  FiMail,
  FiSend,
  FiUsers,
  FiCalendar,
  FiClock,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiMoreVertical,
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiFileText,
  FiPaperclip,
} from 'react-icons/fi';

interface Communication {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'newsletter' | 'reminder' | 'urgent' | 'general';
  status: 'draft' | 'sent' | 'scheduled' | 'failed';
  recipients: string[];
  recipientGroups: string[];
  sentDate?: string;
  scheduledDate?: string;
  openRate?: number;
  clickRate?: number;
  author: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  attachments?: string[];
  createdAt: string;
}

interface CommunicationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: string;
  usageCount: number;
}

const ModernCommunicationsManagement: React.FC = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState(0);

  // Theme colors
  const bg = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');


  // Mock data
  const [communications, setCommunications] = useState<Communication[]>([
    {
      id: '1',
      title: 'Monthly Newsletter - February 2024',
      content: 'Dear members, welcome to our February newsletter featuring updates on CPD activities...',
      type: 'newsletter',
      status: 'sent',
      recipients: ['all-members'],
      recipientGroups: ['Members', 'Executives'],
      sentDate: '2024-02-01',
      openRate: 78,
      clickRate: 23,
      author: 'Communications Team',
      priority: 'medium',
      createdAt: '2024-01-28',
    },
    {
      id: '2',
      title: 'Upcoming CPD Workshop Registration',
      content: 'Registration is now open for our Clinical Pharmacy workshop scheduled for February 28th...',
      type: 'announcement',
      status: 'sent',
      recipients: ['active-members'],
      recipientGroups: ['Active Members'],
      sentDate: '2024-02-15',
      openRate: 85,
      clickRate: 45,
      author: 'Dr. Adebayo Smith',
      priority: 'high',
      createdAt: '2024-02-14',
    },
    {
      id: '3',
      title: 'Annual General Meeting Reminder',
      content: 'This is a reminder about our Annual General Meeting scheduled for March 15th...',
      type: 'reminder',
      status: 'scheduled',
      recipients: ['all-members'],
      recipientGroups: ['All Members'],
      scheduledDate: '2024-03-10',
      author: 'Secretary',
      priority: 'high',
      createdAt: '2024-02-20',
    },
    {
      id: '4',
      title: 'Emergency: System Maintenance',
      content: 'Urgent notice: Our member portal will be undergoing emergency maintenance...',
      type: 'urgent',
      status: 'sent',
      recipients: ['all-members'],
      recipientGroups: ['All Members'],
      sentDate: '2024-02-22',
      openRate: 92,
      clickRate: 15,
      author: 'IT Administrator',
      priority: 'urgent',
      createdAt: '2024-02-22',
    },
    {
      id: '5',
      title: 'Welcome Package for New Members',
      content: 'Welcome to ACPN Ota Zone! This package contains important information...',
      type: 'general',
      status: 'draft',
      recipients: ['new-members'],
      recipientGroups: ['New Members'],
      author: 'Membership Committee',
      priority: 'low',
      createdAt: '2024-02-25',
    },
  ]);

  const [templates] = useState<CommunicationTemplate[]>([
    {
      id: 't1',
      name: 'Monthly Newsletter',
      subject: 'ACPN Ota Zone Monthly Newsletter',
      content: 'Dear members, welcome to our monthly newsletter...',
      type: 'newsletter',
      usageCount: 12,
    },
    {
      id: 't2',
      name: 'Event Announcement',
      subject: 'Upcoming Event: [EVENT_NAME]',
      content: 'We are pleased to announce an upcoming event...',
      type: 'announcement',
      usageCount: 8,
    },
    {
      id: 't3',
      name: 'Meeting Reminder',
      subject: 'Reminder: [MEETING_NAME]',
      content: 'This is a friendly reminder about our upcoming meeting...',
      type: 'reminder',
      usageCount: 15,
    },
  ]);

  const recipientGroups = [
    'All Members',
    'Active Members',
    'New Members',
    'Executives',
    'Committee Members',
    'Pharmacists',
    'Interns',
    'Honorary Members',
  ];

  const handleCreateCommunication = () => {
    setSelectedCommunication(null);
    setIsEditing(false);
    onOpen();
  };

  const handleEditCommunication = (communication: Communication) => {
    setSelectedCommunication(communication);
    setIsEditing(true);
    onOpen();
  };

  const handleDeleteCommunication = (communicationId: string) => {
    setCommunications(communications.filter(c => c.id !== communicationId));
    toast({
      title: 'Communication deleted',
      description: 'The communication has been successfully deleted.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleSendCommunication = (communicationId: string) => {
    setCommunications(communications.map(communication =>
      communication.id === communicationId
        ? { ...communication, status: 'sent', sentDate: new Date().toISOString().split('T')[0] }
        : communication
    ));
    toast({
      title: 'Communication sent',
      description: 'The communication has been successfully sent.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return 'blue';
      case 'newsletter': return 'green';
      case 'reminder': return 'yellow';
      case 'urgent': return 'red';
      case 'general': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'green';
      case 'draft': return 'yellow';
      case 'scheduled': return 'blue';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const filteredCommunications = communications.filter(communication => {
    const matchesSearch = communication.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         communication.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || communication.type === filterType;
    const matchesStatus = filterStatus === 'all' || communication.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getCommunicationStats = () => {
    const totalCommunications = communications.length;
    const sentCommunications = communications.filter(c => c.status === 'sent').length;
    const draftCommunications = communications.filter(c => c.status === 'draft').length;
    const scheduledCommunications = communications.filter(c => c.status === 'scheduled').length;
    const avgOpenRate = communications
      .filter(c => c.openRate)
      .reduce((sum, c) => sum + (c.openRate || 0), 0) / communications.filter(c => c.openRate).length || 0;
    
    return { totalCommunications, sentCommunications, draftCommunications, scheduledCommunications, avgOpenRate };
  };

  const stats = getCommunicationStats();

  const CommunicationCard: React.FC<{ communication: Communication }> = ({ communication }) => (
    <Card bg={cardBg} shadow="sm" borderRadius="xl" border="1px" borderColor={borderColor}>
      <CardHeader pb={2}>
        <Flex justify="space-between" align="start">
          <VStack align="start" spacing={1} flex={1}>
            <Heading size="sm" color="gray.800" noOfLines={1}>{communication.title}</Heading>
            <HStack spacing={2} flexWrap="wrap">
              <Badge colorScheme={getTypeColor(communication.type)} size="sm">
                {communication.type}
              </Badge>
              <Badge colorScheme={getStatusColor(communication.status)} size="sm">
                {communication.status}
              </Badge>
              <Badge colorScheme={getPriorityColor(communication.priority)} variant="outline" size="sm">
                {communication.priority}
              </Badge>
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
              <MenuItem icon={<Icon as={FiEdit3} />} onClick={() => handleEditCommunication(communication)}>
                Edit
              </MenuItem>
              {communication.status === 'draft' && (
                <MenuItem 
                  icon={<Icon as={FiSend} />}
                  onClick={() => handleSendCommunication(communication.id)}
                >
                  Send Now
                </MenuItem>
              )}
              <MenuItem icon={<Icon as={FiFileText} />}>View Analytics</MenuItem>
              <Divider />
              <MenuItem 
                icon={<Icon as={FiTrash2} />} 
                color="red.500"
                onClick={() => handleDeleteCommunication(communication.id)}
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
            {communication.content}
          </Text>
          
          <VStack align="start" spacing={2} w="full">
            <HStack spacing={1}>
              <Icon as={FiUsers} color={textColor} size="sm" />
              <Text fontSize="sm" color={textColor}>
                {communication.recipientGroups.join(', ')}
              </Text>
            </HStack>
            
            {communication.sentDate && (
              <HStack spacing={1}>
                <Icon as={FiCalendar} color={textColor} size="sm" />
                <Text fontSize="sm" color={textColor}>
                  Sent on {new Date(communication.sentDate).toLocaleDateString()}
                </Text>
              </HStack>
            )}
            
            {communication.scheduledDate && (
              <HStack spacing={1}>
                <Icon as={FiClock} color={textColor} size="sm" />
                <Text fontSize="sm" color={textColor}>
                  Scheduled for {new Date(communication.scheduledDate).toLocaleDateString()}
                </Text>
              </HStack>
            )}
            
            <HStack spacing={1}>
              <Icon as={FiMail} color={textColor} size="sm" />
              <Text fontSize="sm" color={textColor}>
                By {communication.author}
              </Text>
            </HStack>
          </VStack>

          {/* Analytics for sent communications */}
          {communication.status === 'sent' && communication.openRate && (
            <Box w="full" pt={2} borderTop="1px" borderColor={borderColor}>
              <Grid templateColumns="1fr 1fr" gap={4}>
                <Box textAlign="center">
                  <Text fontSize="lg" fontWeight="bold" color="green.500">
                    {communication.openRate}%
                  </Text>
                  <Text fontSize="xs" color={textColor}>Open Rate</Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="lg" fontWeight="bold" color="blue.500">
                    {communication.clickRate}%
                  </Text>
                  <Text fontSize="xs" color={textColor}>Click Rate</Text>
                </Box>
              </Grid>
            </Box>
          )}
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
              Communications Management
            </Heading>
            <Text color={textColor}>
              Manage newsletters, announcements, and member communications
            </Text>
          </VStack>
          <HStack>
            <Button
              leftIcon={<Icon as={FiPlus} />}
              colorScheme="brand"
              onClick={handleCreateCommunication}
              size="md"
              borderRadius="xl"
            >
              New Communication
            </Button>
            <Button
              leftIcon={<Icon as={FiFileText} />}
              variant="outline"
              size="md"
              borderRadius="xl"
            >
              Templates
            </Button>
          </HStack>
        </Flex>

        {/* Stats Cards */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(5, 1fr)" }} gap={6}>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Total Communications</StatLabel>
                  <StatNumber>{stats.totalCommunications}</StatNumber>
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
                  <StatLabel color={textColor}>Sent</StatLabel>
                  <StatNumber color="green.500">{stats.sentCommunications}</StatNumber>
                  <StatHelpText>Successfully delivered</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Drafts</StatLabel>
                  <StatNumber color="yellow.500">{stats.draftCommunications}</StatNumber>
                  <StatHelpText>Pending review</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Scheduled</StatLabel>
                  <StatNumber color="blue.500">{stats.scheduledCommunications}</StatNumber>
                  <StatHelpText>To be sent</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Avg. Open Rate</StatLabel>
                  <StatNumber>{stats.avgOpenRate.toFixed(1)}%</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    5% this month
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
                <Tab>All Communications</Tab>
                <Tab>Templates</Tab>
                <Tab>Analytics</Tab>
                <Tab>Recipients</Tab>
              </TabList>

              <TabPanels>
                {/* All Communications Tab */}
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {/* Filters and Search */}
                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                      <HStack spacing={4} flex={1}>
                        <InputGroup maxW="300px">
                          <InputLeftElement>
                            <Icon as={FiSearch} color={textColor} />
                          </InputLeftElement>
                          <Input
                            placeholder="Search communications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            borderRadius="xl"
                          />
                        </InputGroup>
                        
                        <Select
                          placeholder="All Types"
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          maxW="150px"
                          borderRadius="xl"
                        >
                          <option value="announcement">Announcement</option>
                          <option value="newsletter">Newsletter</option>
                          <option value="reminder">Reminder</option>
                          <option value="urgent">Urgent</option>
                          <option value="general">General</option>
                        </Select>

                        <Select
                          placeholder="All Status"
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          maxW="150px"
                          borderRadius="xl"
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="failed">Failed</option>
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
                          aria-label="Export communications"
                          variant="outline"
                          borderRadius="xl"
                        />
                      </HStack>
                    </Flex>

                    {/* Communications Grid */}
                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "repeat(2, 1fr)",
                        lg: "repeat(3, 1fr)",
                      }}
                      gap={6}
                    >
                      {filteredCommunications.map((communication) => (
                        <CommunicationCard key={communication.id} communication={communication} />
                      ))}
                    </Grid>

                    {filteredCommunications.length === 0 && (
                      <Box textAlign="center" py={10}>
                        <Icon as={FiMail} boxSize={12} color={textColor} mb={4} />
                        <Heading size="md" color={textColor} mb={2}>
                          No communications found
                        </Heading>
                        <Text color={textColor}>
                          {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Create your first communication to get started'
                          }
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* Templates Tab */}
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    <Flex justify="space-between" align="center">
                      <Heading size="md">Communication Templates</Heading>
                      <Button size="sm" colorScheme="brand" borderRadius="xl">
                        Create Template
                      </Button>
                    </Flex>

                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                      {templates.map((template) => (
                        <Card key={template.id} bg={cardBg} shadow="sm" borderRadius="xl">
                          <CardHeader>
                            <Flex justify="space-between" align="center">
                              <VStack align="start" spacing={1}>
                                <Heading size="sm">{template.name}</Heading>
                                <Badge colorScheme={getTypeColor(template.type)} size="sm">
                                  {template.type}
                                </Badge>
                              </VStack>
                              <Menu>
                                <MenuButton
                                  as={IconButton}
                                  icon={<Icon as={FiMoreVertical} />}
                                  variant="ghost"
                                  size="sm"
                                />
                                <MenuList>
                                  <MenuItem icon={<Icon as={FiEye} />}>Preview</MenuItem>
                                  <MenuItem icon={<Icon as={FiEdit3} />}>Edit Template</MenuItem>
                                  <MenuItem icon={<Icon as={FiSend} />}>Use Template</MenuItem>
                                  <MenuItem icon={<Icon as={FiTrash2} />} color="red.500">Delete</MenuItem>
                                </MenuList>
                              </Menu>
                            </Flex>
                          </CardHeader>
                          <CardBody pt={0}>
                            <VStack align="start" spacing={3}>
                              <Text fontSize="sm" fontWeight="medium">{template.subject}</Text>
                              <Text fontSize="sm" color={textColor} noOfLines={3}>
                                {template.content}
                              </Text>
                              <HStack justify="space-between" w="full">
                                <Text fontSize="xs" color={textColor}>
                                  Used {template.usageCount} times
                                </Text>
                                <Button size="xs" variant="outline" borderRadius="md">
                                  Use Template
                                </Button>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </Grid>
                  </VStack>
                </TabPanel>

                {/* Analytics Tab */}
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    <Heading size="md">Communication Analytics</Heading>
                    
                    <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
                      <GridItem>
                        <Card bg={cardBg} shadow="sm">
                          <CardHeader>
                            <Heading size="sm">Engagement Trends</Heading>
                          </CardHeader>
                          <CardBody>
                            <Box h="300px" display="flex" alignItems="center" justifyContent="center" color={textColor}>
                              <VStack>
                                <Icon as={FiMail} boxSize={12} />
                                <Text>Analytics chart would go here</Text>
                                <Text fontSize="sm">Showing open rates and click rates over time</Text>
                              </VStack>
                            </Box>
                          </CardBody>
                        </Card>
                      </GridItem>
                      
                      <GridItem>
                        <Card bg={cardBg} shadow="sm">
                          <CardHeader>
                            <Heading size="sm">Top Performing Communications</Heading>
                          </CardHeader>
                          <CardBody>
                            <VStack spacing={3} align="stretch">
                              {communications
                                .filter(c => c.openRate)
                                .sort((a, b) => (b.openRate || 0) - (a.openRate || 0))
                                .slice(0, 5)
                                .map((communication) => (
                                  <HStack key={communication.id} justify="space-between">
                                    <VStack align="start" spacing={0} flex={1}>
                                      <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                                        {communication.title}
                                      </Text>
                                      <Text fontSize="xs" color={textColor}>
                                        {communication.type}
                                      </Text>
                                    </VStack>
                                    <Badge colorScheme="green" size="sm">
                                      {communication.openRate}%
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

                {/* Recipients Tab */}
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    <Flex justify="space-between" align="center">
                      <Heading size="md">Recipient Groups</Heading>
                      <Button size="sm" variant="outline" borderRadius="xl">
                        Manage Groups
                      </Button>
                    </Flex>
                    
                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                      {recipientGroups.map((group) => (
                        <Card key={group} bg={cardBg} shadow="sm" borderRadius="xl">
                          <CardBody>
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">{group}</Text>
                                <Text fontSize="sm" color={textColor}>
                                  {Math.floor(Math.random() * 100) + 50} members
                                </Text>
                              </VStack>
                              <IconButton
                                icon={<Icon as={FiEdit3} />}
                                variant="ghost"
                                size="sm"
                                aria-label="Edit group"
                              />
                            </HStack>
                          </CardBody>
                        </Card>
                      ))}
                    </Grid>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>

      {/* Create/Edit Communication Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent borderRadius="xl" maxH="90vh" overflowY="auto">
          <ModalHeader>
            {isEditing ? 'Edit Communication' : 'Create New Communication'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  placeholder="Enter communication title"
                  borderRadius="xl"
                  defaultValue={selectedCommunication?.title}
                />
              </FormControl>

              <HStack w="full" spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Type</FormLabel>
                  <Select
                    borderRadius="xl"
                    defaultValue={selectedCommunication?.type}
                  >
                    <option value="announcement">Announcement</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="reminder">Reminder</option>
                    <option value="urgent">Urgent</option>
                    <option value="general">General</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    borderRadius="xl"
                    defaultValue={selectedCommunication?.priority}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Select>
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel>Content</FormLabel>
                <Textarea
                  placeholder="Enter communication content"
                  borderRadius="xl"
                  minH="150px"
                  defaultValue={selectedCommunication?.content}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Recipients</FormLabel>
                <CheckboxGroup>
                  <Stack spacing={2}>
                    {recipientGroups.map((group) => (
                      <Checkbox key={group} value={group}>
                        {group}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Schedule Send Date (Optional)</FormLabel>
                <Input
                  type="date"
                  borderRadius="xl"
                  defaultValue={selectedCommunication?.scheduledDate}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Attachments</FormLabel>
                <Button
                  leftIcon={<Icon as={FiPaperclip} />}
                  variant="outline"
                  borderRadius="xl"
                  w="full"
                >
                  Add Attachments
                </Button>
              </FormControl>

              <HStack spacing={4} w="full" pt={4}>
                <Button variant="outline" onClick={onClose} flex={1} borderRadius="xl">
                  Cancel
                </Button>
                <Button variant="outline" flex={1} borderRadius="xl">
                  Save as Draft
                </Button>
                <Button colorScheme="brand" flex={1} borderRadius="xl">
                  {isEditing ? 'Update & Send' : 'Send Now'}
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ModernCommunicationsManagement;
