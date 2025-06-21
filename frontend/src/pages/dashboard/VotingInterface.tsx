import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Divider,
  Radio,
  RadioGroup,
  Badge,
  Flex,
  Progress,
  SimpleGrid,
  Alert,
  AlertIcon,
  CardBody,
  Stack,
  Container,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import {
  Avatar,
  Card,
  Image,
} from '../../components/ui/chakra-components';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { Election, Position, Candidate } from '../../types/election.types';
import electionService from '../../services/election.service';

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

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const selectedBorder = useColorModeValue('blue.300', 'blue.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    const fetchElection = async () => {
      try {
        if (id) {
          setLoading(true);
          const data = await electionService.getElectionById(id);

          if (data.status !== 'ongoing') {
            toast({
              title: 'Warning',
              description: 'This election is not currently active for voting',
              status: 'warning',
              duration: 3000,
              isClosable: true,
            });
            navigate(`/elections/${id}`);
            return;
          }

          setElection(data);

          // Check if user has already voted in this election
          const hasUserVoted = await electionService.checkUserVoted();
          setHasVoted(hasUserVoted);
        }
      } catch (error) {
        console.error('Error loading election:', error);
        toast({
          title: 'Error',
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
        title: 'Success',
        description: 'Your votes have been recorded',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate(`/elections/${id}`);
    } catch (error) {
      console.error('Error submitting votes:', error);
      toast({
        title: 'Error',
        description: 'There was a problem recording your votes',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container maxW="container.xl" py={5}>
          <Text>Loading election details...</Text>
        </Container>
      </DashboardLayout>
    );
  }

  if (!election) {
    return (
      <DashboardLayout>
        <Container maxW="container.xl" py={5}>
          <Text>Election not found</Text>
          <Button mt={4} onClick={() => navigate('/elections/list')}>
            Back to Elections
          </Button>
        </Container>
      </DashboardLayout>
    );
  }

  if (hasVoted) {
    return (
      <DashboardLayout>
        <Container maxW="container.xl" py={5}>
          <Alert status="info" mb={5}>
            <AlertIcon />
            You have already cast your vote in this election.
          </Alert>
          <Button onClick={() => navigate(`/elections/${id}`)}>
            View Election Details
          </Button>
        </Container>
      </DashboardLayout>
    );
  }

  const currentPosition: Position | undefined = election.positions[currentStep];

  return (
    <DashboardLayout>
      <Container maxW="container.xl" py={5}>
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
                  {currentPosition?.name}
                </Heading>
                <Text mb={4}>{currentPosition?.description}</Text>

                <Divider my={4} />

                {election.candidates.filter(
                  (candidate) =>
                    candidate.position === currentPosition?._id &&
                    candidate.status === 'approved'
                ).length > 0 ? (
                  <RadioGroup
                    onChange={(value) =>
                      handleSelectCandidate(currentPosition?._id || '', value)
                    }
                    value={selectedCandidates[currentPosition?._id || ''] || ''}
                  >
                    <Stack direction="column" spacing={4}>
                      {election.candidates
                        .filter(
                          (candidate) =>
                            candidate.position === currentPosition?._id &&
                            candidate.status === 'approved'
                        )
                        .map((candidate: Candidate) => (
                          <Card
                            key={candidate._id}
                            p={3}
                            borderWidth="1px"
                            borderColor={
                              selectedCandidates[currentPosition?._id || ''] ===
                              candidate._id
                                ? selectedBorder
                                : borderColor
                            }
                            bg={
                              selectedCandidates[currentPosition?._id || ''] ===
                              candidate._id
                                ? selectedBg
                                : cardBg
                            }
                          >
                            <Radio value={candidate._id} width="full">
                              <Flex align="center">
                                {candidate.photoUrl ? (
                                  <Image
                                    src={candidate.photoUrl}
                                    alt={candidate.fullName}
                                    width="50px"
                                    height="50px"
                                    objectFit="cover"
                                    borderRadius="full"
                                    mr={3}
                                  />
                                ) : (
                                  <Avatar
                                    size="md"
                                    name={candidate.fullName}
                                    mr={3}
                                  />
                                )}
                                <Box>
                                  <Text fontWeight="semibold">
                                    {candidate.fullName}
                                  </Text>
                                  <Text fontSize="sm" noOfLines={1}>
                                    {candidate.manifesto?.substring(0, 70) ||
                                      'No manifesto available'}
                                  </Text>
                                </Box>
                              </Flex>
                            </Radio>
                          </Card>
                        ))}
                    </Stack>
                  </RadioGroup>
                ) : (
                  <Text color={mutedColor}>
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
                    !election.candidates.filter(
                      (candidate) =>
                        candidate.position === currentPosition?._id &&
                        candidate.status === 'approved'
                    ).length || !selectedCandidates[currentPosition?._id || '']
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
                      election.positions.filter((p) => {
                        const positionCandidates = election.candidates.filter(
                          (c) => c.position === p._id && c.status === 'approved'
                        );
                        return positionCandidates.length > 0;
                      }).length
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
                        borderWidth="1px"
                        borderRadius="md"
                        borderColor={
                          currentStep === index ? selectedBorder : borderColor
                        }
                        bg={currentStep === index ? selectedBg : cardBg}
                      >
                        <Flex justify="space-between" align="center">
                          <Text fontWeight="medium">{position.name}</Text>
                          {selectedCandidates[position._id] ? (
                            <Badge colorScheme="green">
                              {election.candidates.find(
                                (c) =>
                                  c._id === selectedCandidates[position._id]
                              )?.fullName || 'Selected'}
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
                  width="full"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => navigate(`/elections/${id}`)}
                >
                  Cancel Voting
                </Button>
              </CardBody>
            </Card>
          </Box>
        </SimpleGrid>
      </Container>
    </DashboardLayout>
  );
};

export default VotingInterface;
