import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Button,
  Badge,
  Flex,
  Avatar,
} from '../../components/ui/TailwindComponentsFixed';
import { FaEdit, FaTrash } from 'react-icons/fa';
import type { Candidate, ElectionStatus } from '../../types/election.types';
import electionService from '../../services/election.service';
import { useToast } from '../../hooks/useToast';

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
  const { showToast } = useToast();

  const handleRemoveCandidate = async (candidateId: string) => {
    try {
      await electionService.removeCandidate(
        electionId,
        positionId,
        candidateId
      );
      showToast(
        'Candidate removed',
        'Candidate has been removed successfully',
        'success'
      );
      // Refresh the page to show updated data
      navigate(0);
    } catch (error) {
      console.error('Error removing candidate:', error);
      showToast(
        'Error removing candidate',
        'Failed to remove candidate',
        'error'
      );
    }
  };

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
      {candidates.map((candidate) => (
        <Box
          key={candidate._id}
          className="border border-gray-200 rounded-lg overflow-hidden p-4 shadow-sm transition-all duration-300 hover:shadow-md"
        >
          <VStack spacing={3} align="stretch">
            <Flex className="justify-center">
              {candidate.photoUrl ? (
                <img
                  src={candidate.photoUrl}
                  alt={candidate.fullName}
                  className="w-24 h-24 object-cover rounded-full"
                />
              ) : (
                <Avatar size="xl" name={candidate.fullName} />
              )}
            </Flex>

            <Text className="font-bold text-lg text-center">
              {candidate.fullName}
            </Text>

            <Text className="text-sm text-gray-600 line-clamp-3">
              {candidate.manifesto || 'No manifesto available'}
            </Text>

            {electionStatus === 'ended' && (
              <HStack justify="center">
                <Badge colorScheme="blue" className="text-sm px-2 py-1">
                  {candidate.votes || 0} votes
                </Badge>
              </HStack>
            )}

            {electionStatus === 'draft' && (
              <HStack spacing={2} className="justify-center">
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
