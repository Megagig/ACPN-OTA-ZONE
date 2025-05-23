import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  Badge,
  Flex,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardBody,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
} from '@chakra-ui/react';
import {
  FaPlus,
  FaSearch,
  FaEllipsisV,
  FaEdit,
  FaEye,
  FaTrash,
  FaCalendar,
  FaCheck,
  FaTimes,
  FaFilter,
} from 'react-icons/fa';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Poll, PollStatus } from '../../types/poll.types';
import pollService from '../../services/poll.service';

const PollsList: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pollToDelete, setPollToDelete] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        setLoading(true);
        const data = await pollService.getPolls();
        setPolls(data);
        setFilteredPolls(data);
      } catch (error) {
        console.error('Error fetching polls:', error);
        toast({
          title: 'Error fetching polls',
          description: 'There was an error loading the polls.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, [toast]);

  useEffect(() => {
    // Apply filters
    let result = polls;

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((poll) => poll.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (poll) =>
          poll.title.toLowerCase().includes(term) ||
          poll.description.toLowerCase().includes(term)
      );
    }

    setFilteredPolls(result);
  }, [polls, searchTerm, statusFilter]);

  const handleDelete = async () => {
    if (!pollToDelete) return;

    try {
      await pollService.deletePoll(pollToDelete);
      setPolls(polls.filter((poll) => poll._id !== pollToDelete));
      toast({
        title: 'Poll deleted',
        description: 'The poll has been successfully deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error deleting poll',
        description: 'There was an error deleting the poll.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setPollToDelete(null);
      onClose();
    }
  };

  const confirmDelete = (id: string) => {
    setPollToDelete(id);
    onOpen();
  };

  const updatePollStatus = async (id: string, status: PollStatus) => {
    try {
      await pollService.updatePollStatus(id, status);

      setPolls(
        polls.map((poll) => (poll._id === id ? { ...poll, status } : poll))
      );

      toast({
        title: 'Poll status updated',
        description: `Poll status changed to ${status}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error updating poll status',
        description: 'There was an error updating the poll status.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusBadgeColor = (status: PollStatus): string => {
    switch (status) {
      case 'active':
        return 'green';
      case 'closed':
        return 'blue';
      case 'draft':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <Box p={5}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Polls & Surveys</Heading>
          <Button
            leftIcon={<FaPlus />}
            colorScheme="blue"
            onClick={() => navigate('/polls/create')}
          >
            Create New Poll
          </Button>
        </Flex>

        <Card mb={6}>
          <CardBody>
            <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
              <InputGroup maxW={{ md: '300px' }}>
                <InputLeftElement pointerEvents="none">
                  <FaSearch color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search polls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Select
                maxW={{ md: '200px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                leftIcon={<FaFilter />}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </Select>
            </Flex>
          </CardBody>
        </Card>

        {loading ? (
          <Text>Loading polls...</Text>
        ) : (
          <Card variant="outline">
            <CardBody p={0}>
              {filteredPolls.length > 0 ? (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Title</Th>
                      <Th>Status</Th>
                      <Th>Date Range</Th>
                      <Th>Responses</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredPolls.map((poll) => (
                      <Tr key={poll._id}>
                        <Td>
                          <Box>
                            <Text fontWeight="medium">{poll.title}</Text>
                            <Text fontSize="sm" color="gray.600" noOfLines={1}>
                              {poll.description}
                            </Text>
                          </Box>
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusBadgeColor(poll.status)}>
                            {poll.status.toUpperCase()}
                          </Badge>
                        </Td>
                        <Td>
                          <Flex align="center" gap={2}>
                            <FaCalendar size="12px" />
                            <Text fontSize="sm">
                              {formatDate(poll.startDate)} -{' '}
                              {formatDate(poll.endDate)}
                            </Text>
                          </Flex>
                        </Td>
                        <Td>{poll.responseCount || 0}</Td>
                        <Td>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              aria-label="Options"
                              icon={<FaEllipsisV />}
                              variant="ghost"
                              size="sm"
                            />
                            <MenuList>
                              <MenuItem
                                icon={<FaEye />}
                                onClick={() => navigate(`/polls/${poll._id}`)}
                              >
                                View Details
                              </MenuItem>

                              {poll.status === 'active' && (
                                <MenuItem
                                  icon={<FaCheck />}
                                  onClick={() =>
                                    navigate(`/polls/${poll._id}/respond`)
                                  }
                                >
                                  Respond
                                </MenuItem>
                              )}

                              {poll.status === 'draft' && (
                                <>
                                  <MenuItem
                                    icon={<FaEdit />}
                                    onClick={() =>
                                      navigate(`/polls/${poll._id}/edit`)
                                    }
                                  >
                                    Edit
                                  </MenuItem>
                                  <MenuItem
                                    icon={<FaCheck />}
                                    onClick={() =>
                                      updatePollStatus(poll._id, 'active')
                                    }
                                  >
                                    Activate
                                  </MenuItem>
                                </>
                              )}

                              {poll.status === 'active' && (
                                <MenuItem
                                  icon={<FaTimes />}
                                  onClick={() =>
                                    updatePollStatus(poll._id, 'closed')
                                  }
                                >
                                  Close
                                </MenuItem>
                              )}

                              {poll.status === 'draft' && (
                                <MenuItem
                                  icon={<FaTrash />}
                                  onClick={() => confirmDelete(poll._id)}
                                  color="red.500"
                                >
                                  Delete
                                </MenuItem>
                              )}
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Box p={8} textAlign="center">
                  <Text>No polls found matching your criteria.</Text>
                </Box>
              )}
            </CardBody>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Poll
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete this poll? This action cannot be
                undone.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={handleDelete} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </DashboardLayout>
  );
};

export default PollsList;
