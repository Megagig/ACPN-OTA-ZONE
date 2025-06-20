import React from 'react';
import {
  Box,
  Card,
  CardBody,
  StatArrow,
  Icon,
  Flex,
  useColorModeValue,
  Text,
  Progress,
} from '@chakra-ui/react';
import { IconType } from 'react-icons';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeText?: string;
  icon: IconType;
  iconColor?: string;
  progress?: number;
  progressColor?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeText,
  icon,
  iconColor = 'brand.500',
  progress,
  progressColor = 'brand',
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const iconBg = useColorModeValue('brand.50', 'brand.900');
  
  return (
    <Card bg={cardBg} shadow="sm" borderRadius="xl" overflow="hidden">
      <CardBody p={6}>
        <Flex justify="space-between" align="start">
          <Box>
            <Text fontSize="sm" color="gray.500" fontWeight="600" mb={1}>
              {title}
            </Text>
            <Text fontSize="2xl" fontWeight="bold" mb={2}>
              {value}
            </Text>
            {change !== undefined && (
              <Flex align="center">
                <StatArrow type={change >= 0 ? 'increase' : 'decrease'} />
                <Text
                  fontSize="sm"
                  color={change >= 0 ? 'green.500' : 'red.500'}
                  fontWeight="600"
                  mr={1}
                >
                  {Math.abs(change)}%
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {changeText}
                </Text>
              </Flex>
            )}
            {progress !== undefined && (
              <Box mt={4}>
                <Flex justify="space-between" align="center" mb={2}>
                  <Text fontSize="sm" color="gray.500">
                    Progress
                  </Text>
                  <Text fontSize="sm" fontWeight="600">
                    {progress}%
                  </Text>
                </Flex>
                <Progress
                  value={progress}
                  size="sm"
                  colorScheme={progressColor}
                  borderRadius="full"
                />
              </Box>
            )}
          </Box>
          <Box
            p={3}
            bg={iconBg}
            borderRadius="xl"
            color={iconColor}
          >
            <Icon as={icon} boxSize={6} />
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default StatsCard;
