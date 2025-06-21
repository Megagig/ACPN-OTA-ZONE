import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Textarea,
  Button,
  useToast,
  Text,
  Spinner,
  Center,
  useColorModeValue,
  Grid,
  GridItem,
  Switch,
  Flex,
  IconButton,
  Divider,
} from '@chakra-ui/react';
import { ArrowBackIcon, AttachmentIcon, CloseIcon, TimeIcon, CheckIcon } from '@chakra-ui/icons';
import communicationService from '../../services/communication.service';
import type { Communication, CommunicationType } from '../../types/communication.types';

const CommunicationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const toast = useToast();
  const queryParams = new URLSearchParams(location.search);
  const typeFromQuery = queryParams.get('type') as CommunicationType | null;

  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);

  const [formData, setFormData] = useState<Partial<Communication>>({
    title: '',
    content: '',
    type: typeFromQuery || 'announcement',
    recipientType: 'all_members',
    status: 'draft',
  });

  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (isEditing) {
      fetchCommunication(id);
    }
  }, [id, isEditing]);

  const fetchCommunication = async (commId: string) => {
    setIsLoading(true);
    try {
      const data = await communicationService.getCommunicationById(commId);
      setFormData(data);

      if (data.scheduledFor) {
        const date = new Date(data.scheduledFor);
        setScheduleDate(date.toISOString().split('T')[0]);
        setScheduleTime(date.toTimeString().slice(0, 5));
        setShowScheduleOptions(true);
      }      if (data.attachments) {
        setAttachments(data.attachments);
      }
    } catch (error) {
      console.error('Error fetching communication:', error);
      toast({
        title: 'Error fetching communication',
        description: 'Failed to load communication data. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content?.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.type) {
      newErrors.type = 'Communication type is required';
    }

    if (!formData.recipientType) {
      newErrors.recipientType = 'Recipient type is required';
    }

    if (showScheduleOptions) {
      if (!scheduleDate) {
        newErrors.scheduleDate = 'Schedule date is required';
      }

      if (!scheduleTime) {
        newErrors.scheduleTime = 'Schedule time is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // Prepare data
      const dataToSave = {
        ...formData,
        attachments,
      };

      if (isEditing && id) {
        await communicationService.updateCommunication(id, dataToSave);      } else {
        await communicationService.createCommunication(dataToSave);
      }

      toast({
        title: 'Communication saved successfully',
        description: `Communication has been ${isEditing ? 'updated' : 'created'} successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Navigate back to the communications list or detail page
      navigate(isEditing && id ? `/communications/${id}` : '/communications/list');
    } catch (error) {
      console.error('Error saving communication:', error);
      toast({
        title: 'Error saving communication',
        description: 'Failed to save communication. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleScheduleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsScheduling(true);

    try {
      // Create DateTime string for scheduled date
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);

      // First save the communication
      let commId = id;
      if (!isEditing) {
        const newComm = await communicationService.createCommunication({
          ...formData,
          attachments,
        });
        commId = newComm._id;
      } else if (id) {
        await communicationService.updateCommunication(id, {
          ...formData,
          attachments,
        });
      }

      // Then schedule it
      if (commId) {
        await communicationService.scheduleCommunication(
          commId,
          scheduledDateTime.toISOString()        );
      }

      toast({
        title: 'Communication scheduled successfully',
        description: 'Communication has been scheduled successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Navigate back to the communications list or detail page
      navigate(isEditing && id ? `/communications/${id}` : '/communications/list');
    } catch (error) {
      console.error('Error scheduling communication:', error);
      toast({
        title: 'Error scheduling communication',
        description: 'Failed to schedule communication. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This is just a mock implementation
    // In a real app, you would upload the file to a server and get back a URL

    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Mock attachment URLs
    const newAttachments = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };
  if (isLoading) {
    return (
      <Container maxW="container.lg" py={6}>
        <Center>
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text fontSize="lg" color="gray.600">
              Loading communication data...
            </Text>
          </VStack>
        </Center>
      </Container>
    );
  }
  return (
    <Container maxW="container.lg" py={6}>
      <Card bg={bgColor} shadow="md">
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="lg" color="gray.800">
              {isEditing ? 'Edit Communication' : 'New Communication'}
            </Heading>
            <Button
              leftIcon={<ArrowBackIcon />}
              variant="outline"
              colorScheme="gray"
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
          </Flex>
        </CardHeader>

        <CardBody>
          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                {/* Title */}
                <GridItem colSpan={2}>
                  <FormControl isRequired isInvalid={!!errors.title}>
                    <FormLabel>Title</FormLabel>
                    <Input
                      name="title"
                      placeholder="Enter communication title"
                      value={formData.title || ''}
                      onChange={handleChange}
                    />
                    <FormErrorMessage>{errors.title}</FormErrorMessage>
                  </FormControl>
                </GridItem>

                {/* Type */}
                <GridItem>
                  <FormControl isRequired isInvalid={!!errors.type}>
                    <FormLabel>Type</FormLabel>
                    <Select
                      name="type"
                      value={formData.type || ''}
                      onChange={handleChange}
                    >
                      <option value="announcement">Announcement</option>
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="private_message">Private Message</option>
                    </Select>
                    <FormErrorMessage>{errors.type}</FormErrorMessage>
                  </FormControl>
                </GridItem>

                {/* Recipients */}
                <GridItem>
                  <FormControl isRequired isInvalid={!!errors.recipientType}>
                    <FormLabel>Recipients</FormLabel>
                    <Select
                      name="recipientType"
                      value={formData.recipientType || ''}
                      onChange={handleChange}
                    >
                      <option value="all_members">All Members</option>
                      <option value="executives">Executives Only</option>
                      <option value="committee">Committee Members</option>
                      <option value="specific_members">Specific Members</option>
                    </Select>
                    <FormErrorMessage>{errors.recipientType}</FormErrorMessage>
                  </FormControl>
                </GridItem>

                {/* Content */}
                <GridItem colSpan={2}>
                  <FormControl isRequired isInvalid={!!errors.content}>
                    <FormLabel>Content</FormLabel>
                    <Textarea
                      name="content"
                      rows={8}
                      placeholder="Enter communication content"
                      value={formData.content || ''}
                      onChange={handleChange}
                    />
                    <FormErrorMessage>{errors.content}</FormErrorMessage>
                  </FormControl>
                </GridItem>                {/* Attachments */}
                <GridItem colSpan={2}>
                  <FormControl>
                    <FormLabel>Attachments</FormLabel>
                    <HStack spacing={4} mb={3}>
                      <Button
                        as="label"
                        leftIcon={<AttachmentIcon />}
                        variant="outline"
                        colorScheme="gray"
                        cursor="pointer"
                        size="sm"
                      >
                        Add Attachment
                        <Box as="input" type="file" hidden multiple onChange={handleAttachmentUpload} />
                      </Button>
                      <Text fontSize="sm" color="gray.500">
                        {attachments.length} {attachments.length === 1 ? 'file' : 'files'} attached
                      </Text>
                    </HStack>

                    {attachments.length > 0 && (
                      <VStack spacing={2} align="stretch">
                        {attachments.map((_, index) => (
                          <HStack
                            key={index}
                            p={3}
                            bg="gray.50"
                            borderRadius="md"
                            justify="space-between"
                          >
                            <Text fontSize="sm" color="gray.600">
                              Attachment {index + 1}
                            </Text>
                            <IconButton
                              aria-label="Remove attachment"
                              icon={<CloseIcon />}
                              size="xs"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleRemoveAttachment(index)}
                            />
                          </HStack>
                        ))}
                      </VStack>
                    )}
                  </FormControl>
                </GridItem>

                {/* Schedule Options */}
                <GridItem colSpan={2}>
                  <FormControl>
                    <HStack spacing={3} mb={4}>
                      <Switch
                        id="schedule-toggle"
                        isChecked={showScheduleOptions}
                        onChange={() => setShowScheduleOptions(!showScheduleOptions)}
                      />
                      <FormLabel htmlFor="schedule-toggle" mb={0}>
                        Schedule for later
                      </FormLabel>
                    </HStack>

                    {showScheduleOptions && (
                      <Box p={4} bg="gray.50" borderRadius="md" border="1px" borderColor={borderColor}>
                        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                          <GridItem>
                            <FormControl isRequired isInvalid={!!errors.scheduleDate}>
                              <FormLabel>Date</FormLabel>
                              <Input
                                type="date"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                              />
                              <FormErrorMessage>{errors.scheduleDate}</FormErrorMessage>
                            </FormControl>
                          </GridItem>

                          <GridItem>
                            <FormControl isRequired isInvalid={!!errors.scheduleTime}>
                              <FormLabel>Time</FormLabel>
                              <Input
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                              />
                              <FormErrorMessage>{errors.scheduleTime}</FormErrorMessage>
                            </FormControl>
                          </GridItem>
                        </Grid>
                      </Box>
                    )}
                  </FormControl>
                </GridItem>
              </Grid>              <Divider />

              {/* Action Buttons */}
              <HStack spacing={3} justify="flex-end">
                <Button
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>

                {showScheduleOptions ? (
                  <Button
                    leftIcon={<TimeIcon />}
                    colorScheme="blue"
                    isLoading={isScheduling}
                    loadingText="Scheduling..."
                    onClick={handleScheduleSubmit}
                  >
                    Schedule
                  </Button>
                ) : (
                  <>
                    <Button
                      type="submit"
                      colorScheme="purple"
                      isLoading={isSaving}
                      loadingText="Saving..."
                    >
                      Save as Draft
                    </Button>

                    <Button
                      leftIcon={<CheckIcon />}
                      colorScheme="green"
                      isLoading={isSaving}
                      loadingText="Processing..."
                      onClick={async () => {
                        if (validateForm()) {
                          try {
                            setIsSaving(true);
                            // First save/update the communication
                            let commId = id;
                            if (!isEditing) {
                              const newComm = await communicationService.createCommunication({
                                ...formData,
                                attachments,
                              });
                              commId = newComm._id;
                            } else {
                              await communicationService.updateCommunication(id, {
                                ...formData,
                                attachments,
                              });
                            }

                            // Then send it
                            if (commId) {
                              await communicationService.sendCommunication(commId);
                            }

                            toast({
                              title: 'Communication sent successfully',
                              description: 'Communication has been sent successfully.',
                              status: 'success',
                              duration: 3000,
                              isClosable: true,
                            });

                            // Navigate back
                            navigate('/communications/list');
                          } catch (error) {
                            console.error('Error sending communication:', error);
                            toast({
                              title: 'Error sending communication',
                              description: 'Failed to send communication. Please try again.',
                              status: 'error',
                              duration: 5000,
                              isClosable: true,
                            });
                          } finally {
                            setIsSaving(false);
                          }
                        }
                      }}
                    >
                      Send Now
                    </Button>
                  </>
                )}
              </HStack>
            </VStack>
          </Box>
        </CardBody>
      </Card>
    </Container>
  );
};

export default CommunicationForm;
