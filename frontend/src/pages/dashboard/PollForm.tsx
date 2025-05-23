import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  HStack,
  Select,
  Checkbox,
  IconButton,
  RadioGroup,
  Radio,
  Card,
  CardBody,
  Divider,
  Flex,
  useToast,
  FormErrorMessage,
  Switch,
  Badge,
  Tooltip,
  useDisclosure,
  Collapse,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import {
  FaPlus,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaSave,
  FaCheckCircle,
  FaEdit,
  FaTimes,
} from 'react-icons/fa';
import { useFormik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { v4 as uuidv4 } from 'uuid';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type {
  Poll,
  PollQuestion,
  PollOption,
  QuestionType,
} from '../../types/poll.types';
import pollService from '../../services/poll.service';

interface PollFormValues {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isAnonymous: boolean;
  allowResultViewing: boolean;
  questions: PollQuestion[];
}

const PollForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [currentEditQuestion, setCurrentEditQuestion] = useState<number | null>(
    null
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const validationSchema = Yup.object({
    title: Yup.string().required('Title is required'),
    description: Yup.string().required('Description is required'),
    startDate: Yup.date().required('Start date is required'),
    endDate: Yup.date()
      .required('End date is required')
      .min(Yup.ref('startDate'), 'End date must be after start date'),
    questions: Yup.array()
      .of(
        Yup.object({
          text: Yup.string().required('Question text is required'),
          type: Yup.string().required('Question type is required'),
          options: Yup.array().when('type', {
            is: (type: string) =>
              type === 'multiple_choice' || type === 'single_choice',
            then: Yup.array()
              .of(
                Yup.object({
                  text: Yup.string().required('Option text is required'),
                })
              )
              .min(2, 'At least 2 options are required'),
          }),
        })
      )
      .min(1, 'At least one question is required'),
  });

  const initialValues: PollFormValues = {
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    isAnonymous: false,
    allowResultViewing: true,
    questions: [],
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (
      values: PollFormValues,
      { setSubmitting }: FormikHelpers<PollFormValues>
    ) => {
      try {
        const pollData: Partial<Poll> = {
          ...values,
          status: 'draft',
        };

        if (isEdit && id) {
          await pollService.updatePoll(id, pollData);
          toast({
            title: 'Poll updated',
            description: 'Poll has been updated successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } else {
          await pollService.createPoll(pollData);
          toast({
            title: 'Poll created',
            description: 'Poll has been created successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }

        navigate('/polls/list');
      } catch (error) {
        toast({
          title: 'Error saving poll',
          description: 'There was an error saving the poll',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    const fetchPoll = async () => {
      if (id) {
        try {
          setLoading(true);
          setIsEdit(true);
          const data = await pollService.getPollById(id);

          if (data.status !== 'draft') {
            toast({
              title: 'Cannot edit active or closed poll',
              description: 'Only draft polls can be edited',
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
            navigate('/polls/list');
            return;
          }

          // Format dates for form input
          const startDate = new Date(data.startDate)
            .toISOString()
            .split('T')[0];
          const endDate = new Date(data.endDate).toISOString().split('T')[0];

          formik.setValues({
            title: data.title,
            description: data.description,
            startDate,
            endDate,
            isAnonymous: data.isAnonymous,
            allowResultViewing: data.allowResultViewing,
            questions: data.questions,
          });
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
      } else {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [id, navigate, toast]);

  const addQuestion = () => {
    const newQuestion: PollQuestion = {
      _id: uuidv4(),
      text: '',
      type: 'single_choice',
      required: true,
      order: formik.values.questions.length + 1,
      options: [
        { _id: uuidv4(), text: '', order: 1 },
        { _id: uuidv4(), text: '', order: 2 },
      ],
    };

    formik.setFieldValue('questions', [
      ...formik.values.questions,
      newQuestion,
    ]);
    setCurrentEditQuestion(formik.values.questions.length);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = [...formik.values.questions];
    updatedQuestions.splice(index, 1);

    // Update order of remaining questions
    updatedQuestions.forEach((q, idx) => {
      q.order = idx + 1;
    });

    formik.setFieldValue('questions', updatedQuestions);

    if (currentEditQuestion === index) {
      setCurrentEditQuestion(null);
    } else if (currentEditQuestion && currentEditQuestion > index) {
      setCurrentEditQuestion(currentEditQuestion - 1);
    }
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formik.values.questions.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedQuestions = [...formik.values.questions];

    // Swap questions
    [updatedQuestions[index], updatedQuestions[newIndex]] = [
      updatedQuestions[newIndex],
      updatedQuestions[index],
    ];

    // Update order
    updatedQuestions.forEach((q, idx) => {
      q.order = idx + 1;
    });

    formik.setFieldValue('questions', updatedQuestions);

    // Update current edit question if needed
    if (currentEditQuestion === index) {
      setCurrentEditQuestion(newIndex);
    } else if (currentEditQuestion === newIndex) {
      setCurrentEditQuestion(index);
    }
  };

  const addOption = (questionIndex: number) => {
    const question = formik.values.questions[questionIndex];
    const options = question.options || [];

    const newOption: PollOption = {
      _id: uuidv4(),
      text: '',
      order: options.length + 1,
    };

    formik.setFieldValue(`questions[${questionIndex}].options`, [
      ...options,
      newOption,
    ]);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = formik.values.questions[questionIndex];
    const options = [...(question.options || [])];

    options.splice(optionIndex, 1);

    // Update order of remaining options
    options.forEach((opt, idx) => {
      opt.order = idx + 1;
    });

    formik.setFieldValue(`questions[${questionIndex}].options`, options);
  };

  const handleQuestionTypeChange = (
    questionIndex: number,
    newType: QuestionType
  ) => {
    formik.setFieldValue(`questions[${questionIndex}].type`, newType);

    // Reset or initialize options if needed
    if (newType === 'single_choice' || newType === 'multiple_choice') {
      const currentOptions =
        formik.values.questions[questionIndex].options || [];
      if (currentOptions.length < 2) {
        formik.setFieldValue(`questions[${questionIndex}].options`, [
          { _id: uuidv4(), text: '', order: 1 },
          { _id: uuidv4(), text: '', order: 2 },
        ]);
      }
    }
  };

  const toggleQuestionEdit = (index: number) => {
    setCurrentEditQuestion(currentEditQuestion === index ? null : index);
  };

  const renderQuestionForm = (question: PollQuestion, index: number) => {
    const isEditing = currentEditQuestion === index;
    const hasOptions =
      question.type === 'single_choice' || question.type === 'multiple_choice';

    return (
      <Card key={question._id} variant="outline" mb={4}>
        <CardBody>
          <Flex justify="space-between" align="center" mb={3}>
            <HStack>
              <Badge colorScheme="blue">Q{index + 1}</Badge>
              <Heading size="sm">
                {question.text || 'New Question'}
                {question.required && (
                  <Badge ml={2} colorScheme="red">
                    Required
                  </Badge>
                )}
              </Heading>
            </HStack>
            <HStack>
              <IconButton
                aria-label="Move question up"
                icon={<FaArrowUp />}
                size="sm"
                variant="ghost"
                isDisabled={index === 0}
                onClick={() => moveQuestion(index, 'up')}
              />
              <IconButton
                aria-label="Move question down"
                icon={<FaArrowDown />}
                size="sm"
                variant="ghost"
                isDisabled={index === formik.values.questions.length - 1}
                onClick={() => moveQuestion(index, 'down')}
              />
              <IconButton
                aria-label={isEditing ? 'Close editor' : 'Edit question'}
                icon={isEditing ? <FaTimes /> : <FaEdit />}
                size="sm"
                colorScheme={isEditing ? 'red' : 'blue'}
                variant="ghost"
                onClick={() => toggleQuestionEdit(index)}
              />
              <IconButton
                aria-label="Remove question"
                icon={<FaTrash />}
                size="sm"
                colorScheme="red"
                variant="ghost"
                onClick={() => removeQuestion(index)}
              />
            </HStack>
          </Flex>

          {!isEditing && (
            <Box>
              <Text color="gray.600" mb={2}>
                Type: {question.type.replace('_', ' ')}
              </Text>

              {hasOptions &&
                question.options &&
                question.options.length > 0 && (
                  <VStack align="start" mt={3} spacing={1}>
                    <Text fontWeight="bold">Options:</Text>
                    {question.options.map((option) => (
                      <Text key={option._id} ml={4}>
                        • {option.text || 'Empty option'}
                      </Text>
                    ))}
                  </VStack>
                )}
            </Box>
          )}

          <Collapse in={isEditing} animateOpacity>
            <Box mt={4}>
              <VStack spacing={4} align="stretch">
                <FormControl
                  isInvalid={
                    !!(
                      formik.touched.questions?.[index]?.text &&
                      formik.errors.questions?.[index]?.text
                    )
                  }
                >
                  <FormLabel>Question Text</FormLabel>
                  <Input
                    name={`questions[${index}].text`}
                    value={question.text}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter question text"
                  />
                  <FormErrorMessage>
                    {formik.touched.questions?.[index]?.text &&
                      formik.errors.questions?.[index]?.text}
                  </FormErrorMessage>
                </FormControl>

                <FormControl>
                  <FormLabel>Question Type</FormLabel>
                  <Select
                    name={`questions[${index}].type`}
                    value={question.type}
                    onChange={(e) =>
                      handleQuestionTypeChange(
                        index,
                        e.target.value as QuestionType
                      )
                    }
                  >
                    <option value="single_choice">Single Choice</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="text">Text Input</option>
                    <option value="rating">Rating (1-5)</option>
                    <option value="boolean">Yes/No</option>
                  </Select>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Required Question</FormLabel>
                  <Switch
                    name={`questions[${index}].required`}
                    isChecked={question.required}
                    onChange={(e) =>
                      formik.setFieldValue(
                        `questions[${index}].required`,
                        e.target.checked
                      )
                    }
                  />
                </FormControl>

                {hasOptions && (
                  <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                      <FormLabel mb="0">Options</FormLabel>
                      <Button
                        size="xs"
                        leftIcon={<FaPlus />}
                        onClick={() => addOption(index)}
                      >
                        Add Option
                      </Button>
                    </Flex>

                    <FormControl
                      isInvalid={
                        !!(
                          formik.touched.questions?.[index]?.options &&
                          formik.errors.questions?.[index]?.options
                        )
                      }
                    >
                      <VStack spacing={2} align="stretch">
                        {question.options?.map((option, optIndex) => (
                          <Flex key={option._id} align="center">
                            <Input
                              name={`questions[${index}].options[${optIndex}].text`}
                              value={option.text}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              placeholder={`Option ${optIndex + 1}`}
                              mr={2}
                            />
                            <IconButton
                              aria-label="Remove option"
                              icon={<FaTrash />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              isDisabled={question.options?.length <= 2}
                              onClick={() => removeOption(index, optIndex)}
                            />
                          </Flex>
                        ))}
                      </VStack>

                      <FormErrorMessage>
                        {formik.touched.questions?.[index]?.options &&
                          formik.errors.questions?.[index]?.options}
                      </FormErrorMessage>
                    </FormControl>
                  </Box>
                )}
              </VStack>
            </Box>
          </Collapse>
        </CardBody>
      </Card>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box p={5}>
          <Text>Loading...</Text>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box p={5}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">
            {isEdit ? 'Edit Poll' : 'Create New Poll'}
          </Heading>
          <HStack>
            <Button
              leftIcon={<FaEye />}
              variant="outline"
              onClick={onOpen}
              isDisabled={formik.values.questions.length === 0}
            >
              Preview
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              leftIcon={<FaSave />}
              onClick={() => formik.handleSubmit()}
              isLoading={formik.isSubmitting}
              isDisabled={
                Object.keys(formik.errors).length > 0 && formik.touched.title
              }
            >
              Save Poll
            </Button>
          </HStack>
        </Flex>

        <Card mb={6}>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <FormControl
                isInvalid={!!(formik.touched.title && formik.errors.title)}
              >
                <FormLabel>Poll Title</FormLabel>
                <Input
                  name="title"
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter poll title"
                />
                <FormErrorMessage>
                  {formik.touched.title && formik.errors.title}
                </FormErrorMessage>
              </FormControl>

              <FormControl
                isInvalid={
                  !!(formik.touched.description && formik.errors.description)
                }
              >
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter poll description"
                  rows={3}
                />
                <FormErrorMessage>
                  {formik.touched.description && formik.errors.description}
                </FormErrorMessage>
              </FormControl>

              <HStack spacing={4}>
                <FormControl
                  isInvalid={
                    !!(formik.touched.startDate && formik.errors.startDate)
                  }
                >
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    name="startDate"
                    type="date"
                    value={formik.values.startDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <FormErrorMessage>
                    {formik.touched.startDate && formik.errors.startDate}
                  </FormErrorMessage>
                </FormControl>

                <FormControl
                  isInvalid={
                    !!(formik.touched.endDate && formik.errors.endDate)
                  }
                >
                  <FormLabel>End Date</FormLabel>
                  <Input
                    name="endDate"
                    type="date"
                    value={formik.values.endDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <FormErrorMessage>
                    {formik.touched.endDate && formik.errors.endDate}
                  </FormErrorMessage>
                </FormControl>
              </HStack>

              <HStack spacing={8}>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Anonymous Responses</FormLabel>
                  <Tooltip label="If enabled, responses will not be linked to user identities">
                    <Switch
                      name="isAnonymous"
                      isChecked={formik.values.isAnonymous}
                      onChange={formik.handleChange}
                    />
                  </Tooltip>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Allow Viewing Results</FormLabel>
                  <Tooltip label="If enabled, members can view results while the poll is active">
                    <Switch
                      name="allowResultViewing"
                      isChecked={formik.values.allowResultViewing}
                      onChange={formik.handleChange}
                    />
                  </Tooltip>
                </FormControl>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Poll Questions</Heading>
          <Button
            leftIcon={<FaPlus />}
            colorScheme="teal"
            onClick={addQuestion}
          >
            Add Question
          </Button>
        </Flex>

        {formik.values.questions.length === 0 ? (
          <Card variant="outline">
            <CardBody textAlign="center" py={8}>
              <Text mb={4}>No questions added yet</Text>
              <Button
                leftIcon={<FaPlus />}
                colorScheme="teal"
                onClick={addQuestion}
              >
                Add Your First Question
              </Button>
            </CardBody>
          </Card>
        ) : (
          <VStack spacing={4} align="stretch">
            {formik.values.questions.map((question, index) =>
              renderQuestionForm(question, index)
            )}
          </VStack>
        )}

        <Flex justify="flex-end" mt={6}>
          <HStack>
            <Button variant="outline" onClick={() => navigate('/polls/list')}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              leftIcon={<FaSave />}
              onClick={() => formik.handleSubmit()}
              isLoading={formik.isSubmitting}
              isDisabled={
                Object.keys(formik.errors).length > 0 && formik.touched.title
              }
            >
              {isEdit ? 'Update Poll' : 'Create Poll'}
            </Button>
          </HStack>
        </Flex>

        {/* Preview Dialog */}
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
          size="xl"
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Poll Preview: {formik.values.title}
              </AlertDialogHeader>

              <AlertDialogBody>
                <Text mb={4}>{formik.values.description}</Text>

                <Divider my={4} />

                <VStack spacing={6} align="stretch">
                  {formik.values.questions.map((question, index) => (
                    <Box key={question._id}>
                      <Heading size="sm" mb={2}>
                        {index + 1}. {question.text}
                        {question.required && (
                          <Badge ml={2} colorScheme="red">
                            Required
                          </Badge>
                        )}
                      </Heading>

                      {question.type === 'single_choice' &&
                        question.options && (
                          <RadioGroup>
                            <VStack align="start" spacing={2}>
                              {question.options.map((option) => (
                                <Radio key={option._id} value={option._id}>
                                  {option.text}
                                </Radio>
                              ))}
                            </VStack>
                          </RadioGroup>
                        )}

                      {question.type === 'multiple_choice' &&
                        question.options && (
                          <VStack align="start" spacing={2}>
                            {question.options.map((option) => (
                              <Checkbox key={option._id}>
                                {option.text}
                              </Checkbox>
                            ))}
                          </VStack>
                        )}

                      {question.type === 'text' && (
                        <Textarea placeholder="Type your answer here..." />
                      )}

                      {question.type === 'rating' && (
                        <HStack spacing={4} justify="center">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <Button key={num} size="md" variant="outline">
                              {num}
                            </Button>
                          ))}
                        </HStack>
                      )}

                      {question.type === 'boolean' && (
                        <RadioGroup>
                          <HStack spacing={5}>
                            <Radio value="true">Yes</Radio>
                            <Radio value="false">No</Radio>
                          </HStack>
                        </RadioGroup>
                      )}
                    </Box>
                  ))}
                </VStack>
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Close Preview
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </DashboardLayout>
  );
};

export default PollForm;
