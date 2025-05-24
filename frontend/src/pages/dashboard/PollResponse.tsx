import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Flex,
  Badge,
  Radio,
  RadioGroup,
  Checkbox,
  //   CheckboxGroup,
  Textarea,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Progress,
} from '../../components/ui/TailwindComponentsFixed';
import type { Poll, PollQuestion } from '../../types/poll.types';
import pollService from '../../services/poll.service';
import { Card, CardBody } from '../../components/common/CardComponent';
import { Alert, AlertIcon } from '../../components/common/AlertComponent';
import { useToast } from '../../hooks/useToast';

interface FormValues {
  [key: string]: string | string[] | number | boolean;
}

const PollResponse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
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
          setPoll(data);

          // Check if user has already responded
          const hasUserResponded = await pollService.hasUserResponded(id);
          setHasResponded(hasUserResponded);
        }
      } catch (error) {
        showToast('Error loading poll', 'Unable to load poll data', 'error');
        navigate('/polls/list');
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [id, navigate, showToast]);

  const handleInputChange = (
    questionId: string,
    value: string | string[] | number | boolean
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Clear error for this field
    if (errors[questionId]) {
      setErrors((prev) => ({
        ...prev,
        [questionId]: '',
      }));
    }
  };

  const validateStep = (stepIndex: number): boolean => {
    if (!poll) return false;

    const question = poll.questions[stepIndex];
    const value = formValues[question._id];
    const newErrors: { [key: string]: string } = {};

    if (question.isRequired) {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        newErrors[question._id] = 'This question is required';
      }
    }

    setErrors((prev) => ({
      ...prev,
      ...newErrors,
    }));

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!poll || !validateStep(currentStep)) return;

    try {
      setSubmitting(true);

      // Transform form values to the format expected by the API
      const responses = Object.keys(formValues).map((questionId) => ({
        question: questionId,
        answer: formValues[questionId],
      }));

      await pollService.submitPollResponse(id!, {
        responses,
      });

      showToast(
        'Response submitted',
        'Thank you for completing this poll',
        'success'
      );

      navigate(`/polls/${id}`);
    } catch (error) {
      showToast(
        'Error submitting response',
        'There was a problem recording your response',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionByType = (question: PollQuestion) => {
    switch (question.type) {
      case 'multipleChoice':
        return (
          <RadioGroup
            value={formValues[question._id] as string}
            onChange={(value) => handleInputChange(question._id, value)}
          >
            <VStack align="start" spacing={3}>
              {question.options.map((option) => (
                <Radio key={option} value={option}>
                  {option}
                </Radio>
              ))}
            </VStack>
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <CheckboxGroup
            value={formValues[question._id] as string[]}
            onChange={(value) => handleInputChange(question._id, value)}
          >
            <VStack align="start" spacing={3}>
              {question.options.map((option) => (
                <Checkbox key={option} value={option}>
                  {option}
                </Checkbox>
              ))}
            </VStack>
          </CheckboxGroup>
        );

      case 'text':
        return (
          <Textarea
            value={formValues[question._id] as string}
            onChange={(e) => handleInputChange(question._id, e.target.value)}
            placeholder="Enter your answer here"
            className="w-full"
          />
        );

      default:
        return <Text className="text-red-500">Unsupported question type</Text>;
    }
  };

  if (loading) {
    return (
      <Box className="p-5">
        <Text>Loading poll...</Text>
      </Box>
    );
  }

  if (!poll) {
    return (
      <Box className="p-5">
        <Alert status="error" className="mb-4">
          <AlertIcon />
          Poll not found
        </Alert>
        <Button onClick={() => navigate('/polls/list')}>Back to Polls</Button>
      </Box>
    );
  }

  if (hasResponded) {
    return (
      <Box className="p-5">
        <Alert status="info" className="mb-4">
          <AlertIcon />
          You have already submitted a response to this poll.
        </Alert>
        <Button onClick={() => navigate(`/polls/${id}`)}>
          View Poll Details
        </Button>
      </Box>
    );
  }

  const currentQuestion = poll.questions[currentStep];

  return (
    <Box className="p-5">
      <Heading size="lg" className="mb-2">
        {poll.title}
      </Heading>
      <Text className="mb-4">{poll.description}</Text>

      <Progress
        value={(currentStep / poll.questions.length) * 100}
        size="sm"
        colorScheme="blue"
        className="mb-5 rounded-md"
      />

      <Card className="mb-5">
        <CardBody>
          <Heading size="md" className="mb-3">
            Question {currentStep + 1} of {poll.questions.length}
          </Heading>
          <Text className="font-medium mb-3">
            {currentQuestion.text}
            {currentQuestion.isRequired && (
              <Badge colorScheme="red" className="ml-2">
                Required
              </Badge>
            )}
          </Text>

          <FormControl
            isInvalid={!!errors[currentQuestion._id]}
            className="mt-4"
          >
            {renderQuestionByType(currentQuestion)}
            {errors[currentQuestion._id] && (
              <FormErrorMessage>{errors[currentQuestion._id]}</FormErrorMessage>
            )}
          </FormControl>
        </CardBody>
      </Card>

      <Flex justify="between" className="mt-4">
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
    </Box>
  );
};

export default PollResponse;
