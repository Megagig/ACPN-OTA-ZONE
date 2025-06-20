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
} from '@chakra-ui/react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useToast } from '../../hooks/useToast';
import electionService from '../../services/election.service';
import type { Candidate, ElectionStatus } from '../../types/election.types';

interface CandidatesListProps {
  candidates: Candidate[];
  electionStatus: ElectionStatus;
  positionId: string;
  electionId: string;
  onCandidateRemoved: () => void;
}

const CandidatesList: React.FC<CandidatesListProps> = ({
  candidates,
  electionStatus,
  positionId,
  electionId,
  onCandidateRemoved,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRemoveCandidate = async (candidateId: string) => {
    try {
      await electionService.deleteCandidate(candidateId);
      toast({ title: 'Candidate removed successfully', status: 'success' });
      onCandidateRemoved();
    } catch (error) {
      console.error('Error removing candidate:', error);
      toast({ title: 'Failed to remove candidate', status: 'error' });
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
