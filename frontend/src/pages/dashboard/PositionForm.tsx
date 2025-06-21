import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
  Heading,
  Container,
  Card,
  CardBody,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  useColorModeValue,
  Flex,
  Divider,
} from '@chakra-ui/react';
import electionService from '../../services/election.service';
import type { Position } from '../../types/election.types';
import DashboardLayout from '../../components/layout/DashboardLayout';

const PositionForm: React.FC = () => {
  const { id: electionId, positionId } = useParams<{ id: string; positionId?: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState<Partial<Position>>({
    name: '',
    description: '',
    order: 0,
  });
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    order?: string;
  }>({});

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const fetchPosition = async () => {
      if (!positionId) return;
      
      try {
        setIsLoading(true);
        const positions = await electionService.getPositions();
        const position = positions.find(p => p._id === positionId);
        if (position) {
          setPosition(position);
        } else {
          toast({
            title: 'Position not found',
            description: 'The requested position could not be found',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          navigate(`/elections/${electionId}`);
        }
      } catch (error) {
        console.error('Error fetching position:', error);
        toast({
          title: 'Error',
          description: 'Failed to load position details',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosition();
  }, [electionId, positionId, toast, navigate]);

  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      description?: string;
      order?: string;
    } = {};
    
    if (!position.name?.trim()) {
      newErrors.name = 'Position name is required';
    }
    
    if (!position.description?.trim()) {
      newErrors.description = 'Position description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!electionId) return;

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      if (positionId) {
        await electionService.updatePosition(positionId, position);
        toast({
          title: 'Success',
          description: 'Position updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await electionService.createPosition(electionId, position);
        toast({
          title: 'Success',
          description: 'Position created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      navigate(`/elections/${electionId}`);
    } catch (error) {
      console.error('Error saving position:', error);
      toast({
        title: 'Error',
        description: 'Failed to save position',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPosition((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOrderChange = (valueAsString: string, valueAsNumber: number) => {
    setPosition((prev) => ({
      ...prev,
      order: valueAsNumber,
    }));
  };

  return (
    <DashboardLayout>
      <Container maxW="container.md" py={5}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="md">
          <CardBody>
            <Heading size="lg" mb={6}>
              {positionId ? 'Edit Position' : 'Create New Position'}
            </Heading>
            
            <Divider mb={6} />

            <form onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch">
                <FormControl isInvalid={!!errors.name}>
                  <FormLabel htmlFor="name">Position Name</FormLabel>
                  <Input
                    id="name"
                    name="name"
                    value={position.name || ''}
                    onChange={handleChange}
                    placeholder="Enter position name"
                  />
                  {errors.name && (
                    <FormErrorMessage>{errors.name}</FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.description}>
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <Textarea
                    id="description"
                    name="description"
                    value={position.description || ''}
                    onChange={handleChange}
                    placeholder="Enter position description"
                    rows={4}
                  />
                  {errors.description && (
                    <FormErrorMessage>{errors.description}</FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.order}>
                  <FormLabel htmlFor="order">Display Order</FormLabel>
                  <NumberInput
                    id="order"
                    name="order"
                    value={position.order}
                    onChange={handleOrderChange}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Lower numbers appear first in the election
                  </Text>
                  {errors.order && (
                    <FormErrorMessage>{errors.order}</FormErrorMessage>
                  )}
                </FormControl>

                <Flex justify="space-between" mt={6}>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/elections/${electionId}`)}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="blue"
                    type="submit"
                    isLoading={isLoading}
                  >
                    {positionId ? 'Update Position' : 'Create Position'}
                  </Button>
                </Flex>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </Container>
    </DashboardLayout>
  );
};

export default PositionForm;
