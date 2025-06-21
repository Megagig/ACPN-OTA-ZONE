import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Icon,
  HStack,
  useColorModeValue,
  Flex,
  usePrefersReducedMotion
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  FaHome,
  FaArrowLeft,
  FaExclamationTriangle,
  FaSearch
} from 'react-icons/fa';
import ThemeToggle from '../../components/ui/ThemeToggle';

// Floating animation for the 404 number
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(1deg); }
`;

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = usePrefersReducedMotion();

  // Color mode values
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'linear(to-br, gray.900, blue.900, purple.900)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const animation = prefersReducedMotion
    ? undefined
    : `${float} infinite 3s ease-in-out`;

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Box minH="100vh" bgGradient={bgGradient} position="relative">
      {/* Theme Toggle */}
      <Box position="absolute" top={4} right={4} zIndex={10}>
        <ThemeToggle />
      </Box>

      <Container maxW="4xl" py={{ base: 8, md: 16 }}>
        <Flex
          direction="column"
          align="center"
          justify="center"
          minH="80vh"
          textAlign="center"
        >
          <VStack spacing={8} maxW="2xl">
            {/* 404 Illustration */}
            <Box position="relative">
              <VStack spacing={4}>
                {/* Large 404 Text */}
                <Heading
                  fontSize={{ base: '8xl', md: '12xl', lg: '14xl' }}
                  fontWeight="black"
                  bgGradient="linear(to-r, blue.400, purple.500, pink.500)"
                  bgClip="text"
                  animation={animation}
                  lineHeight="0.8"
                >
                  404
                </Heading>
                
                {/* Warning Icon */}
                <Icon
                  as={FaExclamationTriangle}
                  boxSize={{ base: 16, md: 20 }}
                  color="yellow.400"
                  position="absolute"
                  top={{ base: "20%", md: "25%" }}
                  right={{ base: "-20%", md: "-15%" }}
                  animation={animation}
                  style={{
                    animationDelay: '0.5s'
                  }}
                />
              </VStack>
            </Box>

            {/* Content Card */}
            <Box
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="2xl"
              p={{ base: 8, md: 10 }}
              shadow="2xl"
              backdropFilter="blur(10px)"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                bgGradient: 'linear(to-r, blue.400, purple.500, pink.500)',
              }}
            >
              <VStack spacing={6}>
                {/* Main Heading */}
                <VStack spacing={3}>
                  <Heading
                    size={{ base: 'xl', md: '2xl' }}
                    bgGradient="linear(to-r, blue.400, purple.500)"
                    bgClip="text"
                  >
                    Oops! Page Not Found
                  </Heading>
                  <Text
                    fontSize={{ base: 'md', md: 'lg' }}
                    color={textColor}
                    maxW="md"
                    lineHeight="relaxed"
                  >
                    The page you're looking for seems to have vanished into the digital void. 
                    But don't worry, we're here to help you get back on track!
                  </Text>
                </VStack>

                {/* Helpful Suggestions */}
                <Box
                  bg={useColorModeValue('blue.50', 'blue.900/20')}
                  borderRadius="lg"
                  p={4}
                  borderLeftWidth="4px"
                  borderLeftColor="blue.400"
                  w="full"
                >
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Icon as={FaSearch} color="blue.400" />
                      <Text fontSize="sm" fontWeight="medium" color="blue.600">
                        What you can try:
                      </Text>
                    </HStack>
                    <VStack align="start" spacing={1} fontSize="sm" color={textColor} pl={6}>
                      <Text>• Check the URL for any typos</Text>
                      <Text>• Use the navigation menu to find what you need</Text>
                      <Text>• Return to the dashboard and start fresh</Text>
                    </VStack>
                  </VStack>
                </Box>

                {/* Action Buttons */}
                <VStack spacing={4} w="full" maxW="sm">
                  <Button
                    as={RouterLink}
                    to="/dashboard"
                    leftIcon={<Icon as={FaHome} />}
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    bgGradient="linear(to-r, blue.400, blue.500)"
                    _hover={{
                      bgGradient: 'linear(to-r, blue.500, blue.600)',
                      transform: 'translateY(-2px)',
                      shadow: 'lg'
                    }}
                    transition="all 0.2s"
                  >
                    Return to Dashboard
                  </Button>

                  <HStack spacing={3} w="full">
                    <Button
                      leftIcon={<Icon as={FaArrowLeft} />}
                      onClick={handleGoBack}
                      variant="outline"
                      colorScheme="gray"
                      size="md"
                      flex={1}
                      _hover={{
                        transform: 'translateY(-1px)',
                        shadow: 'md'
                      }}
                      transition="all 0.2s"
                    >
                      Go Back
                    </Button>

                    <Button
                      as={RouterLink}
                      to="/"
                      variant="ghost"
                      colorScheme="gray"
                      size="md"
                      flex={1}
                      _hover={{
                        bg: useColorModeValue('gray.100', 'gray.700'),
                        transform: 'translateY(-1px)'
                      }}
                      transition="all 0.2s"
                    >
                      Homepage
                    </Button>
                  </HStack>
                </VStack>
              </VStack>
            </Box>

            {/* Footer Message */}
            <Text
              fontSize="sm"
              color={useColorModeValue('gray.500', 'gray.400')}
              maxW="md"
            >
              If you continue to experience issues, please contact our support team.
              We're here to help! 🚀
            </Text>
          </VStack>
        </Flex>
      </Container>
    </Box>
  );
};

export default NotFound;
