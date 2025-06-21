import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  VStack,
  HStack,
  Button,
  Badge,
  SimpleGrid,
  Skeleton,
  useColorModeValue,
  Center,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import electionService from '../../services/election.service';
import type { Election, Position } from '../../types/election.types';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColorScheme = (status: string) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'blue';
      case 'ongoing':
        return 'green';
      case 'ended':
        return 'gray';
      case 'cancelled':
        return 'red';
      case 'draft':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  return (
    <Badge colorScheme={getStatusColorScheme(status)} variant="subtle">
      {status}
    </Badge>
  );
};

const ElectionList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [elections, setElections] = useState<Election[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    const fetchElections = async () => {
      try {
        setLoading(true);
        const data = await electionService.getElections();
        setElections(data);
      } catch (error) {
        console.error('Error fetching elections:', error);
        setError('Failed to load elections. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, []);

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  if (loading) {
    return (
      <Container maxW="6xl" py={6}>
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between" align="center">
            <Skeleton height="40px" width="200px" />
            <Skeleton height="40px" width="150px" />
          </HStack>
          
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {[1, 2, 3].map((i) => (
              <Card key={i} bg={cardBg} shadow="md">
                <CardHeader>
                  <Skeleton height="24px" width="75%" />
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Skeleton height="16px" width="50%" />
                    <Skeleton height="16px" width="33%" />
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="6xl" py={6}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="6xl" py={6}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading size="lg">Elections</Heading>
          <Button 
            colorScheme="blue" 
            onClick={() => navigate('/elections/create')}
          >
            Create Election
          </Button>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {elections.map((election) => (
            <Card 
              key={election._id} 
              bg={cardBg} 
              shadow="md" 
              _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={() => navigate(`/elections/${election._id}`)}
            >
              <CardHeader>
                <HStack justify="space-between" align="flex-start">
                  <Heading size="md" noOfLines={2}>
                    {election.title}
                  </Heading>                  <StatusBadge status={election.status} />
                </HStack>
              </CardHeader>
              
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="medium" color="gray.600">
                        Start Date:
                      </Text>
                      <Text fontSize="sm">{formatDate(election.startDate)}</Text>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="medium" color="gray.600">
                        End Date:
                      </Text>
                      <Text fontSize="sm">{formatDate(election.endDate)}</Text>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="medium" color="gray.600">
                        Positions:
                      </Text>
                      <Text fontSize="sm">{election.positions?.length || 0}</Text>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="medium" color="gray.600">
                        Candidates:
                      </Text>
                      <Text fontSize="sm">
                        {election.positions?.reduce(
                          (acc: number, pos: Position) => acc + (pos.candidates?.length || 0),
                          0
                        ) || 0}
                      </Text>
                    </HStack>
                  </VStack>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    colorScheme="blue"
                    w="full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/elections/${election._id}`);
                    }}
                  >
                    View Details
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
        
        {elections.length === 0 && (
          <Center py={10}>
            <VStack spacing={3}>
              <Text color="gray.500" fontSize="lg">No elections found</Text>
              <Button 
                colorScheme="blue" 
                variant="outline"
                onClick={() => navigate('/elections/create')}
              >
                Create Your First Election
              </Button>
            </VStack>
          </Center>
        )}
      </VStack>
    </Container>
  );
};

export default ElectionList; 