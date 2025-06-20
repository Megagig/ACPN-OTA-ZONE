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
} from '@chakra-ui/react';
import electionService from '../../services/election.service';
import type { Position } from '../../types/election.types';

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

  useEffect(() => {
    const fetchPosition = async () => {
      if (!positionId) return;
      
      try {
        const positions = await electionService.getPositions();
        const position = positions.find(p => p._id === positionId);
        if (position) {
          setPosition(position);
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
      }
    };

    fetchPosition();
  }, [electionId, positionId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!electionId) return;

    setIsLoading(true);
    try {
      if (positionId) {
        await electionService.updatePosition(positionId, position);
        toast({
          title: 'Position updated',
          description: 'Position has been updated successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        await electionService.createPosition(position);
        toast({
          title: 'Position created',
          description: 'Position has been created successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
      navigate(`/elections/${electionId}/positions`);
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

  return (
    <Box maxW="container.md" mx="auto" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">
          {positionId ? 'Edit Position' : 'Create New Position'}
        </Heading>

        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Position Name</FormLabel>
              <Input
                value={position.name}
                onChange={(e) => setPosition({ ...position, name: e.target.value })}
                placeholder="Enter position name"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={position.description}
                onChange={(e) => setPosition({ ...position, description: e.target.value })}
                placeholder="Enter position description"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Order</FormLabel>
              <Input
                type="number"
                value={position.order}
                onChange={(e) => setPosition({ ...position, order: parseInt(e.target.value) })}
                placeholder="Enter position order"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isLoading}
              loadingText="Saving..."
              width="full"
            >
              {positionId ? 'Update Position' : 'Create Position'}
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate(`/elections/${electionId}/positions`)}
              width="full"
            >
              Cancel
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default PositionForm; 