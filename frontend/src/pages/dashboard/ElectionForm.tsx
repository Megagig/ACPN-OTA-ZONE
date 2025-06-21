import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardBody,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Button,
  useToast,
  Text,
  Spinner,
  Center,
  useColorModeValue,
  Grid,
  GridItem,
  Checkbox,
  Flex,
  Divider,
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckIcon } from '@chakra-ui/icons';
import electionService from '../../services/election.service';
import type { Election, Position } from '../../types/election.types';

const ElectionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);

  const [formData, setFormData] = useState<Partial<Election>>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    rules: '',
    status: 'draft',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchPositions();

    if (isEditing) {
      fetchElection(id);
    }
  }, [id, isEditing]);

  const fetchPositions = async () => {
    try {
      const positions = await electionService.getPositions();
      setAvailablePositions(positions);    } catch (error) {
      console.error('Error fetching positions:', error);
      toast({
        title: 'Error loading positions',
        description: 'Failed to load available positions. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchElection = async (electionId: string) => {
    setIsLoading(true);
    try {
      const data = await electionService.getElectionById(electionId);
      setFormData({
        title: data.title,
        description: data.description,
        startDate: data.startDate.split('T')[0],
        endDate: data.endDate.split('T')[0],
        rules: data.rules || '',
        status: data.status,
      });

      // Set selected positions
      setSelectedPositions(data.positions.map((pos) => pos._id));    } catch (error) {
      console.error('Error fetching election:', error);
      toast({
        title: 'Error loading election',
        description: 'Failed to load election data. Please try again.',
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

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    if (checked) {
      setSelectedPositions((prev) => [...prev, value]);
    } else {
      setSelectedPositions((prev) => prev.filter((id) => id !== value));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.startDate) >= new Date(formData.endDate)
    ) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (selectedPositions.length === 0) {
      newErrors.positions = 'At least one position must be selected';
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
      // Prepare data - for startDate and endDate, append a default time
      const dataToSave = {
        ...formData,
        startDate: `${formData.startDate}T08:00:00`,
        endDate: `${formData.endDate}T17:00:00`,
      };

      let result;

      if (isEditing) {
        result = await electionService.updateElection(id, dataToSave);

        // Update positions separately
        // In a real app, this would be handled by the backend
        await electionService.getElectionById(id);
        const positionsToUse = availablePositions.filter((pos) =>
          selectedPositions.includes(pos._id)
        );
        result = await electionService.updateElection(id, {
          ...result,
          positions: positionsToUse,
        });
      } else {
        result = await electionService.createElection(dataToSave);

        // Update positions separately
        // In a real app, this would be handled by the backend
        const positionsToUse = availablePositions.filter((pos) =>
          selectedPositions.includes(pos._id)
        );
        result = await electionService.updateElection(result._id, {
          ...result,
          positions: positionsToUse,
        });      }

      toast({
        title: 'Election saved successfully',
        description: `Election has been ${isEditing ? 'updated' : 'created'} successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Navigate back to the elections list or detail page
      navigate(isEditing ? `/elections/${id}` : '/elections/list');
    } catch (error) {
      console.error('Error saving election:', error);
      toast({
        title: 'Error saving election',
        description: 'Failed to save election. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return (
      <Container maxW="container.lg" py={6}>
        <Center>
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text fontSize="lg" color="gray.600">
              Loading election data...
            </Text>
          </VStack>
        </Center>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Heading size="lg" color="gray.800">
            {isEditing ? 'Edit Election' : 'Create Election'}
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

        {/* Form Card */}
        <Card bg={bgColor} shadow="lg">
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
                        placeholder="Enter election title"
                        value={formData.title || ''}
                        onChange={handleChange}
                      />
                      <FormErrorMessage>{errors.title}</FormErrorMessage>
                    </FormControl>
                  </GridItem>

                  {/* Start Date */}
                  <GridItem>
                    <FormControl isRequired isInvalid={!!errors.startDate}>
                      <FormLabel>Start Date</FormLabel>
                      <Input
                        type="date"
                        name="startDate"
                        value={formData.startDate || ''}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <FormErrorMessage>{errors.startDate}</FormErrorMessage>
                    </FormControl>
                  </GridItem>

                  {/* End Date */}
                  <GridItem>
                    <FormControl isRequired isInvalid={!!errors.endDate}>
                      <FormLabel>End Date</FormLabel>
                      <Input
                        type="date"
                        name="endDate"
                        value={formData.endDate || ''}
                        onChange={handleChange}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                      />
                      <FormErrorMessage>{errors.endDate}</FormErrorMessage>
                    </FormControl>
                  </GridItem>

                  {/* Description */}
                  <GridItem colSpan={2}>
                    <FormControl isRequired isInvalid={!!errors.description}>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        name="description"
                        rows={3}
                        placeholder="Enter election description"
                        value={formData.description || ''}
                        onChange={handleChange}
                      />
                      <FormErrorMessage>{errors.description}</FormErrorMessage>
                    </FormControl>
                  </GridItem>

                  {/* Rules */}
                  <GridItem colSpan={2}>
                    <FormControl>
                      <FormLabel>Rules & Regulations</FormLabel>
                      <Textarea
                        name="rules"
                        rows={5}
                        placeholder="Enter election rules and regulations"
                        value={formData.rules || ''}
                        onChange={handleChange}
                      />
                    </FormControl>
                  </GridItem>

                  {/* Positions */}
                  <GridItem colSpan={2}>
                    <FormControl isRequired isInvalid={!!errors.positions}>
                      <FormLabel>Positions</FormLabel>
                      
                      {availablePositions.length === 0 ? (
                        <Text fontSize="sm" color="gray.500">
                          Loading available positions...
                        </Text>
                      ) : (
                        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
                          {availablePositions.map((position) => (
                            <Box key={position._id} p={3} border="1px" borderColor={borderColor} borderRadius="md">
                              <Checkbox
                                value={position._id}
                                isChecked={selectedPositions.includes(position._id)}
                                onChange={handlePositionChange}
                                alignItems="flex-start"
                              >
                                <VStack align="start" spacing={1} ml={2}>
                                  <Text fontWeight="medium" fontSize="sm">
                                    {position.name}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {position.description}
                                  </Text>
                                </VStack>
                              </Checkbox>
                            </Box>
                          ))}
                        </Grid>
                      )}
                      <FormErrorMessage>{errors.positions}</FormErrorMessage>
                    </FormControl>
                  </GridItem>
                </Grid>

                <Divider />

                {/* Submit Buttons */}
                <HStack spacing={3} justify="flex-end">
                  <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    isDisabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    leftIcon={<CheckIcon />}
                    isLoading={isSaving}
                    loadingText="Saving..."
                  >
                    Save Election
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default ElectionForm;
