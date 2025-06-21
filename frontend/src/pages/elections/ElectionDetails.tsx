import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  VStack,
  HStack,
  Button,
  Badge,
  SimpleGrid,
  Skeleton,
  useColorModeValue,
  Center,
  Alert,
  AlertIcon,
  Avatar,
  Flex,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { CalendarIcon, TimeIcon } from '@chakra-ui/icons';
import { FaUsers, FaVoteYea, FaUser } from 'react-icons/fa';
import electionService from '../../services/election.service';
import type { Election, Candidate } from '../../types/election.types';

// Assume you have access to currentUserId (replace with actual user id logic)
const currentUserId = '';

const ElectionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [election, setElection] = useState<Election | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    const fetchElectionData = async () => {
      if (!id) {
        setError('Election ID is required');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        // Fetch election data which includes candidates
        const electionData = await electionService.getElectionById(id);
        setElection(electionData);
      } catch (error) {
        console.error('Error fetching election data:', error);
        setError('Failed to load election data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchElectionData();
  }, [id]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColorScheme = (status: string) => {
      switch (status) {
        case 'upcoming':
          return 'blue';
        case 'ongoing':
          return 'green';
        case 'ended':
          return 'gray';
        case 'cancelled':
          return 'red';
        case 'draft':
          return 'yellow';
        default:
          return 'gray';
      }
    };

    return (
      <Badge 
        colorScheme={getStatusColorScheme(status)} 
        variant="subtle" 
        textTransform="capitalize"
        fontSize="sm"
      >
        {status}
      </Badge>
    );
  };

  // Compute isUserCandidate
  const isUserCandidate = useMemo(() => {
    if (!election || !currentUserId) return false;
    return election.candidates.some((c) => c.user === currentUserId);
  }, [election]);

  // Group candidates by position
  const candidatesByPosition = useMemo(() => {
    if (!election) return {};
    const grouped: { [positionId: string]: Candidate[] } = {};
    election.candidates.forEach((candidate) => {
      if (!grouped[candidate.position]) grouped[candidate.position] = [];
      grouped[candidate.position].push(candidate);
    });
    return grouped;
  }, [election]);

  // Compute total vote count
  const voteCount = useMemo(() => {
    if (!election) return 0;
    return election.candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
  }, [election]);
  if (isLoading) {
    return (
      <Container maxW="6xl" py={6}>
        <VStack spacing={6} align="stretch">
          <Skeleton height="40px" width="300px" />
          <Skeleton height="20px" width="500px" />
          <Skeleton height="200px" />
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="6xl" py={6}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  if (!election) {
    return (
      <Container maxW="6xl" py={6}>
        <Center py={10}>
          <Text color="gray.500" fontSize="lg">
            Election not found
          </Text>
        </Center>
      </Container>
    );
  }
  return (
    <Container maxW="6xl" py={6}>
      <VStack spacing={6} align="stretch">
        {/* Header Section */}
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="flex-start" gap={4}>
          <Box>
            <Heading size="lg" mb={2}>
              {election.title}
            </Heading>
            <Text color="gray.600">{election.description}</Text>
          </Box>
          <HStack spacing={3}>
            <StatusBadge status={election.status} />
            {election.status === 'ongoing' && !isUserCandidate && (
              <Button
                colorScheme="blue"
                leftIcon={<Icon as={FaVoteYea} />}
                onClick={() => navigate(`/elections/${election._id}/vote`)}
              >
                Vote Now
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <Card bg={cardBg} shadow="md" borderLeft="4px" borderLeftColor="blue.500">
            <CardBody>
              <HStack>
                <Icon as={CalendarIcon} color="blue.500" boxSize={6} />
                <Box>
                  <Text fontSize="sm" color="gray.600" fontWeight="medium">Start Date</Text>
                  <Text fontSize="lg" fontWeight="bold">{formatDate(election.startDate)}</Text>
                </Box>
              </HStack>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} shadow="md" borderLeft="4px" borderLeftColor="green.500">
            <CardBody>
              <HStack>
                <Icon as={TimeIcon} color="green.500" boxSize={6} />
                <Box>
                  <Text fontSize="sm" color="gray.600" fontWeight="medium">End Date</Text>
                  <Text fontSize="lg" fontWeight="bold">{formatDate(election.endDate)}</Text>
                </Box>
              </HStack>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} shadow="md" borderLeft="4px" borderLeftColor="purple.500">
            <CardBody>
              <HStack>
                <Icon as={FaUsers} color="purple.500" boxSize={6} />
                <Box>
                  <Text fontSize="sm" color="gray.600" fontWeight="medium">Positions</Text>
                  <Text fontSize="lg" fontWeight="bold">{Object.keys(candidatesByPosition || {}).length}</Text>
                </Box>
              </HStack>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} shadow="md" borderLeft="4px" borderLeftColor="indigo.500">
            <CardBody>
              <HStack>
                <Icon as={FaVoteYea} color="indigo.500" boxSize={6} />
                <Box>
                  <Text fontSize="sm" color="gray.600" fontWeight="medium">Votes Cast</Text>
                  <Text fontSize="lg" fontWeight="bold">{voteCount || 0} / {election.totalVoters || 0}</Text>
                </Box>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>        {/* Positions and Candidates */}
        <Card bg={cardBg} shadow="lg">
          <CardHeader>
            <Heading size="md">Positions & Candidates</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              {Object.entries(candidatesByPosition || {}).map(([positionId, positionCandidates]) => (
                <Box key={positionId}>
                  <Heading size="sm" mb={4} color="gray.700">
                    {positionCandidates[0]?.positionName || 'Position'}
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {positionCandidates.map((candidate) => (
                      <Card key={candidate._id} bg="gray.50" _dark={{ bg: 'gray.700' }}>
                        <CardBody>
                          <HStack spacing={4}>
                            {candidate.photoUrl ? (
                              <Avatar
                                src={candidate.photoUrl}
                                name={candidate.fullName}
                                size="lg"
                              />
                            ) : (
                              <Avatar
                                name={candidate.fullName}
                                size="lg"
                                bg="blue.500"
                                icon={<Icon as={FaUser} fontSize="1.5rem" />}
                              />
                            )}
                            <Box flex={1}>
                              <Text fontWeight="semibold" fontSize="md">
                                {candidate.fullName}
                              </Text>
                              <Text fontSize="sm" color="gray.600" noOfLines={3}>
                                {candidate.manifesto || 'No manifesto available'}
                              </Text>
                            </Box>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                  {positionId !== Object.keys(candidatesByPosition)[Object.keys(candidatesByPosition).length - 1] && (
                    <Divider mt={6} />
                  )}
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default ElectionDetails; 