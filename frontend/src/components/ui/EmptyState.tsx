import React from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Icon, 
  useColorModeValue 
} from '@chakra-ui/react';
import { IconType } from 'react-icons';
import { FaInbox } from 'react-icons/fa';

interface EmptyStateProps {
  icon?: IconType;
  title?: string;
  message?: string;
  height?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = FaInbox,
  title = 'No data found',
  message = 'There are no items to display.',
  height = '300px',
}) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box 
      py={10} 
      px={6} 
      borderRadius="lg" 
      bg={bgColor} 
      minH={height} 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      width="100%"
    >
      <VStack spacing={4}>
        <Icon as={icon} boxSize={12} color="blue.500" />
        <Text fontSize="xl" fontWeight="medium">{title}</Text>
        <Text color={textColor} textAlign="center" maxW="400px">
          {message}
        </Text>
      </VStack>
    </Box>
  );
};

export default EmptyState;
