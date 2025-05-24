import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Button,
  Flex,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  HStack,
  VStack,
  Badge,
  Icon,
} from '../../components/ui/TailwindComponentsFixed';
import {
  FaPlus,
  FaPoll,
  FaCheckCircle,
  FaEdit,
  FaRegClock,
  FaChartBar,
} from 'react-icons/fa';
import ChartComponent from '../../components/common/ChartComponent';
import StatCard from '../../components/common/StatCard';
import { Card, CardBody } from '../../components/common/CardComponent';
import type { Poll, PollSummary } from '../../types/poll.types';
import pollService from '../../services/poll.service';

const PollDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<PollSummary | null>(null);
  const [recentPolls, setRecentPolls] = useState<Poll[]>([]);
  const [activePolls, setActivePolls] = useState<Poll[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const summaryData = await pollService.getPollSummary();
        setSummary(summaryData);
        setRecentPolls(summaryData.recentPolls);

        // Fetch active polls
        const allPolls = await pollService.getPolls();
        setActivePolls(allPolls.filter((poll) => poll.status === 'active'));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Mock data for charts
  const responsesOverTimeData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Poll Responses',
        data: [12, 19, 15, 28, 22, 35],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const participationByTypeData = {
    labels: ['Satisfaction', 'Opinion', 'Preference', 'Feedback'],
    datasets: [
      {
        label: 'Participation Rate (%)',
        data: [78, 65, 84, 72],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const getPollStatusColor = (status: string): string => {
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

  return (
    <Box p={5}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Polls & Surveys Dashboard</Heading>
        <Button
          leftIcon={<FaPlus />}
          colorScheme="blue"
          onClick={() => navigate('/polls/create')}
        >
          Create New Poll
        </Button>
      </Flex>

      {loading ? (
        <Text>Loading dashboard data...</Text>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
            <StatCard
              title="Total Polls"
              value={summary?.total || 0}
              icon={FaPoll}
              colorScheme="purple"
            />
            <StatCard
              title="Active Polls"
              value={summary?.active || 0}
              icon={FaCheckCircle}
              colorScheme="green"
            />
            <StatCard
              title="Completed Polls"
              value={summary?.closed || 0}
              icon={FaChartBar}
              colorScheme="blue"
            />
            <StatCard
              title="Draft Polls"
              value={summary?.draft || 0}
              icon={FaEdit}
              colorScheme="gray"
            />
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} mb={8}>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>
                  Responses Over Time
                </Heading>
                <Box height="250px">
                  <ChartComponent type="line" data={responsesOverTimeData} />
                </Box>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Heading size="md" mb={4}>
                  Participation by Poll Type
                </Heading>
                <Box height="250px">
                  <ChartComponent type="bar" data={participationByTypeData} />
                </Box>
              </CardBody>
            </Card>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
            <Box>
              <Heading size="md" mb={4}>
                Active Polls
              </Heading>
              {activePolls.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {activePolls.map((poll) => (
                    <Card
                      key={poll._id}
                      variant="outline"
                      _hover={{ boxShadow: 'md' }}
                    >
                      <CardBody>
                        <Flex justify="space-between" align="center">
                          <VStack align="start" spacing={1}>
                            <Heading size="sm">{poll.title}</Heading>
                            <Text fontSize="sm" color="gray.600" noOfLines={1}>
                              {poll.description}
                            </Text>
                            <HStack mt={2}>
                              <Badge
                                colorScheme={getPollStatusColor(poll.status)}
                              >
                                {poll.status.toUpperCase()}
                              </Badge>
                              <Text fontSize="xs">
                                Responses: {poll.responseCount || 0}
                              </Text>
                            </HStack>
                          </VStack>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() =>
                              navigate(`/polls/${poll._id}/respond`)
                            }
                          >
                            Respond
                          </Button>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              ) : (
                <Card variant="outline">
                  <CardBody>
                    <Text color="gray.500" textAlign="center">
                      No active polls at the moment
                    </Text>
                  </CardBody>
                </Card>
              )}
              <Button
                mt={4}
                variant="outline"
                rightIcon={<FaPoll />}
                onClick={() => navigate('/polls/list')}
              >
                View All Polls
              </Button>
            </Box>

            <Box>
              <Heading size="md" mb={4}>
                Recent Polls
              </Heading>
              {recentPolls.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {recentPolls.map((poll) => (
                    <Card
                      key={poll._id}
                      variant="outline"
                      _hover={{ boxShadow: 'md' }}
                    >
                      <CardBody>
                        <Flex justify="space-between" align="center">
                          <VStack align="start" spacing={1}>
                            <Heading size="sm">{poll.title}</Heading>
                            <HStack>
                              <Badge
                                colorScheme={getPollStatusColor(poll.status)}
                              >
                                {poll.status.toUpperCase()}
                              </Badge>
                              <FaRegClock size="1em" />
                              <Text fontSize="xs">
                                {new Date(poll.endDate).toLocaleDateString()}
                              </Text>
                            </HStack>
                          </VStack>
                          <Button
                            size="sm"
                            colorScheme="purple"
                            variant="outline"
                            onClick={() => navigate(`/polls/${poll._id}`)}
                          >
                            View Details
                          </Button>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              ) : (
                <Card variant="outline">
                  <CardBody>
                    <Text color="gray.500" textAlign="center">
                      No recent polls
                    </Text>
                  </CardBody>
                </Card>
              )}
            </Box>
          </SimpleGrid>
        </>
      )}
    </Box>
  );
};

export default PollDashboard;
