import React, { useState, useEffect } from 'react';
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
  Radio,
  RadioGroup,
  Stack,
  Image,
  Avatar,
  Badge,
  Flex,
  Progress,
  SimpleGrid,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Election, Position, Candidate } from '../../types/election.types';
import { electionService } from '../../services/election.service';

interface SelectedCandidates {
  [positionId: string]: string;
}

const VotingInterface: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedCandidates, setSelectedCandidates] =
    useState<SelectedCandidates>({});
  const [hasVoted, setHasVoted] = useState<boolean>(false);

  useEffect(() => {
    const fetchElection = async () => {
      try {
        if (id) {
          setLoading(true);
          const data = await electionService.getElectionById(id);

          if (data.status !== 'active') {
            toast({
              title: 'Voting unavailable',
              description: 'This election is not currently active for voting',
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
            navigate(`/elections/${id}`);
            return;
          }

          setElection(data);

          // Check if user has already voted in this election
          const hasUserVoted = await electionService.checkUserVoted(id);
          setHasVoted(hasUserVoted);
        }
      } catch (error) {
        toast({
          title: 'Error loading election',
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
  }, [id, navigate, toast]);

  const handleSelectCandidate = (positionId: string, candidateId: string) => {
    setSelectedCandidates({
      ...selectedCandidates,
      [positionId]: candidateId,
    });
  };

  const handleNext = () => {
    if (currentStep < (election?.positions.length || 0) - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitVotes = async () => {
    try {
      setSubmitting(true);

      if (!id) return;

      // Transform selected candidates into the format expected by the API
      const votes = Object.entries(selectedCandidates).map(
        ([positionId, candidateId]) => ({
          positionId,
          candidateId,
        })
      );

      await electionService.submitVotes(id, votes);

      toast({
        title: 'Votes submitted successfully',
        description: 'Your votes have been recorded',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      navigate(`/elections/${id}`);
    } catch (error) {
      toast({
        title: 'Error submitting votes',
        description: 'There was a problem recording your votes',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box p={5}>
          <Text>Loading election details...</Text>
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

  if (hasVoted) {
    return (
      <DashboardLayout>
        <Box p={5}>
          <Alert status="info" mb={5}>
            <AlertIcon />
            You have already cast your vote in this election.
          </Alert>
          <Button onClick={() => navigate(`/elections/${id}`)}>
            View Election Details
          </Button>
        </Box>
      </DashboardLayout>
    );
  }

  const currentPosition: Position | undefined = election.positions[currentStep];

  return (
    <DashboardLayout>
      <Box p={5}>
        <Heading size="lg" mb={2}>
          {election.title}
        </Heading>
        <Text mb={4}>Cast your vote for each position</Text>

        <Progress
          value={(currentStep / election.positions.length) * 100}
          size="sm"
          colorScheme="blue"
          mb={5}
          borderRadius="md"
        />

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          <Box>
            <Card variant="outline" mb={5}>
              <CardBody>
                <Heading size="md" mb={3}>
                  Position {currentStep + 1} of {election.positions.length}:{' '}
                  {currentPosition?.title}
                </Heading>
                <Text mb={4}>{currentPosition?.description}</Text>

                <Divider my={4} />

                {currentPosition?.candidates &&
                currentPosition.candidates.length > 0 ? (
                  <RadioGroup
                    onChange={(value) =>
                      handleSelectCandidate(currentPosition._id, value)
                    }
                    value={selectedCandidates[currentPosition._id] || ''}
                  >
                    <Stack direction="column" spacing={4}>
                      {currentPosition.candidates.map(
                        (candidate: Candidate) => (
                          <Card
                            key={candidate._id}
                            p={3}
                            variant="outline"
                            borderColor={
                              selectedCandidates[currentPosition._id] ===
                              candidate._id
                                ? 'blue.300'
                                : 'gray.200'
                            }
                            bg={
                              selectedCandidates[currentPosition._id] ===
                              candidate._id
                                ? 'blue.50'
                                : 'white'
                            }
                          >
                            <Radio value={candidate._id} w="100%">
                              <Flex align="center">
                                {candidate.photoUrl ? (
                                  <Image
                                    src={candidate.photoUrl}
                                    alt={candidate.name}
                                    boxSize="50px"
                                    objectFit="cover"
                                    borderRadius="full"
                                    mr={3}
                                  />
                                ) : (
                                  <Avatar
                                    size="md"
                                    name={candidate.name}
                                    mr={3}
                                  />
                                )}
                                <Box>
                                  <Text fontWeight="semibold">
                                    {candidate.name}
                                  </Text>
                                  <Text fontSize="sm" noOfLines={1}>
                                    {candidate.bio?.substring(0, 70) ||
                                      'No bio available'}
                                  </Text>
                                </Box>
                              </Flex>
                            </Radio>
                          </Card>
                        )
                      )}
                    </Stack>
                  </RadioGroup>
                ) : (
                  <Text color="gray.500">
                    No candidates available for this position
                  </Text>
                )}
              </CardBody>
            </Card>

            <Flex justify="space-between">
              <Button onClick={handlePrevious} isDisabled={currentStep === 0}>
                Previous
              </Button>

              {currentStep < election.positions.length - 1 ? (
                <Button
                  colorScheme="blue"
                  onClick={handleNext}
                  isDisabled={
                    !currentPosition?.candidates?.length ||
                    !selectedCandidates[currentPosition._id]
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  colorScheme="green"
                  onClick={handleSubmitVotes}
                  isLoading={submitting}
                  isDisabled={
                    !Object.keys(selectedCandidates).length ||
                    Object.keys(selectedCandidates).length !==
                      election.positions.filter(
                        (p) => p.candidates && p.candidates.length > 0
                      ).length
                  }
                >
                  Submit Votes
                </Button>
              )}
            </Flex>
          </Box>

          <Box>
            <Card variant="outline">
              <CardBody>
                <Heading size="md" mb={4}>
                  Your Selections
                </Heading>
                <VStack align="stretch" spacing={4}>
                  {election.positions.map(
                    (position: Position, index: number) => (
                      <Box
                        key={position._id}
                        p={3}
                        borderWidth={1}
                        borderRadius="md"
                        borderColor={
                          currentStep === index ? 'blue.300' : 'gray.200'
                        }
                        bg={currentStep === index ? 'blue.50' : 'white'}
                      >
                        <Flex justify="space-between" align="center">
                          <Text fontWeight="medium">{position.title}</Text>
                          {selectedCandidates[position._id] ? (
                            <Badge colorScheme="green">
                              {position.candidates?.find(
                                (c) =>
                                  c._id === selectedCandidates[position._id]
                              )?.name || 'Selected'}
                            </Badge>
                          ) : (
                            <Badge colorScheme="gray">Not selected</Badge>
                          )}
                        </Flex>
                      </Box>
                    )
                  )}
                </VStack>

                <Button
                  mt={6}
                  colorScheme="red"
                  variant="outline"
                  width="full"
                  onClick={() => navigate(`/elections/${id}`)}
                >
                  Cancel Voting
                </Button>
              </CardBody>
            </Card>
          </Box>
        </SimpleGrid>
      </Box>
    </DashboardLayout>
  );
};

export default VotingInterface;
