import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  IconButton,
  useToast,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import electionService from '../../services/election.service';
import type { Position, Election } from '../../types/election.types';

interface PositionsListProps {
  positions: Position[];
  electionId: string;
  electionStatus: 'draft' | 'upcoming' | 'ongoing' | 'ended' | 'cancelled';
}

const PositionsList: React.FC<PositionsListProps> = ({ electionId }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [election, setElection] = useState<Election | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [positionsData, electionData] = await Promise.all([
          electionService.getPositions(),
          electionService.getElectionById(electionId)
        ]);
        setPositions(positionsData);
        setElection(electionData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (electionId) {
      fetchData();
    }
  }, [electionId, toast]);

  const handleDelete = async (positionId: string) => {
    try {
      await electionService.deletePosition(positionId);
      setPositions(positions.filter(p => p._id !== positionId));
      toast({
        title: 'Position deleted',
        description: 'Position has been deleted successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting position:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete position',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Center h="200px">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Positions</Heading>
          {election?.status === 'draft' && (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={() => navigate(`/elections/${electionId}/positions/new`)}
            >
              Add Position
            </Button>
          )}
        </HStack>

        {positions.length === 0 ? (
          <Text>No positions found. Add a position to get started.</Text>
        ) : (
          <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
            {positions.map((position) => (
              <Box
                key={position._id}
                p={5}
                shadow="md"
                borderWidth="1px"
                borderRadius="md"
                _hover={{ shadow: 'lg' }}
              >
                <VStack align="stretch" spacing={3}>
                  <Heading size="md">{position.name}</Heading>
                  <Text>{position.description || 'No description available'}</Text>
                  <Text fontSize="sm" color="gray.500">
                    Order: {position.order}
                  </Text>
                  <HStack justify="space-between">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/elections/${electionId}/candidates/${position._id}`)}
                    >
                      View Candidates
                    </Button>
                    {election?.status === 'draft' && (
                      <HStack>
                        <IconButton
                          aria-label="Edit position"
                          icon={<EditIcon />}
                          size="sm"
                          onClick={() => navigate(`/elections/${electionId}/positions/${position._id}/edit`)}
                        />
                        <IconButton
                          aria-label="Delete position"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDelete(position._id)}
                        />
                      </HStack>
                    )}
                  </HStack>
                </VStack>
              </Box>
            ))}
          </Grid>
        )}
      </VStack>
    </Box>
  );
};

export default PositionsList; 