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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { useRef } from 'react';
import {
  FiCalendar,
  FiClock,
  FiUsers,
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
  FiPlus,
  FiUserPlus,
  FiAward,
} from 'react-icons/fi';

interface Election {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  type: 'general' | 'executive' | 'committee';
  positions: Position[];
  totalVoters: number;
  votedCount: number;
  createdAt: string;
}

interface Position {
  id: string;
  title: string;
  description: string;
  maxCandidates?: number;
  candidates: Candidate[];
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  position: string;
  manifesto?: string;
  voteCount: number;
  avatar?: string;
  bio?: string;
}

const ModernElectionsManagement: React.FC = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [selectedElectionToDelete, setSelectedElectionToDelete] = useState<Election | null>(null);
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
  const [elections, setElections] = useState<Election[]>([
    {
      id: '1',
      title: 'ACPN Ota Zone Executive Elections 2024',
      description: 'Annual election for executive positions in ACPN Ota Zone',
      startDate: '2024-03-01',
      endDate: '2024-03-07',
      status: 'active',
      type: 'executive',
      totalVoters: 150,
      votedCount: 89,
      createdAt: '2024-02-01',
      positions: [
        {
          id: 'pos1',
          title: 'Chairman',
          description: 'Lead the zone and oversee all activities',
          candidates: [
            {
              id: 'c1',
              name: 'Dr. Adebayo Smith',
              email: 'adebayo@email.com',
              position: 'Chairman',
              voteCount: 45,
              bio: 'Experienced pharmacist with 15 years in practice',
            },
            {
              id: 'c2',
              name: 'Pharm. Johnson Emmanuel',
              email: 'johnson@email.com',
              position: 'Chairman',
              voteCount: 32,
              bio: 'Community pharmacy specialist with leadership experience',
            },
          ],
        },
        {
          id: 'pos2',
          title: 'Secretary',
          description: 'Manage documentation and communications',
          candidates: [
            {
              id: 'c3',
              name: 'Dr. Sarah Williams',
              email: 'sarah@email.com',
              position: 'Secretary',
              voteCount: 67,
              bio: 'Hospital pharmacist with excellent organizational skills',
            },
          ],
        },
      ],
    },
    {
      id: '2',
      title: 'CPD Committee Selection',
      description: 'Selection of members for the Continuing Professional Development committee',
      startDate: '2024-04-15',
      endDate: '2024-04-20',
      status: 'draft',
      type: 'committee',
      totalVoters: 120,
      votedCount: 0,
      createdAt: '2024-02-15',
      positions: [
        {
          id: 'pos3',
          title: 'CPD Coordinator',
          description: 'Coordinate continuing education programs',
          candidates: [],
        },
      ],
    },
    {
      id: '3',
      title: 'General Assembly Representatives',
      description: 'Election of representatives to the national general assembly',
      startDate: '2024-01-10',
      endDate: '2024-01-15',
      status: 'completed',
      type: 'general',
      totalVoters: 200,
      votedCount: 187,
      createdAt: '2023-12-10',
      positions: [
        {
          id: 'pos4',
          title: 'Representative',
          description: 'Represent the zone at national level',
          candidates: [
            {
              id: 'c4',
              name: 'Dr. Michael Chen',
              email: 'michael@email.com',
              position: 'Representative',
              voteCount: 95,
            },
            {
              id: 'c5',
              name: 'Pharm. Elizabeth Okafor',
              email: 'elizabeth@email.com',
              position: 'Representative',
              voteCount: 92,
            },
          ],
        },
      ],
    },
  ]);

  const handleCreateElection = () => {
    setSelectedElection(null);
    setIsEditing(false);
    onOpen();
  };

  const handleEditElection = (election: Election) => {
    setSelectedElection(election);
    setIsEditing(true);
    onOpen();
  };

  const handleDeleteElection = (election: Election) => {
    setSelectedElectionToDelete(election);
    onDeleteOpen();
  };

  const confirmDeleteElection = () => {
    if (selectedElectionToDelete) {
      setElections(elections.filter(e => e.id !== selectedElectionToDelete.id));
      toast({
        title: 'Election deleted',
        description: 'The election has been successfully deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      setSelectedElectionToDelete(null);
    }
  };

  const handleToggleElectionStatus = (electionId: string, newStatus: 'active' | 'draft' | 'completed' | 'cancelled') => {
    setElections(elections.map(election =>
      election.id === electionId
        ? { ...election, status: newStatus }
        : election
    ));
    toast({
      title: 'Election status updated',
      description: `Election has been ${newStatus}`,
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
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'executive': return 'purple';
      case 'general': return 'blue';
      case 'committee': return 'orange';
      default: return 'gray';
    }
  };

  const filteredElections = elections.filter(election => {
    const matchesSearch = election.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         election.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || election.status === filterStatus;
    const matchesType = filterType === 'all' || election.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getElectionStats = () => {
    const totalElections = elections.length;
    const activeElections = elections.filter(e => e.status === 'active').length;
    const completedElections = elections.filter(e => e.status === 'completed').length;
    const totalVotes = elections.reduce((sum, election) => sum + election.votedCount, 0);
    
    return { totalElections, activeElections, completedElections, totalVotes };
  };

  const stats = getElectionStats();

  const ElectionCard: React.FC<{ election: Election }> = ({ election }) => {
    const turnoutRate = election.totalVoters > 0 ? (election.votedCount / election.totalVoters) * 100 : 0;
    const daysUntilEnd = election.endDate ? Math.ceil((new Date(election.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    return (
      <Card bg={cardBg} shadow="sm" borderRadius="xl" border="1px" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Flex justify="space-between" align="start">
            <VStack align="start" spacing={1} flex={1}>
              <Heading size="sm" color="gray.800">{election.title}</Heading>
              <HStack spacing={2}>
                <Badge colorScheme={getStatusColor(election.status)} size="sm">
                  {election.status}
                </Badge>
                <Badge colorScheme={getTypeColor(election.type)} variant="outline" size="sm">
                  {election.type}
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
                <MenuItem icon={<Icon as={FiEdit3} />} onClick={() => handleEditElection(election)}>
                  Edit Election
                </MenuItem>
                <MenuItem icon={<Icon as={FiUserPlus} />}>Manage Candidates</MenuItem>
                <MenuItem icon={<Icon as={FiBarChart} />}>View Results</MenuItem>
                <Divider />
                {election.status === 'draft' && (
                  <MenuItem 
                    icon={<Icon as={FiPlay} />}
                    onClick={() => handleToggleElectionStatus(election.id, 'active')}
                  >
                    Start Election
                  </MenuItem>
                )}
                {election.status === 'active' && (
                  <MenuItem 
                    icon={<Icon as={FiPause} />}
                    onClick={() => handleToggleElectionStatus(election.id, 'completed')}
                  >
                    End Election
                  </MenuItem>
                )}
                <MenuItem 
                  icon={<Icon as={FiTrash2} />} 
                  color="red.500"
                  onClick={() => handleDeleteElection(election)}
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
              {election.description}
            </Text>
            
            <VStack align="start" spacing={2} w="full">
              <HStack spacing={4}>
                <HStack spacing={1}>
                  <Icon as={FiCalendar} color={textColor} size="sm" />
                  <Text fontSize="sm" color={textColor}>
                    {new Date(election.startDate).toLocaleDateString()} - {new Date(election.endDate).toLocaleDateString()}
                  </Text>
                </HStack>
              </HStack>
              
              {election.status === 'active' && (
                <HStack spacing={1}>
                  <Icon as={FiClock} color={textColor} size="sm" />
                  <Text fontSize="sm" color={textColor}>
                    {daysUntilEnd > 0 ? `${daysUntilEnd} days remaining` : 'Ending today'}
                  </Text>
                </HStack>
              )}
              
              <HStack spacing={1}>
                <Icon as={FiUsers} color={textColor} size="sm" />
                <Text fontSize="sm" color={textColor}>
                  {election.votedCount} / {election.totalVoters} voted ({turnoutRate.toFixed(1)}%)
                </Text>
              </HStack>

              <Box w="full">
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="xs" color={textColor}>Voter Turnout</Text>
                  <Text fontSize="xs" fontWeight="semibold">{turnoutRate.toFixed(1)}%</Text>
                </Flex>
                <Progress
                  value={turnoutRate}
                  colorScheme={turnoutRate >= 70 ? 'green' : turnoutRate >= 50 ? 'yellow' : 'red'}
                  borderRadius="full"
                  size="sm"
                />
              </Box>
            </VStack>

            {/* Positions count */}
            <HStack justify="space-between" w="full" pt={2} borderTop="1px" borderColor={borderColor}>
              <Text fontSize="sm" color={textColor}>
                {election.positions.length} position{election.positions.length !== 1 ? 's' : ''}
              </Text>
              <Text fontSize="sm" color={textColor}>
                {election.positions.reduce((sum, pos) => sum + pos.candidates.length, 0)} candidate{election.positions.reduce((sum, pos) => sum + pos.candidates.length, 0) !== 1 ? 's' : ''}
              </Text>
            </HStack>
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
              Elections Management
            </Heading>
            <Text color={textColor}>
              Manage elections and voting for ACPN Ota Zone
            </Text>
          </VStack>
          <Button
            leftIcon={<Icon as={FiPlus} />}
            colorScheme="brand"
            onClick={handleCreateElection}
            size="md"
            borderRadius="xl"
          >
            Create Election
          </Button>
        </Flex>

        {/* Stats Cards */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={6}>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Total Elections</StatLabel>
                  <StatNumber>{stats.totalElections}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    15% this year
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Active Elections</StatLabel>
                  <StatNumber color="green.500">{stats.activeElections}</StatNumber>
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
                  <StatNumber color="blue.500">{stats.completedElections}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    25% this year
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Total Votes Cast</StatLabel>
                  <StatNumber>{stats.totalVotes}</StatNumber>
                  <StatHelpText>Across all elections</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Main Content */}
        <Card bg={cardBg} shadow="sm" borderRadius="xl">
          <CardBody>
            <Tabs>
              <TabList>
                <Tab>All Elections</Tab>
                <Tab>Results & Analytics</Tab>
                <Tab>Voter Management</Tab>
              </TabList>

              <TabPanels>
                {/* All Elections Tab */}
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
                            placeholder="Search elections..."
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
                          <option value="cancelled">Cancelled</option>
                        </Select>

                        <Select
                          placeholder="All Types"
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          maxW="150px"
                          borderRadius="xl"
                        >
                          <option value="executive">Executive</option>
                          <option value="general">General</option>
                          <option value="committee">Committee</option>
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
                          aria-label="Export elections"
                          variant="outline"
                          borderRadius="xl"
                        />
                      </HStack>
                    </Flex>

                    {/* Elections Grid */}
                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "repeat(2, 1fr)",
                        lg: "repeat(3, 1fr)",
                      }}
                      gap={6}
                    >
                      {filteredElections.map((election) => (
                        <ElectionCard key={election.id} election={election} />
                      ))}
                    </Grid>

                    {filteredElections.length === 0 && (
                      <Box textAlign="center" py={10}>
                        <Icon as={FiUsers} boxSize={12} color={textColor} mb={4} />
                        <Heading size="md" color={textColor} mb={2}>
                          No elections found
                        </Heading>
                        <Text color={textColor}>
                          {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Create your first election to get started'
                          }
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* Results & Analytics Tab */}
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    <Heading size="md">Election Results & Analytics</Heading>
                    
                    {/* Recent completed elections */}
                    <VStack spacing={4} align="stretch">
                      {elections
                        .filter(e => e.status === 'completed')
                        .map(election => (
                          <Card key={election.id} bg={cardBg} shadow="sm">
                            <CardHeader>
                              <Flex justify="space-between" align="center">
                                <VStack align="start" spacing={1}>
                                  <Heading size="sm">{election.title}</Heading>
                                  <Text fontSize="sm" color={textColor}>
                                    Completed on {new Date(election.endDate).toLocaleDateString()}
                                  </Text>
                                </VStack>
                                <Badge colorScheme="blue" size="sm">
                                  {((election.votedCount / election.totalVoters) * 100).toFixed(1)}% turnout
                                </Badge>
                              </Flex>
                            </CardHeader>
                            <CardBody pt={0}>
                              <VStack spacing={4} align="stretch">
                                {election.positions.map(position => (
                                  <Box key={position.id}>
                                    <Text fontWeight="semibold" mb={2}>{position.title}</Text>
                                    <VStack spacing={2} align="stretch">
                                      {position.candidates
                                        .sort((a, b) => b.voteCount - a.voteCount)
                                        .map((candidate, index) => (
                                          <HStack key={candidate.id} justify="space-between">
                                            <HStack>
                                              {index === 0 && (
                                                <Icon as={FiAward} color="yellow.500" />
                                              )}
                                              <Avatar size="sm" name={candidate.name} />
                                              <VStack align="start" spacing={0}>
                                                <Text fontSize="sm" fontWeight="medium">
                                                  {candidate.name}
                                                </Text>
                                                <Text fontSize="xs" color={textColor}>
                                                  {candidate.voteCount} votes
                                                </Text>
                                              </VStack>
                                            </HStack>
                                            <Text fontSize="sm" fontWeight="semibold">
                                              {election.votedCount > 0 
                                                ? ((candidate.voteCount / election.votedCount) * 100).toFixed(1)
                                                : 0
                                              }%
                                            </Text>
                                          </HStack>
                                        ))
                                      }
                                    </VStack>
                                  </Box>
                                ))}
                              </VStack>
                            </CardBody>
                          </Card>
                        ))
                      }
                    </VStack>
                  </VStack>
                </TabPanel>

                {/* Voter Management Tab */}
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    <Flex justify="space-between" align="center">
                      <Heading size="md">Voter Management</Heading>
                      <Button size="sm" variant="outline" borderRadius="xl">
                        Import Voters
                      </Button>
                    </Flex>
                    
                    <Text color={textColor}>
                      Voter management features would be implemented here, including:
                    </Text>
                    
                    <VStack align="start" spacing={2} color={textColor}>
                      <Text>• Eligible voter list management</Text>
                      <Text>• Voter registration status</Text>
                      <Text>• Voting history and statistics</Text>
                      <Text>• Voter authentication and verification</Text>
                    </VStack>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>

      {/* Create/Edit Election Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>
            {isEditing ? 'Edit Election' : 'Create New Election'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Election Title</FormLabel>
                <Input
                  placeholder="Enter election title"
                  borderRadius="xl"
                  defaultValue={selectedElection?.title}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Enter election description"
                  borderRadius="xl"
                  defaultValue={selectedElection?.description}
                />
              </FormControl>

              <HStack w="full" spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    type="date"
                    borderRadius="xl"
                    defaultValue={selectedElection?.startDate}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>End Date</FormLabel>
                  <Input
                    type="date"
                    borderRadius="xl"
                    defaultValue={selectedElection?.endDate}
                  />
                </FormControl>
              </HStack>

              <HStack w="full" spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Election Type</FormLabel>
                  <Select
                    borderRadius="xl"
                    defaultValue={selectedElection?.type}
                  >
                    <option value="executive">Executive</option>
                    <option value="general">General</option>
                    <option value="committee">Committee</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Total Voters</FormLabel>
                  <Input
                    type="number"
                    placeholder="Expected number of voters"
                    borderRadius="xl"
                    defaultValue={selectedElection?.totalVoters}
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} w="full" pt={4}>
                <Button variant="outline" onClick={onClose} flex={1} borderRadius="xl">
                  Cancel
                </Button>
                <Button colorScheme="brand" flex={1} borderRadius="xl">
                  {isEditing ? 'Update Election' : 'Create Election'}
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Election
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{selectedElectionToDelete?.title}"? 
              This action cannot be undone and will remove all associated data including votes and candidates.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose} borderRadius="xl">
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={confirmDeleteElection} 
                ml={3}
                borderRadius="xl"
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ModernElectionsManagement;
