import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChartBar, FaMedal } from 'react-icons/fa';
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
  AlertIcon,
  Card,
  CardBody,
  useToast,
} from '@chakra-ui/react';
import type { Election, Position } from '../../types/election.types';
import electionService from '../../services/election.service';
import ChartComponent from '../../components/common/ChartComponent';
import DashboardLayout from '../../components/layout/DashboardLayout';

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
  const toast = useToast();
  const [election, setElection] = useState<Election | null>(null);
  const [statistics, setStatistics] = useState<VotingStatistics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    const fetchElectionResults = async () => {
      try {
        if (id) {
          setLoading(true);
          const data = await electionService.getElectionById(id);
          setElection(data);

          // If election is completed, fetch voting statistics
          if (data.status === 'ongoing') {
            toast({
              title: 'Election is still active',
              description:
                'Results will be available after the election closes',
              status: 'info',
              duration: 5000,
              isClosable: true,
            });
            navigate(`/elections/${id}`);
            return;
          }

          // Fetch statistics (mock data for now)
          const stats: VotingStatistics = {
            totalEligibleVoters: 1500,
            totalVotesCast: 1200,
            votingPercentage: 80,
            votersByAge: {
              '18-25': 250,
              '26-35': 400,
              '36-45': 350,
              '46-55': 150,
              '56+': 50,
            },
            votersByGender: {
              male: 600,
              female: 550,
              other: 50,
            },
          };
          setStatistics(stats);
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
    if (!position.candidates || position.candidates.length === 0) {
      return (
        <Text className="text-gray-500">No candidates for this position</Text>
      );
    }

    // Calculate total votes for this position
    const totalPositionVotes = position.candidates.reduce(
      (sum, candidate) => sum + (candidate.voteCount || 0),
      0
    );

    // Sort candidates by vote count in descending order
    const sortedCandidates = [...position.candidates].sort(
      (a, b) => (b.voteCount || 0) - (a.voteCount || 0)
    );

    return (
      <Box className="space-y-4">
        {sortedCandidates.map((candidate, index) => {
          const votePercentage =
            totalPositionVotes > 0
              ? ((candidate.voteCount || 0) / totalPositionVotes) * 100
              : 0;

          return (
            <Box
              key={candidate._id}
              className={`p-4 border rounded-md ${
                index === 0
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <Flex justify="between" align="center" className="mb-2">
                <HStack>
                  {candidate.photoUrl ? (
                    <img
                      src={candidate.photoUrl}
                      alt={candidate.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold">
                      {candidate.name.charAt(0)}
                    </div>
                  )}
                  <Text
                    className={`${
                      index === 0 ? 'font-bold' : 'font-medium'
                    } flex items-center gap-2`}
                  >
                    {candidate.name}{' '}
                    {index === 0 && <FaMedal className="text-yellow-500" />}
                  </Text>
                </HStack>
                <HStack>
                  <Badge colorScheme={index === 0 ? 'green' : 'blue'}>
                    {candidate.voteCount || 0} votes
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
                className="rounded-full"
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
      <Box className="space-y-6">
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} className="mb-6">
          <Card className="p-4">
            <Stat>
              <StatLabel>Total Eligible Voters</StatLabel>
              <StatNumber>{statistics.totalEligibleVoters}</StatNumber>
            </Stat>
          </Card>
          <Card className="p-4">
            <Stat>
              <StatLabel>Total Votes Cast</StatLabel>
              <StatNumber>{statistics.totalVotesCast}</StatNumber>
              <StatHelpText>
                {statistics.votingPercentage.toFixed(1)}% voter turnout
              </StatHelpText>
            </Stat>
          </Card>
          <Card className="p-4">
            <Stat>
              <StatLabel>Positions Contested</StatLabel>
              <StatNumber>{election?.positions.length || 0}</StatNumber>
            </Stat>
          </Card>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} className="mb-6">
          <Card>
            <CardBody>
              <Heading size="sm" className="mb-4">
                Voters by Age Group
              </Heading>
              <Box className="h-64">
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
              <Heading size="sm" className="mb-4">
                Voters by Gender
              </Heading>
              <Box className="h-64">
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
      <Box className="p-5">
        <Text>Loading election results...</Text>
      </Box>
    );
  }

  if (!election) {
    return (
      <Box className="p-5">
        <Text>Election not found</Text>
        <Button className="mt-4" onClick={() => navigate('/elections/list')}>
          Back to Elections
        </Button>
      </Box>
    );
  }

  if (election.status !== 'ended') {
    return (
      <DashboardLayout>
        <Box className="p-5">
          <Alert status="info" className="mb-4">
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
    <Box className="p-5">
      <Flex justify="between" align="center" className="mb-4">
        <Box>
          <Heading size="lg">{election.title} - Results</Heading>
          <Text className="text-sm text-gray-600">
            {new Date(election.startDate).toLocaleDateString()} -{' '}
            {new Date(election.endDate).toLocaleDateString()}
          </Text>
        </Box>
        <Button onClick={() => navigate(`/elections/${id}`)}>
          Back to Election
        </Button>
      </Flex>

      <Divider className="my-4" />

      <Tabs onChange={(index) => setActiveTab(index)}>
        <TabList>
          <Tab
            _selected={{ bg: 'blue.500', color: 'white' }}
            onClick={() => setActiveTab(0)}
          >
            <HStack>
              <FaMedal />
              <Text>Results by Position</Text>
            </HStack>
          </Tab>
          <Tab
            _selected={{ bg: 'blue.500', color: 'white' }}
            onClick={() => setActiveTab(1)}
          >
            <HStack>
              <FaChartBar />
              <Text>Voting Statistics</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel className="px-0">
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {election.positions.map((position) => (
                <Card key={position._id}>
                  <CardBody>
                    <Heading size="md" className="mb-4">
                      {position.title}
                    </Heading>
                    {renderPositionResults(position)}
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </TabPanel>

          <TabPanel className="px-0">{renderStatistics()}</TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ElectionResults;
