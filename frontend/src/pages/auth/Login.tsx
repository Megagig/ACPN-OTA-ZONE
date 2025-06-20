import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Link,
  Alert,
  AlertIcon,
  useColorModeValue,  IconButton,
  Divider,
  Image,
  useToast,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { FaGoogle, FaFacebook, FaEye, FaEyeSlash } from 'react-icons/fa';
import ThemeToggle from '../../components/ui/ThemeToggle';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.200');

  // Get the previous location or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login({ email, password });
      // Set login timestamp for notification modal
      sessionStorage.setItem('loginTime', new Date().getTime().toString());
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      const errorMessage = 
        err.response?.data?.message ||
        'Failed to login. Please check your credentials.';
      setError(errorMessage);
      toast({
        title: 'Login Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      minH="100vh" 
      bg={useColorModeValue('gray.50', 'gray.900')}
      py={12}
      px={4}
    >
      {/* Background Elements */}
      <Box position="absolute" inset={0} overflow="hidden" zIndex={0}>
        <Box 
          position="absolute" 
          top={0} 
          right={0} 
          w="96" 
          h="96" 
          bg="blue.100" 
          borderRadius="full" 
          filter="blur(60px)" 
          transform="translate(50%, -50%)"
          opacity={0.6}
        />
        <Box 
          position="absolute" 
          bottom={0} 
          left={0} 
          w="96" 
          h="96" 
          bg="purple.100" 
          borderRadius="full" 
          filter="blur(60px)" 
          transform="translate(-50%, 50%)"
          opacity={0.6}
        />
      </Box>

      <Container maxW="md" position="relative" zIndex={1}>
        <Card 
          bg={bg}
          borderColor={borderColor}
          borderWidth={1}
          borderRadius="2xl"
          boxShadow="2xl"
          backdropFilter="blur(10px)"
        >
          <CardBody p={8}>
            <VStack spacing={6}>
              {/* Header */}
              <VStack spacing={4} textAlign="center">
                <HStack>
                  <Image 
                    src="/acpn-ota-zone-logo.svg" 
                    alt="ACPN OTA Zone" 
                    h={10}
                    fallback={<Box w={10} h={10} bg="blue.500" borderRadius="md" />}
                  />
                  <Heading size="lg" fontWeight="bold">ACPN OTA Zone</Heading>
                </HStack>
                <VStack spacing={2}>
                  <Heading size="xl">Welcome Back</Heading>
                  <Text color={textColor}>Sign in to your account to continue</Text>
                </VStack>
              </VStack>

              {/* Error Alert */}
              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <Box as="form" onSubmit={handleSubmit} w="full">
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Email Address</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      size="lg"
                      borderRadius="lg"
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <InputGroup size="lg">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        borderRadius="lg"
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                          onClick={() => setShowPassword(!showPassword)}
                          variant="ghost"
                          size="sm"
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <HStack justify="space-between" w="full">
                    <Link
                      as={RouterLink}
                      to="/forgot-password"
                      color="blue.500"
                      fontSize="sm"
                      _hover={{ color: 'blue.600', textDecoration: 'none' }}
                    >
                      Forgot Password?
                    </Link>
                  </HStack>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    borderRadius="lg"
                    isLoading={isLoading}
                    loadingText="Signing In..."
                    _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
                    transition="all 0.2s"
                  >
                    Sign In
                  </Button>
                </VStack>
              </Box>

              {/* Social Login */}
              <VStack spacing={4} w="full">
                <HStack w="full">
                  <Divider />
                  <Text fontSize="sm" color={textColor} whiteSpace="nowrap">
                    Or continue with
                  </Text>
                  <Divider />
                </HStack>

                <HStack spacing={4} w="full">
                  <Button
                    leftIcon={<FaGoogle />}
                    variant="outline"
                    size="lg"
                    flex={1}
                    borderRadius="lg"
                    _hover={{ bg: 'red.50', borderColor: 'red.300' }}
                  >
                    Google
                  </Button>
                  <Button
                    leftIcon={<FaFacebook />}
                    variant="outline"
                    size="lg"
                    flex={1}
                    borderRadius="lg"
                    _hover={{ bg: 'blue.50', borderColor: 'blue.300' }}
                  >
                    Facebook
                  </Button>
                </HStack>
              </VStack>

              {/* Register Link */}
              <VStack spacing={2}>
                <Text color={textColor} textAlign="center">
                  Don't have an account?{' '}
                  <Link
                    as={RouterLink}
                    to="/register"
                    color="blue.500"
                    fontWeight="semibold"
                    _hover={{ color: 'blue.600', textDecoration: 'none' }}
                  >
                    Create Account
                  </Link>
                </Text>
                <Link
                  as={RouterLink}
                  to="/landing"
                  color={textColor}
                  fontSize="sm"
                  _hover={{ color: 'blue.500' }}
                >
                  ← Back to Home
                </Link>
              </VStack>
            </VStack>
          </CardBody>
        </Card>      </Container>

      {/* Theme Toggle */}
      <Box position="fixed" top={4} right={4} zIndex={10}>
        <ThemeToggle />
      </Box>
    </Box>
  );
};

export default Login;
