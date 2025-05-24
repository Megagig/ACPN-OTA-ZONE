import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  useToast,
  Radio,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  Textarea,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Progress,
  Flex,
  Badge,
} from '@chakra-ui/react';
import type { Poll, PollQuestion } from '../../types/poll.types';
import pollService from '../../services/poll.service';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardBody } from '../../components/common/CardComponent';
import { Alert, AlertIcon } from '../../components/common/AlertComponent';

interface FormValues {
  [key: string]: string | string[] | number | boolean;
}

const PollResponse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formValues, setFormValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasResponded, setHasResponded] = useState<boolean>(false);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        if (id) {
          setLoading(true);
          const data = await pollService.getPollById(id);

          if (data.status !== 'active') {
            toast({
              title: 'Poll not active',
              description: 'This poll is not currently active for responses',
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
            navigate(`/polls/${id}`);
            return;
          }

          setPoll(data);

          // Check if user has already responded
          const hasUserResponded = await pollService.checkUserResponded(id);
          setHasResponded(hasUserResponded);
        }
      } catch (error) {
        toast({
          title: 'Error loading poll',
          description: 'Unable to load poll details',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate('/polls/list');
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [id, navigate, toast]);

  const handleInputChange = (
    questionId: string,
    value: string | string[] | number | boolean
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Clear error if exists
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateCurrentQuestion = (): boolean => {
    if (!poll) return false;

    const currentQuestion = poll.questions[currentStep];
    if (!currentQuestion.required) return true;

    const value = formValues[currentQuestion._id];
    if (value === undefined || value === null || value === '') {
      setErrors((prev) => ({
        ...prev,
        [currentQuestion._id]: 'This question requires an answer',
      }));
      return false;
    }

    if (Array.isArray(value) && value.length === 0) {
      setErrors((prev) => ({
        ...prev,
        [currentQuestion._id]: 'Please select at least one option',
      }));
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (
      validateCurrentQuestion() &&
      poll &&
      currentStep < poll.questions.length - 1
    ) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!poll || !id) return;

      // Final validation
      if (!validateCurrentQuestion()) return;

      setSubmitting(true);

      // Transform form values into the format expected by the API
      const answers = Object.entries(formValues).map(
        ([questionId, answer]) => ({
          questionId,
          answer,
        })
      );

      await pollService.submitPollResponse({
        pollId: id,
        answers,
      });

      toast({
        title: 'Response submitted',
        description: 'Your response has been recorded successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      navigate(`/polls/${id}`);
    } catch (error) {
      toast({
        title: 'Error submitting response',
        description: 'There was a problem submitting your response',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question: PollQuestion) => {
    switch (question.type) {
      case 'single_choice':
        return (
          <RadioGroup
            onChange={(value) => handleInputChange(question._id, value)}
            value={(formValues[question._id] as string) || ''}
          >
            <VStack align="start" spacing={3}>
              {question.options?.map((option) => (
                <Radio key={option._id} value={option._id}>
                  {option.text}
                </Radio>
              ))}
            </VStack>
          </RadioGroup>
        );

      case 'multiple_choice':
        return (
          <CheckboxGroup
            onChange={(value) => handleInputChange(question._id, value)}
            value={(formValues[question._id] as string[]) || []}
          >
            <VStack align="start" spacing={3}>
              {question.options?.map((option) => (
                <Checkbox key={option._id} value={option._id}>
                  {option.text}
                </Checkbox>
              ))}
            </VStack>
          </CheckboxGroup>
        );

      case 'text':
        return (
          <Textarea
            value={(formValues[question._id] as string) || ''}
            onChange={(e) => handleInputChange(question._id, e.target.value)}
            placeholder="Type your answer here..."
            rows={4}
          />
        );

      case 'rating':
        return (
          <Box>
            <HStack spacing={4} justify="center" mb={2}>
              {[1, 2, 3, 4, 5].map((num) => (
                <Button
                  key={num}
                  size="lg"
                  colorScheme={
                    formValues[question._id] === num ? 'blue' : 'gray'
                  }
                  onClick={() => handleInputChange(question._id, num)}
                  h="60px"
                  w="60px"
                >
                  {num}
                </Button>
              ))}
            </HStack>
            <Flex justify="space-between" width="100%">
              <Text fontSize="sm" color="gray.500">
                Poor
              </Text>
              <Text fontSize="sm" color="gray.500">
                Excellent
              </Text>
            </Flex>
          </Box>
        );

      case 'boolean':
        return (
          <RadioGroup
            onChange={(value) =>
              handleInputChange(question._id, value === 'true')
            }
            value={
              formValues[question._id] === true
                ? 'true'
                : formValues[question._id] === false
                ? 'false'
                : ''
            }
          >
            <HStack spacing={5}>
              <Radio value="true">Yes</Radio>
              <Radio value="false">No</Radio>
            </HStack>
          </RadioGroup>
        );

      default:
        return <Text color="red.500">Unsupported question type</Text>;
    }
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

  if (hasResponded) {
    return (
      <DashboardLayout>
        <Box p={5}>
          <Alert status="info" mb={5}>
            <AlertIcon />
            You have already responded to this poll.
          </Alert>
          <Button onClick={() => navigate(`/polls/${id}`)}>
            View Poll Details
          </Button>
        </Box>
      </DashboardLayout>
    );
  }

  const currentQuestion = poll.questions[currentStep];

  return (
    <DashboardLayout>
      <Box p={5}>
        <Heading size="lg" mb={2}>
          {poll.title}
        </Heading>
        <Text mb={4}>{poll.description}</Text>

        <Progress
          value={(currentStep / poll.questions.length) * 100}
          size="sm"
          colorScheme="blue"
          mb={5}
          borderRadius="md"
        />

        <Card variant="outline" mb={6}>
          <CardBody>
            <Heading size="md" mb={4}>
              Question {currentStep + 1} of {poll.questions.length}
              {currentQuestion.required && (
                <Badge ml={2} colorScheme="red">
                  Required
                </Badge>
              )}
            </Heading>

            <FormControl isInvalid={!!errors[currentQuestion._id]} mb={6}>
              <FormLabel fontWeight="bold">{currentQuestion.text}</FormLabel>
              {renderQuestionInput(currentQuestion)}
              <FormErrorMessage>{errors[currentQuestion._id]}</FormErrorMessage>
            </FormControl>

            <Flex justify="space-between">
              <Button onClick={handlePrevious} isDisabled={currentStep === 0}>
                Previous
              </Button>

              {currentStep < poll.questions.length - 1 ? (
                <Button colorScheme="blue" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button
                  colorScheme="green"
                  onClick={handleSubmit}
                  isLoading={submitting}
                >
                  Submit
                </Button>
              )}
            </Flex>
          </CardBody>
        </Card>
      </Box>
    </DashboardLayout>
  );
};

export default PollResponse;
