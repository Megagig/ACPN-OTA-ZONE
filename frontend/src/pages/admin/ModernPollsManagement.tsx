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
  Switch,
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
  Stat,  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
} from '@chakra-ui/react';
import {
  FiPieChart,
  FiPlus,
  FiUsers,
  FiCalendar,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiMoreVertical,
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlay,
  FiPause,
  FiBarChart,
  FiThumbsUp,
  FiThumbsDown,
} from 'react-icons/fi';

interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  question: string;
  type: 'single-choice' | 'multiple-choice' | 'rating' | 'yes-no';
  status: 'draft' | 'active' | 'completed' | 'closed';
  options: PollOption[];
  startDate: string;
  endDate?: string;
  totalVotes: number;
  isAnonymous: boolean;
  allowComments: boolean;
  targetAudience: string[];
  createdBy: string;  createdAt: string;
}

const ModernPollsManagement: React.FC = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState(0);

  // Theme colors
  const bg = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');


  // Mock data
  const [polls, setPolls] = useState<Poll[]>([
    {
      id: '1',
      title: 'Preferred CPD Workshop Format',
      description: 'Help us plan better workshops by sharing your preferences',
      question: 'What format do you prefer for CPD workshops?',
      type: 'single-choice',
      status: 'active',
      options: [
        { id: 'opt1', text: 'In-person workshops', voteCount: 45 },
        { id: 'opt2', text: 'Virtual/Online workshops', voteCount: 32 },
        { id: 'opt3', text: 'Hybrid (both in-person and virtual)', voteCount: 67 },
        { id: 'opt4', text: 'Self-paced online modules', voteCount: 23 },
      ],
      startDate: '2024-02-01',
      endDate: '2024-03-01',
      totalVotes: 167,
      isAnonymous: false,
      allowComments: true,
      targetAudience: ['all-members'],
      createdBy: 'CPD Committee',
      createdAt: '2024-01-25',
    },
    {
      id: '2',
      title: 'Annual Conference Theme',
      description: 'Vote for the theme of our 2024 annual conference',
      question: 'Which theme should we focus on for the 2024 annual conference?',
      type: 'single-choice',
      status: 'completed',
      options: [
        { id: 'opt5', text: 'Digital Health and Pharmacy Innovation', voteCount: 89 },
        { id: 'opt6', text: 'Community Pharmacy Excellence', voteCount: 112 },
        { id: 'opt7', text: 'Clinical Pharmacy Advancement', voteCount: 78 },
        { id: 'opt8', text: 'Pharmaceutical Care and Patient Safety', voteCount: 95 },
      ],
      startDate: '2024-01-10',
      endDate: '2024-01-25',
      totalVotes: 374,
      isAnonymous: true,
      allowComments: false,
      targetAudience: ['all-members'],
      createdBy: 'Conference Committee',
      createdAt: '2024-01-05',
    },
    {
      id: '3',
      title: 'Meeting Schedule Preference',
      description: 'When is the best time for our monthly meetings?',
      question: 'What time would work best for you to attend monthly meetings?',
      type: 'multiple-choice',
      status: 'active',
      options: [
        { id: 'opt9', text: 'Saturday mornings (9AM - 12PM)', voteCount: 56 },
        { id: 'opt10', text: 'Saturday afternoons (2PM - 5PM)', voteCount: 43 },
        { id: 'opt11', text: 'Sunday afternoons (2PM - 5PM)', voteCount: 38 },
        { id: 'opt12', text: 'Weekday evenings (6PM - 8PM)', voteCount: 29 },
      ],
      startDate: '2024-02-15',
      endDate: '2024-03-15',
      totalVotes: 89,
      isAnonymous: false,
      allowComments: true,
      targetAudience: ['active-members'],
      createdBy: 'Executive Committee',
      createdAt: '2024-02-10',
    },
    {
      id: '4',
      title: 'New Membership Benefits',
      description: 'Rate the importance of these potential new membership benefits',
      question: 'How important are these potential new benefits to you?',
      type: 'rating',
      status: 'draft',
      options: [
        { id: 'opt13', text: 'Professional Liability Insurance', voteCount: 0 },
        { id: 'opt14', text: 'Career Development Resources', voteCount: 0 },
        { id: 'opt15', text: 'Networking Events', voteCount: 0 },
        { id: 'opt16', text: 'Online Learning Platform', voteCount: 0 },
      ],
      startDate: '2024-03-01',
      totalVotes: 0,
      isAnonymous: true,
      allowComments: true,
      targetAudience: ['all-members'],
      createdBy: 'Membership Committee',
      createdAt: '2024-02-20',
    },
    {
      id: '5',
      title: 'Satisfaction with Current Services',
      description: 'Are you satisfied with our current member services?',
      question: 'Overall, are you satisfied with ACPN Ota Zone services?',
      type: 'yes-no',
      status: 'active',
      options: [
        { id: 'opt17', text: 'Yes', voteCount: 124 },
        { id: 'opt18', text: 'No', voteCount: 23 },
      ],
      startDate: '2024-02-10',
      endDate: '2024-03-10',
      totalVotes: 147,
      isAnonymous: true,
      allowComments: true,
      targetAudience: ['all-members'],
      createdBy: 'Quality Assurance',
      createdAt: '2024-02-05',
    },
  ]);

  const handleCreatePoll = () => {
    setSelectedPoll(null);
    setIsEditing(false);
    onOpen();
  };

  const handleEditPoll = (poll: Poll) => {
    setSelectedPoll(poll);
    setIsEditing(true);
    onOpen();
  };

  const handleDeletePoll = (pollId: string) => {
    setPolls(polls.filter(p => p.id !== pollId));
    toast({
      title: 'Poll deleted',
      description: 'The poll has been successfully deleted.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleTogglePollStatus = (pollId: string, newStatus: 'active' | 'closed' | 'completed') => {
    setPolls(polls.map(poll =>
      poll.id === pollId
        ? { ...poll, status: newStatus }
        : poll
    ));
    toast({
      title: 'Poll status updated',
      description: `Poll has been ${newStatus}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'draft': return 'yellow';
      case 'completed': return 'blue';
      case 'closed': return 'red';
      default: return 'gray';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'single-choice': return 'blue';
      case 'multiple-choice': return 'purple';
      case 'rating': return 'orange';
      case 'yes-no': return 'green';
      default: return 'gray';
    }
  };

  const filteredPolls = polls.filter(poll => {
    const matchesSearch = poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         poll.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || poll.status === filterStatus;
    const matchesType = filterType === 'all' || poll.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getPollStats = () => {
    const totalPolls = polls.length;
    const activePolls = polls.filter(p => p.status === 'active').length;
    const completedPolls = polls.filter(p => p.status === 'completed').length;
    const totalResponses = polls.reduce((sum, poll) => sum + poll.totalVotes, 0);
    
    return { totalPolls, activePolls, completedPolls, totalResponses };
  };

  const stats = getPollStats();

  const PollCard: React.FC<{ poll: Poll }> = ({ poll }) => {
    const getWinningOption = () => {
      if (poll.options.length === 0) return null;
      return poll.options.reduce((max, option) => 
        option.voteCount > max.voteCount ? option : max
      );
    };

    const winningOption = getWinningOption();
    const participationRate = poll.type === 'yes-no' 
      ? poll.totalVotes > 0 ? ((poll.options[0]?.voteCount || 0) / poll.totalVotes) * 100 : 0
      : 0;

    return (
      <Card bg={cardBg} shadow="sm" borderRadius="xl" border="1px" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Flex justify="space-between" align="start">
            <VStack align="start" spacing={1} flex={1}>
              <Heading size="sm" color="gray.800" noOfLines={1}>{poll.title}</Heading>
              <HStack spacing={2} flexWrap="wrap">
                <Badge colorScheme={getStatusColor(poll.status)} size="sm">
                  {poll.status}
                </Badge>
                <Badge colorScheme={getTypeColor(poll.type)} variant="outline" size="sm">
                  {poll.type}
                </Badge>
                {poll.isAnonymous && (
                  <Badge colorScheme="gray" size="sm">Anonymous</Badge>
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
                <MenuItem icon={<Icon as={FiEdit3} />} onClick={() => handleEditPoll(poll)}>
                  Edit Poll
                </MenuItem>
                <MenuItem icon={<Icon as={FiBarChart} />}>View Results</MenuItem>
                <Divider />
                {poll.status === 'draft' && (
                  <MenuItem 
                    icon={<Icon as={FiPlay} />}
                    onClick={() => handleTogglePollStatus(poll.id, 'active')}
                  >
                    Activate Poll
                  </MenuItem>
                )}
                {poll.status === 'active' && (
                  <MenuItem 
                    icon={<Icon as={FiPause} />}
                    onClick={() => handleTogglePollStatus(poll.id, 'closed')}
                  >
                    Close Poll
                  </MenuItem>
                )}
                <MenuItem 
                  icon={<Icon as={FiTrash2} />} 
                  color="red.500"
                  onClick={() => handleDeletePoll(poll.id)}
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
              {poll.description}
            </Text>
            
            <Box w="full">
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                {poll.question}
              </Text>
            </Box>
            
            <VStack align="start" spacing={2} w="full">
              <HStack spacing={4}>
                <HStack spacing={1}>
                  <Icon as={FiUsers} color={textColor} size="sm" />
                  <Text fontSize="sm" color={textColor}>
                    {poll.totalVotes} response{poll.totalVotes !== 1 ? 's' : ''}
                  </Text>
                </HStack>
                <HStack spacing={1}>
                  <Icon as={FiCalendar} color={textColor} size="sm" />
                  <Text fontSize="sm" color={textColor}>
                    {new Date(poll.startDate).toLocaleDateString()}
                    {poll.endDate && ` - ${new Date(poll.endDate).toLocaleDateString()}`}
                  </Text>
                </HStack>
              </HStack>

              <HStack spacing={1}>
                <Text fontSize="sm" color={textColor}>
                  Created by {poll.createdBy}
                </Text>
              </HStack>
            </VStack>

            {/* Show top result for completed/active polls */}
            {poll.totalVotes > 0 && winningOption && (
              <Box w="full" pt={2} borderTop="1px" borderColor={borderColor}>
                <Text fontSize="xs" color={textColor} mb={1}>
                  {poll.status === 'completed' ? 'Final Result' : 'Leading Option'}
                </Text>
                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                    {winningOption.text}
                  </Text>
                  <Badge colorScheme="green" size="sm">
                    {winningOption.voteCount} votes
                  </Badge>
                </HStack>
                <Progress
                  value={(winningOption.voteCount / poll.totalVotes) * 100}
                  colorScheme="green"
                  borderRadius="full"
                  size="sm"
                  mt={1}
                />
              </Box>
            )}

            {/* Special handling for yes/no polls */}
            {poll.type === 'yes-no' && poll.totalVotes > 0 && (
              <Box w="full" pt={2} borderTop="1px" borderColor={borderColor}>
                <HStack justify="space-between" mb={2}>
                  <HStack>
                    <Icon as={FiThumbsUp} color="green.500" />
                    <Text fontSize="sm">Yes: {poll.options[0]?.voteCount || 0}</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FiThumbsDown} color="red.500" />
                    <Text fontSize="sm">No: {poll.options[1]?.voteCount || 0}</Text>
                  </HStack>
                </HStack>
                <Text fontSize="xs" color={textColor} textAlign="center">
                  {participationRate.toFixed(1)}% positive response
                </Text>
              </Box>
            )}
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
              Polls Management
            </Heading>
            <Text color={textColor}>
              Create and manage polls to gather member feedback and opinions
            </Text>
          </VStack>
          <Button
            leftIcon={<Icon as={FiPlus} />}
            colorScheme="brand"
            onClick={handleCreatePoll}
            size="md"
            borderRadius="xl"
          >
            Create Poll
          </Button>
        </Flex>

        {/* Stats Cards */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={6}>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Total Polls</StatLabel>
                  <StatNumber>{stats.totalPolls}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    18% this month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Active Polls</StatLabel>
                  <StatNumber color="green.500">{stats.activePolls}</StatNumber>
                  <StatHelpText>Currently running</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Completed</StatLabel>
                  <StatNumber color="blue.500">{stats.completedPolls}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    22% this month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Total Responses</StatLabel>
                  <StatNumber>{stats.totalResponses}</StatNumber>
                  <StatHelpText>Across all polls</StatHelpText>
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
                <Tab>All Polls</Tab>
                <Tab>Results & Analytics</Tab>
                <Tab>Templates</Tab>
              </TabList>

              <TabPanels>
                {/* All Polls Tab */}
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
                            placeholder="Search polls..."
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
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="closed">Closed</option>
                        </Select>

                        <Select
                          placeholder="All Types"
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          maxW="180px"
                          borderRadius="xl"
                        >
                          <option value="single-choice">Single Choice</option>
                          <option value="multiple-choice">Multiple Choice</option>
                          <option value="rating">Rating</option>
                          <option value="yes-no">Yes/No</option>
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
                          aria-label="Export polls"
                          variant="outline"
                          borderRadius="xl"
                        />
                      </HStack>
                    </Flex>

                    {/* Polls Grid */}
                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "repeat(2, 1fr)",
                        lg: "repeat(3, 1fr)",
                      }}
                      gap={6}
                    >
                      {filteredPolls.map((poll) => (
                        <PollCard key={poll.id} poll={poll} />
                      ))}
                    </Grid>

                    {filteredPolls.length === 0 && (
                      <Box textAlign="center" py={10}>
                        <Icon as={FiPieChart} boxSize={12} color={textColor} mb={4} />
                        <Heading size="md" color={textColor} mb={2}>
                          No polls found
                        </Heading>
                        <Text color={textColor}>
                          {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Create your first poll to get started'
                          }
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* Results & Analytics Tab */}
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    <Heading size="md">Poll Results & Analytics</Heading>
                    
                    {/* Recent completed polls */}
                    <VStack spacing={4} align="stretch">
                      {polls
                        .filter(p => p.status === 'completed' && p.totalVotes > 0)
                        .map(poll => (
                          <Card key={poll.id} bg={cardBg} shadow="sm">
                            <CardHeader>
                              <Flex justify="space-between" align="center">
                                <VStack align="start" spacing={1}>
                                  <Heading size="sm">{poll.title}</Heading>
                                  <HStack>
                                    <Badge colorScheme={getTypeColor(poll.type)} size="sm">
                                      {poll.type}
                                    </Badge>
                                    <Text fontSize="sm" color={textColor}>
                                      {poll.totalVotes} responses
                                    </Text>
                                  </HStack>
                                </VStack>
                                <Button size="sm" variant="outline" borderRadius="xl">
                                  View Details
                                </Button>
                              </Flex>
                            </CardHeader>
                            <CardBody pt={0}>
                              <VStack spacing={3} align="stretch">
                                <Text fontSize="sm" fontWeight="medium">
                                  {poll.question}
                                </Text>
                                
                                <VStack spacing={2} align="stretch">
                                  {poll.options
                                    .sort((a, b) => b.voteCount - a.voteCount)
                                    .map((option, index) => {
                                      const percentage = poll.totalVotes > 0 
                                        ? (option.voteCount / poll.totalVotes) * 100 
                                        : 0;
                                      
                                      return (
                                        <Box key={option.id}>
                                          <Flex justify="space-between" mb={1}>
                                            <Text fontSize="sm" fontWeight={index === 0 ? 'semibold' : 'normal'}>
                                              {option.text}
                                            </Text>
                                            <HStack>
                                              <Text fontSize="sm">
                                                {option.voteCount} votes
                                              </Text>
                                              <Text fontSize="sm" fontWeight="semibold">
                                                {percentage.toFixed(1)}%
                                              </Text>
                                            </HStack>
                                          </Flex>
                                          <Progress
                                            value={percentage}
                                            colorScheme={index === 0 ? 'green' : 'blue'}
                                            borderRadius="full"
                                            size="sm"
                                          />
                                        </Box>
                                      );
                                    })
                                  }
                                </VStack>
                              </VStack>
                            </CardBody>
                          </Card>
                        ))
                      }
                    </VStack>
                  </VStack>
                </TabPanel>

                {/* Templates Tab */}
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    <Flex justify="space-between" align="center">
                      <Heading size="md">Poll Templates</Heading>
                      <Button size="sm" colorScheme="brand" borderRadius="xl">
                        Create Template
                      </Button>
                    </Flex>
                    
                    <Text color={textColor}>
                      Common poll templates to help you get started quickly:
                    </Text>
                    
                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                      {[
                        {
                          name: 'Event Feedback',
                          description: 'Gather feedback after events',
                          type: 'rating',
                          usage: 12
                        },
                        {
                          name: 'Service Satisfaction',
                          description: 'Measure satisfaction with services',
                          type: 'yes-no',
                          usage: 8
                        },
                        {
                          name: 'Feature Priority',
                          description: 'Prioritize new features or improvements',
                          type: 'multiple-choice',
                          usage: 5
                        },
                        {
                          name: 'Meeting Schedule',
                          description: 'Find best meeting times',
                          type: 'single-choice',
                          usage: 15
                        },
                      ].map((template, index) => (
                        <Card key={index} bg={cardBg} shadow="sm" borderRadius="xl">
                          <CardBody>
                            <VStack align="start" spacing={3}>
                              <HStack justify="space-between" w="full">
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="semibold">{template.name}</Text>
                                  <Badge colorScheme={getTypeColor(template.type)} size="sm">
                                    {template.type}
                                  </Badge>
                                </VStack>
                                <IconButton
                                  icon={<Icon as={FiMoreVertical} />}
                                  variant="ghost"
                                  size="sm"
                                  aria-label="Template options"
                                />
                              </HStack>
                              
                              <Text fontSize="sm" color={textColor}>
                                {template.description}
                              </Text>
                              
                              <HStack justify="space-between" w="full">
                                <Text fontSize="xs" color={textColor}>
                                  Used {template.usage} times
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
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>

      {/* Create/Edit Poll Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent borderRadius="xl" maxH="90vh" overflowY="auto">
          <ModalHeader>
            {isEditing ? 'Edit Poll' : 'Create New Poll'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Poll Title</FormLabel>
                <Input
                  placeholder="Enter poll title"
                  borderRadius="xl"
                  defaultValue={selectedPoll?.title}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Enter poll description"
                  borderRadius="xl"
                  defaultValue={selectedPoll?.description}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Question</FormLabel>
                <Input
                  placeholder="Enter poll question"
                  borderRadius="xl"
                  defaultValue={selectedPoll?.question}
                />
              </FormControl>

              <HStack w="full" spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Poll Type</FormLabel>
                  <Select
                    borderRadius="xl"
                    defaultValue={selectedPoll?.type}
                  >
                    <option value="single-choice">Single Choice</option>
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="rating">Rating</option>
                    <option value="yes-no">Yes/No</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Target Audience</FormLabel>
                  <Select borderRadius="xl">
                    <option value="all-members">All Members</option>
                    <option value="active-members">Active Members</option>
                    <option value="executives">Executives</option>
                    <option value="committee-members">Committee Members</option>
                  </Select>
                </FormControl>
              </HStack>

              <HStack w="full" spacing={4}>
                <FormControl>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    type="date"
                    borderRadius="xl"
                    defaultValue={selectedPoll?.startDate}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <Input
                    type="date"
                    borderRadius="xl"
                    defaultValue={selectedPoll?.endDate}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Poll Options</FormLabel>
                <VStack spacing={2} align="stretch">
                  <Input placeholder="Option 1" borderRadius="xl" />
                  <Input placeholder="Option 2" borderRadius="xl" />
                  <Input placeholder="Option 3" borderRadius="xl" />
                  <Input placeholder="Option 4" borderRadius="xl" />
                </VStack>
                <Button size="sm" variant="outline" mt={2} borderRadius="xl">
                  Add More Options
                </Button>
              </FormControl>

              <HStack w="full" spacing={6}>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Anonymous Responses</FormLabel>
                  <Switch
                    colorScheme="brand"
                    defaultChecked={selectedPoll?.isAnonymous}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Allow Comments</FormLabel>
                  <Switch
                    colorScheme="brand"
                    defaultChecked={selectedPoll?.allowComments}
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} w="full" pt={4}>
                <Button variant="outline" onClick={onClose} flex={1} borderRadius="xl">
                  Cancel
                </Button>
                <Button variant="outline" flex={1} borderRadius="xl">
                  Save as Draft
                </Button>
                <Button colorScheme="brand" flex={1} borderRadius="xl">
                  {isEditing ? 'Update Poll' : 'Create & Activate'}
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ModernPollsManagement;
