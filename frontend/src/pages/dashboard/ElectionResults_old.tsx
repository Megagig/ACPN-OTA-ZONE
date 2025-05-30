import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChartBar, FaMedal } from 'react-icons/fa';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Box,
  Heading,
  Text,
  Button,
  Divider,
  SimpleGrid,
  HStack,
  Flex,
  Badge,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Alert,
  CardBody,
} from '@chakra-ui/react';
import {
  AlertIcon,
  Avatar,
  Card,
  Image,
} from '../../components/ui/chakra-components';
import { useToast } from '../../hooks/useToast';
import type { Election, Position, Candidate } from '../../types/election.types';
import electionService from '../../services/election.service';
import ChartComponent from '../../components/common/ChartComponent';

interface VotingStatistics {
  totalEligibleVoters: number;
  totalVotesCast: number;
  votingPercentage: number;
  votersByAge: {
    [key: string]: number;
  };
  votersByGender: {
    male: number;
    female: number;
    other: number;
  };
}

const ElectionResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [election, setElection] = useState<Election | null>(null);
  const [statistics, setStatistics] = useState<VotingStatistics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchElectionResults = async () => {
      try {
        if (id) {
          setLoading(true);
          const data = await electionService.getElectionById(id);
          setElection(data);

          // If election is completed, fetch voting statistics
          if (data.status === 'ended') {
            const stats = await electionService.getElectionStatistics(id);
            setStatistics(stats);
          } else {
            toast({
              title: 'Results not available',
              description:
                'Detailed results are only available for completed elections',
              status: 'info',
              duration: 5000,
              isClosable: true,
            });
            navigate(`/elections/${id}`);
          }
        }
      } catch (error) {
        console.error('Error fetching election results:', error);
        toast({
          title: 'Error fetching election results',
          description: 'Unable to load election results',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchElectionResults();
  }, [id, navigate, toast]);

  const renderPositionResults = (position: Position) => {
    // Get candidates for this position from the election
    const positionCandidates =
      election?.candidates.filter((c) => c.position === position._id) || [];

    if (positionCandidates.length === 0) {
      return <Text color="gray.500">No candidates for this position</Text>;
    }

    // Calculate total votes for this position
    const totalPositionVotes = positionCandidates.reduce(
      (sum: number, candidate: Candidate) => sum + (candidate.votes || 0),
      0
    );

    // Sort candidates by vote count in descending order
    const sortedCandidates = [...positionCandidates].sort(
      (a, b) => (b.votes || 0) - (a.votes || 0)
    );

    return (
      <Box>
        {sortedCandidates.map((candidate, index) => {
          const votePercentage =
            totalPositionVotes > 0
              ? ((candidate.votes || 0) / totalPositionVotes) * 100
              : 0;

          return (
            <Box
              key={candidate._id}
              p={4}
              mb={3}
              borderWidth={1}
              borderRadius="md"
              borderColor={index === 0 ? 'green.300' : 'gray.200'}
              bg={index === 0 ? 'green.50' : 'white'}
            >
              <Flex justify="space-between" align="center" mb={2}>
                <HStack>
                  {candidate.photoUrl ? (
                    <Image
                      src={candidate.photoUrl}
                      alt={candidate.fullName}
                      boxSize="40px"
                      objectFit="cover"
                      borderRadius="full"
                    />
                  ) : (
                    <Avatar size="sm" name={candidate.fullName} />
                  )}
                  <Text fontWeight={index === 0 ? 'bold' : 'medium'}>
                    {candidate.fullName}{' '}
                    {index === 0 && <FaMedal color="gold" />}
                  </Text>
                </HStack>
                <HStack>
                  <Badge colorScheme={index === 0 ? 'green' : 'blue'}>
                    {candidate.votes || 0} votes
                  </Badge>
                  <Badge
                    colorScheme={index === 0 ? 'green' : 'blue'}
                    variant="outline"
                  >
                    {votePercentage.toFixed(1)}%
                  </Badge>
                </HStack>
              </Flex>

              <Progress
                value={votePercentage}
                colorScheme={index === 0 ? 'green' : 'blue'}
                size="sm"
                borderRadius="full"
              />
            </Box>
          );
        })}
      </Box>
    );
  };

  const renderStatistics = () => {
    if (!statistics) return null;

    const ageGroups = Object.keys(statistics.votersByAge);
    const ageData = ageGroups.map((group) => statistics.votersByAge[group]);

    const genderData = [
      statistics.votersByGender.male,
      statistics.votersByGender.female,
      statistics.votersByGender.other,
    ];

    return (
      <Box>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mb={6}>
          <Stat as={Card} p={4}>
            <StatLabel>Total Eligible Voters</StatLabel>
            <StatNumber>{statistics.totalEligibleVoters}</StatNumber>
          </Stat>
          <Stat as={Card} p={4}>
            <StatLabel>Total Votes Cast</StatLabel>
            <StatNumber>{statistics.totalVotesCast}</StatNumber>
            <StatHelpText>
              {statistics.votingPercentage.toFixed(1)}% voter turnout
            </StatHelpText>
          </Stat>
          <Stat as={Card} p={4}>
            <StatLabel>Positions Contested</StatLabel>
            <StatNumber>{election?.positions.length || 0}</StatNumber>
          </Stat>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
          <Card>
            <CardBody>
              <Heading size="sm" mb={4}>
                Voters by Age Group
              </Heading>
              <Box h="250px">
                <ChartComponent
                  type="bar"
                  data={{
                    labels: ageGroups,
                    datasets: [
                      {
                        label: 'Voters',
                        data: ageData,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Number of Voters',
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Age Group',
                        },
                      },
                    },
                  }}
                />
              </Box>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Heading size="sm" mb={4}>
                Voters by Gender
              </Heading>
              <Box h="250px">
                <ChartComponent
                  type="pie"
                  data={{
                    labels: ['Male', 'Female', 'Other'],
                    datasets: [
                      {
                        data: genderData,
                        backgroundColor: [
                          'rgba(54, 162, 235, 0.7)',
                          'rgba(255, 99, 132, 0.7)',
                          'rgba(255, 206, 86, 0.7)',
                        ],
                        borderColor: [
                          'rgba(54, 162, 235, 1)',
                          'rgba(255, 99, 132, 1)',
                          'rgba(255, 206, 86, 1)',
                        ],
                        borderWidth: 1,
                      },
                    ],
                  }}
                />
              </Box>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box p={5}>
          <Text>Loading election results...</Text>
        </Box>
      </DashboardLayout>
    );
  }

  if (!election) {
    return (
      <DashboardLayout>
        <Box p={5}>
          <Text>Election not found</Text>
          <Button mt={4} onClick={() => navigate('/elections/list')}>
            Back to Elections
          </Button>
        </Box>
      </DashboardLayout>
    );
  }

  if (election.status !== 'ended') {
    return (
      <DashboardLayout>
        <Box p={5}>
          <Alert status="info" mb={4}>
            <AlertIcon />
            Results are only available once the election is completed.
          </Alert>
          <Button onClick={() => navigate(`/elections/${id}`)}>
            Return to Election
          </Button>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box p={5}>
        <Flex justify="space-between" align="center" mb={4}>
          <Box>
            <Heading size="lg">{election.title} - Results</Heading>
            <Text fontSize="sm" color="gray.600">
              {new Date(election.startDate).toLocaleDateString()} -{' '}
              {new Date(election.endDate).toLocaleDateString()}
            </Text>
          </Box>
          <Button onClick={() => navigate(`/elections/${id}`)}>
            Back to Election
          </Button>
        </Flex>

        <Divider my={4} />

        <Tabs variant="enclosed" colorScheme="blue" isLazy>
          <TabList>
            <Tab>
              <HStack>
                <FaMedal />
                <Text>Results by Position</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <FaChartBar />
                <Text>Voting Statistics</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                {election.positions.map((position) => (
                  <Card key={position._id} variant="outline">
                    <CardBody>
                      <Heading size="md" mb={4}>
                        {position.name}
                      </Heading>
                      {renderPositionResults(position)}
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </TabPanel>

            <TabPanel px={0}>{renderStatistics()}</TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </DashboardLayout>
  );
};

export default ElectionResults;
