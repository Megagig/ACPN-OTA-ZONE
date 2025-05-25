import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaEdit,
  FaVoteYea,
  FaChartBar,
  FaListAlt,
  FaUserPlus,
} from 'react-icons/fa';
import { Card, CardBody } from '../../components/common/CardComponent';
import {
  Badge,
  Button,
  Text,
  Heading,
  Divider,
} from '../../components/ui/TailwindComponents';
import { useToast } from '../../hooks/useToast';
import type {
  Election,
  ElectionStatus,
  Position,
  Candidate,
} from '../../types/election.types';
import electionService from '../../services/election.service';
import CandidatesList from './CandidatesList';

const ElectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    const fetchElection = async () => {
      try {
        if (id) {
          setLoading(true);
          const data = await electionService.getElectionById(id);
          setElection(data);
        }
      } catch (error) {
        toast({
          title: 'Error fetching election',
          description: 'Unable to load election details',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchElection();
  }, [id, toast]);

  const handlePublishElection = async () => {
    try {
      if (election && id) {
        await electionService.updateElectionStatus(id, 'active');
        toast({
          title: 'Election published',
          description: 'The election is now live and open for voting',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        // Refresh election data
        const updated = await electionService.getElectionById(id);
        setElection(updated);
      }
    } catch (error) {
      toast({
        title: 'Error publishing election',
        description: 'Failed to publish the election',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCloseElection = async () => {
    try {
      if (election && id) {
        await electionService.updateElectionStatus(id, 'completed');
        toast({
          title: 'Election closed',
          description: 'The election has been marked as completed',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        // Refresh election data
        const updated = await electionService.getElectionById(id);
        setElection(updated);
      }
    } catch (error) {
      toast({
        title: 'Error closing election',
        description: 'Failed to close the election',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusBadgeColor = (status: ElectionStatus): string => {
    switch (status) {
      case 'draft':
        return 'gray';
      case 'active':
        return 'green';
      case 'completed':
        return 'blue';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const renderElectionStats = () => {
    if (!election) return null;

    return (
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mb={5}>
        <Stat as={Card} p={4}>
          <StatLabel>Positions</StatLabel>
          <StatNumber>{election.positions.length}</StatNumber>
          <StatHelpText>Total positions for election</StatHelpText>
        </Stat>
        <Stat as={Card} p={4}>
          <StatLabel>Candidates</StatLabel>
          <StatNumber>
            {election.positions.reduce(
              (acc, pos) => acc + (pos.candidates?.length || 0),
              0
            )}
          </StatNumber>
          <StatHelpText>Total registered candidates</StatHelpText>
        </Stat>
        <Stat as={Card} p={4}>
          <StatLabel>Votes Cast</StatLabel>
          <StatNumber>{election.totalVotes || 0}</StatNumber>
          <StatHelpText>
            {election.status === 'active' ? 'Ongoing voting' : 'Final count'}
          </StatHelpText>
        </Stat>
      </SimpleGrid>
    );
  };

  const renderActionButtons = () => {
    if (!election) return null;

    return (
      <HStack spacing={4} mb={5}>
        {election.status === 'draft' && (
          <>
            <Button
              leftIcon={<FaEdit />}
              colorScheme="blue"
              onClick={() => navigate(`/elections/${id}/edit`)}
            >
              Edit
            </Button>
            <Button
              leftIcon={<FaVoteYea />}
              colorScheme="green"
              onClick={handlePublishElection}
            >
              Publish Election
            </Button>
          </>
        )}
        {election.status === 'active' && (
          <>
            <Button
              leftIcon={<FaVoteYea />}
              colorScheme="purple"
              onClick={() => navigate(`/elections/${id}/vote`)}
            >
              Cast Vote
            </Button>
            <Button
              colorScheme="red"
              variant="outline"
              onClick={handleCloseElection}
            >
              Close Election
            </Button>
          </>
        )}
        {election.status === 'completed' && (
          <Button
            leftIcon={<FaChartBar />}
            colorScheme="blue"
            onClick={() => navigate(`/elections/${id}/results`)}
          >
            View Detailed Results
          </Button>
        )}
      </HStack>
    );
  };

  if (loading) {
    return (
      <Box p={5}>
        <Text>Loading election details...</Text>
      </Box>
    );
  }

  if (!election) {
    return (
      <Box p={5}>
        <Text>Election not found</Text>
        <Button mt={4} onClick={() => navigate('/elections/list')}>
          Back to Elections
        </Button>
      </Box>
    );
  }

  return (
    <Box p={5}>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Heading size="lg">{election.title}</Heading>
          <HStack mt={2}>
            <Badge colorScheme={getStatusBadgeColor(election.status)}>
              {election.status.toUpperCase()}
            </Badge>
            <Text fontSize="sm">
              {new Date(election.startDate).toLocaleDateString()} -{' '}
              {new Date(election.endDate).toLocaleDateString()}
            </Text>
          </HStack>
        </Box>
        <Button variant="outline" onClick={() => navigate('/elections/list')}>
          Back to List
        </Button>
      </Flex>

      <Divider my={5} />

      {renderElectionStats()}
      {renderActionButtons()}

      <Text mb={4}>{election.description}</Text>

      <Tabs
        isFitted
        variant="enclosed"
        onChange={(index) => setActiveTab(index)}
        index={activeTab}
      >
        <TabList mb="1em">
          <Tab>
            <HStack>
              <FaListAlt />
              <Text>Positions & Candidates</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <FaChartBar />
              <Text>Results</Text>
            </HStack>
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <VStack spacing={4} align="stretch">
              {election.positions.map((position: Position) => (
                <Card key={position._id} variant="outline" mb={4}>
                  <CardBody>
                    <Flex
                      justifyContent="space-between"
                      alignItems="center"
                      mb={3}
                    >
                      <Heading size="md">{position.title}</Heading>
                      {election.status === 'draft' && (
                        <Button
                          leftIcon={<FaUserPlus />}
                          size="sm"
                          colorScheme="teal"
                          onClick={() =>
                            navigate(
                              `/elections/${id}/positions/${position._id}/candidates/add`
                            )
                          }
                        >
                          Add Candidate
                        </Button>
                      )}
                    </Flex>
                    <Text mb={4}>{position.description}</Text>

                    {position.candidates && position.candidates.length > 0 ? (
                      <CandidatesList
                        candidates={position.candidates}
                        electionStatus={election.status}
                        positionId={position._id}
                        electionId={election._id}
                      />
                    ) : (
                      <Text color="gray.500">
                        No candidates registered for this position
                      </Text>
                    )}
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </TabPanel>
          <TabPanel p={0}>
            {election.status === 'completed' ? (
              <Box>
                <Heading size="md" mb={4}>
                  Election Results
                </Heading>
                {election.positions.map((position: Position) => (
                  <Card key={position._id} variant="outline" mb={4}>
                    <CardBody>
                      <Heading size="md" mb={3}>
                        {position.title}
                      </Heading>
                      {position.candidates && position.candidates.length > 0 ? (
                        <VStack align="stretch" spacing={3}>
                          {position.candidates
                            .sort(
                              (a: Candidate, b: Candidate) =>
                                (b.voteCount || 0) - (a.voteCount || 0)
                            )
                            .map((candidate: Candidate, index: number) => (
                              <Box
                                key={candidate._id}
                                p={3}
                                borderWidth={1}
                                borderRadius="md"
                                bg={index === 0 ? 'green.50' : 'white'}
                                borderColor={
                                  index === 0 ? 'green.200' : 'gray.200'
                                }
                              >
                                <Flex justifyContent="space-between">
                                  <Text
                                    fontWeight={index === 0 ? 'bold' : 'normal'}
                                  >
                                    {candidate.name} {index === 0 && '🏆'}
                                  </Text>
                                  <Text>{candidate.voteCount || 0} votes</Text>
                                </Flex>
                              </Box>
                            ))}
                        </VStack>
                      ) : (
                        <Text color="gray.500">
                          No candidates for this position
                        </Text>
                      )}
                    </CardBody>
                  </Card>
                ))}
                <Button
                  leftIcon={<FaChartBar />}
                  colorScheme="blue"
                  mt={4}
                  onClick={() => navigate(`/elections/${id}/results`)}
                >
                  View Detailed Results
                </Button>
              </Box>
            ) : (
              <Box textAlign="center" p={10}>
                <Text fontSize="lg" mb={4}>
                  Results will be available once the election is completed.
                </Text>
                {election.status === 'active' && (
                  <Button
                    colorScheme="blue"
                    onClick={() => navigate(`/elections/${id}/vote`)}
                  >
                    Cast Your Vote
                  </Button>
                )}
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ElectionDetail;
