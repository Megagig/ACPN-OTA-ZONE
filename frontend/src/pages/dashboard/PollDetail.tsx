import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Divider,
  useToast,
  Card,
  CardBody,
  SimpleGrid,
  Badge,
  Progress,
  Flex,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  HStack,
} from '@chakra-ui/react';
import { FaChartBar, FaUsers, FaRegClock, FaTable } from 'react-icons/fa';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ChartComponent from '../../components/common/ChartComponent';
import {
  Poll,
  PollResults,
  AnswerStatistics,
  QuestionType,
} from '../../types/poll.types';
import pollService from '../../services/poll.service';

const PollDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    const fetchPollData = async () => {
      try {
        if (id) {
          setLoading(true);
          const pollData = await pollService.getPollById(id);
          setPoll(pollData);

          // If poll is closed or allow viewing results, fetch results
          if (pollData.status === 'closed' || pollData.allowResultViewing) {
            const resultsData = await pollService.getPollResults(id);
            setResults(resultsData);
          }
        }
      } catch (error) {
        toast({
          title: 'Error loading poll data',
          description: 'Unable to load poll details or results',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPollData();
  }, [id, toast]);

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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderQuestionResults = (answerStats: AnswerStatistics) => {
    switch (answerStats.questionType) {
      case 'single_choice':
      case 'multiple_choice':
        const chartLabels =
          answerStats.options?.map((opt) => opt.optionText) || [];
        const chartData = answerStats.options?.map((opt) => opt.count) || [];
        const chartPercentages =
          answerStats.options?.map((opt) => opt.percentage) || [];

        return (
          <Box>
            <Box height="250px" mb={4}>
              <ChartComponent
                type="bar"
                data={{
                  labels: chartLabels,
                  datasets: [
                    {
                      label: 'Responses',
                      data: chartData,
                      backgroundColor: 'rgba(75, 192, 192, 0.6)',
                      borderColor: 'rgba(75, 192, 192, 1)',
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y',
                  scales: {
                    x: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Number of Responses',
                      },
                    },
                  },
                }}
              />
            </Box>

            <VStack align="stretch" spacing={3}>
              {answerStats.options?.map((option) => (
                <Box key={option.optionId}>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm">{option.optionText}</Text>
                    <HStack>
                      <Text fontSize="sm" fontWeight="bold">
                        {option.count}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        ({option.percentage.toFixed(1)}%)
                      </Text>
                    </HStack>
                  </Flex>
                  <Progress
                    value={option.percentage}
                    size="sm"
                    colorScheme="blue"
                    borderRadius="full"
                  />
                </Box>
              ))}
            </VStack>
          </Box>
        );

      case 'rating':
        return (
          <Box>
            <Stat mb={4} textAlign="center">
              <StatLabel>Average Rating</StatLabel>
              <StatNumber>
                {answerStats.averageRating?.toFixed(1) || 0}
              </StatNumber>
              <StatHelpText>out of 5</StatHelpText>
            </Stat>

            <Box height="200px">
              <ChartComponent
                type="bar"
                data={{
                  labels: ['1', '2', '3', '4', '5'],
                  datasets: [
                    {
                      label: 'Number of Responses',
                      data: answerStats.options?.map((opt) => opt.count) || [],
                      backgroundColor: 'rgba(54, 162, 235, 0.6)',
                      borderColor: 'rgba(54, 162, 235, 1)',
                      borderWidth: 1,
                    },
                  ],
                }}
              />
            </Box>
          </Box>
        );

      case 'boolean':
        const yesCount =
          answerStats.options?.find((opt) => opt.optionText === 'Yes')?.count ||
          0;
        const noCount =
          answerStats.options?.find((opt) => opt.optionText === 'No')?.count ||
          0;
        const yesPercentage = (yesCount / (yesCount + noCount)) * 100 || 0;

        return (
          <Box>
            <Box height="200px">
              <ChartComponent
                type="pie"
                data={{
                  labels: ['Yes', 'No'],
                  datasets: [
                    {
                      data: [yesCount, noCount],
                      backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(255, 99, 132, 0.6)',
                      ],
                      borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)',
                      ],
                      borderWidth: 1,
                    },
                  ],
                }}
              />
            </Box>

            <SimpleGrid columns={2} spacing={4} mt={4}>
              <Card>
                <CardBody textAlign="center">
                  <StatLabel>Yes</StatLabel>
                  <StatNumber>{yesCount}</StatNumber>
                  <StatHelpText>{yesPercentage.toFixed(1)}%</StatHelpText>
                </CardBody>
              </Card>
              <Card>
                <CardBody textAlign="center">
                  <StatLabel>No</StatLabel>
                  <StatNumber>{noCount}</StatNumber>
                  <StatHelpText>
                    {(100 - yesPercentage).toFixed(1)}%
                  </StatHelpText>
                </CardBody>
              </Card>
            </SimpleGrid>
          </Box>
        );

      case 'text':
        return (
          <Box>
            <Text mb={3} fontWeight="bold">
              Text Responses ({answerStats.textResponses?.length || 0})
            </Text>
            {answerStats.textResponses &&
            answerStats.textResponses.length > 0 ? (
              <VStack align="stretch" spacing={3}>
                {answerStats.textResponses.map((response, index) => (
                  <Card key={index} variant="outline">
                    <CardBody py={2}>
                      <Text>{response}</Text>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            ) : (
              <Text color="gray.500">No text responses available</Text>
            )}
          </Box>
        );

      default:
        return <Text>No results available for this question type</Text>;
    }
  };

  const renderResponseDistribution = () => {
    if (!results || !results.responseDistribution) return null;

    const labels = results.responseDistribution.map((item) => item.date);
    const data = results.responseDistribution.map((item) => item.count);

    return (
      <Box height="300px">
        <ChartComponent
          type="line"
          data={{
            labels,
            datasets: [
              {
                label: 'Responses',
                data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
              },
            ],
          }}
          options={{
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of Responses',
                },
              },
              x: {
                title: {
                  display: true,
                  text: 'Date',
                },
              },
            },
          }}
        />
      </Box>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box p={5}>
          <Text>Loading poll details...</Text>
        </Box>
      </DashboardLayout>
    );
  }

  if (!poll) {
    return (
      <DashboardLayout>
        <Box p={5}>
          <Text>Poll not found</Text>
          <Button mt={4} onClick={() => navigate('/polls/list')}>
            Back to Polls
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
            <Heading size="lg">{poll.title}</Heading>
            <HStack mt={2}>
              <Badge colorScheme={getPollStatusColor(poll.status)}>
                {poll.status.toUpperCase()}
              </Badge>
              <Text fontSize="sm">
                {formatDate(poll.startDate)} - {formatDate(poll.endDate)}
              </Text>
            </HStack>
          </Box>
          <Button variant="outline" onClick={() => navigate('/polls/list')}>
            Back to List
          </Button>
        </Flex>

        <Text mb={5}>{poll.description}</Text>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mb={6}>
          <Stat as={Card} p={4}>
            <StatLabel>Total Questions</StatLabel>
            <StatNumber>{poll.questions.length}</StatNumber>
          </Stat>
          <Stat as={Card} p={4}>
            <StatLabel>Total Responses</StatLabel>
            <StatNumber>{poll.responseCount || 0}</StatNumber>
          </Stat>
          <Stat as={Card} p={4}>
            <StatLabel>Status</StatLabel>
            <StatNumber>
              <Badge
                colorScheme={getPollStatusColor(poll.status)}
                fontSize="md"
                px={2}
                py={1}
              >
                {poll.status.toUpperCase()}
              </Badge>
            </StatNumber>
            {poll.status === 'active' && (
              <StatHelpText>
                <FaRegClock style={{ display: 'inline', marginRight: '5px' }} />
                Ends {formatDate(poll.endDate)}
              </StatHelpText>
            )}
          </Stat>
        </SimpleGrid>

        {poll.status === 'active' && (
          <Card mb={6}>
            <CardBody>
              <Flex
                direction={{ base: 'column', md: 'row' }}
                justify="space-between"
                align="center"
                gap={4}
              >
                <Box>
                  <Heading size="md" mb={2}>
                    This poll is currently active
                  </Heading>
                  <Text>Share your feedback by responding to this poll</Text>
                </Box>
                <Button
                  colorScheme="blue"
                  size="lg"
                  onClick={() => navigate(`/polls/${id}/respond`)}
                >
                  Respond to Poll
                </Button>
              </Flex>
            </CardBody>
          </Card>
        )}

        {/* Poll Results Section */}
        {(poll.status === 'closed' || poll.allowResultViewing) && results ? (
          <Box mt={6}>
            <Heading size="md" mb={4}>
              Poll Results
            </Heading>

            <Tabs
              variant="enclosed"
              colorScheme="blue"
              isLazy
              onChange={(index) => setActiveTab(index)}
              index={activeTab}
            >
              <TabList>
                <Tab>
                  <HStack>
                    <FaChartBar />
                    <Text>Results by Question</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack>
                    <FaUsers />
                    <Text>Response Statistics</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  <VStack spacing={8} align="stretch">
                    {results.answersStatistics.map((answerStats, index) => (
                      <Card key={answerStats.questionId} variant="outline">
                        <CardBody>
                          <Heading size="sm" mb={4}>
                            Question {index + 1}: {answerStats.questionText}
                          </Heading>
                          {renderQuestionResults(answerStats)}
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                </TabPanel>

                <TabPanel px={0}>
                  <Card variant="outline" mb={6}>
                    <CardBody>
                      <Heading size="sm" mb={4}>
                        Response Distribution Over Time
                      </Heading>
                      {renderResponseDistribution()}
                    </CardBody>
                  </Card>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Card variant="outline">
                      <CardBody>
                        <Heading size="sm" mb={4}>
                          Question Completion Rate
                        </Heading>
                        <Box height="250px">
                          <ChartComponent
                            type="bar"
                            data={{
                              labels: results.answersStatistics.map(
                                (_, idx) => `Q${idx + 1}`
                              ),
                              datasets: [
                                {
                                  label: 'Completion Rate (%)',
                                  data: results.answersStatistics.map(
                                    (q) =>
                                      (q.totalResponses /
                                        (results.totalResponses || 1)) *
                                      100
                                  ),
                                  backgroundColor: 'rgba(153, 102, 255, 0.6)',
                                  borderColor: 'rgba(153, 102, 255, 1)',
                                  borderWidth: 1,
                                },
                              ],
                            }}
                            options={{
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  max: 100,
                                  title: {
                                    display: true,
                                    text: 'Completion Rate (%)',
                                  },
                                },
                              },
                            }}
                          />
                        </Box>
                      </CardBody>
                    </Card>

                    <Card variant="outline">
                      <CardBody>
                        <Heading size="sm" mb={4}>
                          Respondent Statistics
                        </Heading>
                        <VStack spacing={4} align="stretch">
                          <Stat>
                            <StatLabel>Total Respondents</StatLabel>
                            <StatNumber>{results.totalResponses}</StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel>Average Completion Time</StatLabel>
                            <StatNumber>4m 32s</StatNumber>
                            <StatHelpText>Per respondent</StatHelpText>
                          </Stat>
                          <Stat>
                            <StatLabel>Completion Rate</StatLabel>
                            <StatNumber>
                              {poll.responseCount && poll.targetAudience?.length
                                ? `${(
                                    (poll.responseCount /
                                      poll.targetAudience.length) *
                                    100
                                  ).toFixed(1)}%`
                                : 'N/A'}
                            </StatNumber>
                          </Stat>
                        </VStack>
                      </CardBody>
                    </Card>
                  </SimpleGrid>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        ) : poll.status !== 'draft' && !poll.allowResultViewing ? (
          <Alert status="info" mt={6}>
            <AlertIcon />
            Poll results will be available once the poll is closed.
          </Alert>
        ) : null}

        {/* Poll Questions Preview */}
        {poll.status === 'draft' && (
          <Box mt={6}>
            <Heading size="md" mb={4}>
              Poll Questions
            </Heading>
            <VStack spacing={4} align="stretch">
              {poll.questions.map((question, index) => (
                <Card key={question._id} variant="outline">
                  <CardBody>
                    <Heading size="sm" mb={2}>
                      Question {index + 1}: {question.text}
                      {question.required && (
                        <Badge ml={2} colorScheme="red">
                          Required
                        </Badge>
                      )}
                    </Heading>
                    <Text color="gray.600" mb={3}>
                      Type: {question.type.replace('_', ' ')}
                    </Text>

                    {question.options && question.options.length > 0 && (
                      <Box>
                        <Text fontWeight="bold" mb={2}>
                          Options:
                        </Text>
                        <VStack align="start" spacing={1}>
                          {question.options.map((option) => (
                            <Text key={option._id}>{option.text}</Text>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </Box>
        )}

        {/* Action Buttons */}
        <Flex justify="space-between" mt={8}>
          <Button variant="outline" onClick={() => navigate('/polls/list')}>
            Back to List
          </Button>

          {poll.status === 'draft' && (
            <HStack>
              <Button
                colorScheme="blue"
                onClick={() => navigate(`/polls/${id}/edit`)}
              >
                Edit Poll
              </Button>
              <Button
                colorScheme="green"
                onClick={() => {
                  pollService.updatePollStatus(id!, 'active');
                  navigate('/polls/list');
                  toast({
                    title: 'Poll Activated',
                    description:
                      'The poll is now active and open for responses',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                }}
              >
                Activate Poll
              </Button>
            </HStack>
          )}

          {poll.status === 'active' && (
            <HStack>
              <Button
                colorScheme="blue"
                onClick={() => navigate(`/polls/${id}/respond`)}
              >
                Respond
              </Button>
              <Button
                colorScheme="red"
                variant="outline"
                onClick={() => {
                  pollService.updatePollStatus(id!, 'closed');
                  navigate('/polls/list');
                  toast({
                    title: 'Poll Closed',
                    description: 'The poll has been closed',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                }}
              >
                Close Poll
              </Button>
            </HStack>
          )}
        </Flex>
      </Box>
    </DashboardLayout>
  );
};

export default PollDetail;
