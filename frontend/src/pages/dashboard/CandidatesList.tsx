import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Text,
  SimpleGrid,
  Image,
  VStack,
  HStack,
  Button,
  Badge,
  Flex,
  useToast,
  Avatar,
} from '@chakra-ui/react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import type { Candidate, ElectionStatus } from '../../types/election.types';
import { electionService } from '../../services/election.service';

interface CandidatesListProps {
  candidates: Candidate[];
  electionStatus: ElectionStatus;
  positionId: string;
  electionId: string;
}

const CandidatesList: React.FC<CandidatesListProps> = ({
  candidates,
  electionStatus,
  positionId,
  electionId,
}) => {
  const navigate = useNavigate();
  const toast = useToast();

  const handleRemoveCandidate = async (candidateId: string) => {
    try {
      await electionService.removeCandidate(
        electionId,
        positionId,
        candidateId
      );
      toast({
        title: 'Candidate removed',
        description: 'Candidate has been removed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Refresh the page to show updated data
      navigate(0);
    } catch (error) {
      toast({
        title: 'Error removing candidate',
        description: 'Failed to remove candidate',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
      {candidates.map((candidate) => (
        <Box
          key={candidate._id}
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          p={4}
          boxShadow="sm"
          transition="all 0.3s"
          _hover={{ boxShadow: 'md' }}
        >
          <VStack spacing={3} align="stretch">
            <Flex justifyContent="center">
              {candidate.photoUrl ? (
                <Image
                  src={candidate.photoUrl}
                  alt={candidate.name}
                  boxSize="100px"
                  objectFit="cover"
                  borderRadius="full"
                />
              ) : (
                <Avatar size="xl" name={candidate.name} />
              )}
            </Flex>

            <Text fontWeight="bold" fontSize="lg" textAlign="center">
              {candidate.name}
            </Text>

            <Text fontSize="sm" color="gray.600" noOfLines={3}>
              {candidate.bio || 'No bio available'}
            </Text>

            {electionStatus === 'completed' && (
              <HStack justify="center">
                <Badge colorScheme="blue" fontSize="sm" px={2} py={1}>
                  {candidate.voteCount || 0} votes
                </Badge>
              </HStack>
            )}

            {electionStatus === 'draft' && (
              <HStack spacing={2} justify="center">
                <Button
                  size="sm"
                  leftIcon={<FaEdit />}
                  onClick={() =>
                    navigate(
                      `/elections/${electionId}/positions/${positionId}/candidates/${candidate._id}/edit`
                    )
                  }
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  leftIcon={<FaTrash />}
                  onClick={() => handleRemoveCandidate(candidate._id)}
                >
                  Remove
                </Button>
              </HStack>
            )}
          </VStack>
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default CandidatesList;
