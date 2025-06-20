import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  useColorModeValue,
  IconButton,
  Image,
  useToast,
  Card,
  CardBody,
  SimpleGrid,
  Progress,
  Badge,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';
import ThemeToggle from '../../components/ui/ThemeToggle';
import authService from '../../services/auth.service';

const Register: React.FC = () => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pcnLicense: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.200');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const getStrengthColor = (strength: number) => {
    if (strength < 50) return 'red';
    if (strength < 75) return 'yellow';
    return 'green';
  };

  const getStrengthText = (strength: number) => {
    if (strength < 25) return 'Very Weak';
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Medium';
    return 'Strong';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.register(formData);
      
      if (response.success) {
        setSuccess(true);
        toast({
          title: 'Registration Successful!',
          description: 'Please check your email to verify your account.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Registration Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box 
        minH="100vh" 
        bg={useColorModeValue('gray.50', 'gray.900')}
        py={12}
        px={4}
      >
        <Container maxW="md" position="relative" zIndex={1}>
          <Card 
            bg={bg}
            borderColor={borderColor}
            borderWidth={1}
            borderRadius="2xl"
            boxShadow="2xl"
          >
            <CardBody p={8}>
              <VStack spacing={6} textAlign="center">
                <Box 
                  w={16} 
                  h={16} 
                  bg="green.100" 
                  borderRadius="2xl" 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center"
                >
                  <FaCheck size={32} color="green" />
                </Box>
                <VStack spacing={2}>
                  <Heading size="xl">Registration Successful!</Heading>
                  <Text color={textColor}>
                    We've sent a verification email to your address. Please check your inbox 
                    and follow the instructions to complete your registration.
                  </Text>
                </VStack>
                <VStack spacing={4} w="full">
                  <Button
                    as={RouterLink}
                    to="/verify-email"
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    rightIcon={<FaCheck />}
                  >
                    Verify Email Now
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/login"
                    variant="outline"
                    size="lg"
                    w="full"
                  >
                    Back to Login
                  </Button>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </Container>
        <Box position="fixed" top={4} right={4} zIndex={10}>
          <ThemeToggle />
        </Box>
      </Box>
    );
  }

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

      <Container maxW="lg" position="relative" zIndex={1}>
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
                  <Heading size="xl">Join Our Community</Heading>
                  <Text color={textColor}>Create your account to get started</Text>
                </VStack>
              </VStack>

              {/* Error Alert */}
              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              {/* Registration Form */}
              <Box as="form" onSubmit={handleSubmit} w="full">
                <VStack spacing={4}>
                  {/* Personal Information */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                    <FormControl isRequired>
                      <FormLabel>First Name</FormLabel>
                      <Input
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Enter first name"
                        size="lg"
                        borderRadius="lg"
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Last Name</FormLabel>
                      <Input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Enter last name"
                        size="lg"
                        borderRadius="lg"
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      />
                    </FormControl>
                  </SimpleGrid>

                  {/* Contact Information */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                    <FormControl isRequired>
                      <FormLabel>Email Address</FormLabel>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                        size="lg"
                        borderRadius="lg"
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Phone Number</FormLabel>
                      <Input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        size="lg"
                        borderRadius="lg"
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      />
                    </FormControl>
                  </SimpleGrid>

                  {/* PCN License */}
                  <FormControl isRequired>
                    <FormLabel>PCN License Number</FormLabel>
                    <Input
                      name="pcnLicense"
                      value={formData.pcnLicense}
                      onChange={handleChange}
                      placeholder="Enter your PCN license number"
                      size="lg"
                      borderRadius="lg"
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                    />
                  </FormControl>

                  {/* Password */}
                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <InputGroup size="lg">
                      <Input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a password"
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
                    {formData.password && (
                      <VStack align="start" spacing={2} mt={2}>
                        <HStack>
                          <Text fontSize="sm">Password Strength:</Text>
                          <Badge colorScheme={getStrengthColor(passwordStrength)}>
                            {getStrengthText(passwordStrength)}
                          </Badge>
                        </HStack>
                        <Progress 
                          value={passwordStrength} 
                          colorScheme={getStrengthColor(passwordStrength)}
                          size="sm" 
                          w="full"
                        />
                      </VStack>
                    )}
                  </FormControl>

                  {/* Confirm Password */}
                  <FormControl isRequired>
                    <FormLabel>Confirm Password</FormLabel>
                    <InputGroup size="lg">
                      <Input
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        borderRadius="lg"
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          icon={showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          variant="ghost"
                          size="sm"
                        />
                      </InputRightElement>
                    </InputGroup>
                    {formData.confirmPassword && (
                      <HStack mt={2}>
                        {formData.password === formData.confirmPassword ? (
                          <>
                            <FaCheck color="green" />
                            <Text fontSize="sm" color="green.500">Passwords match</Text>
                          </>
                        ) : (
                          <>
                            <FaTimes color="red" />
                            <Text fontSize="sm" color="red.500">Passwords don't match</Text>
                          </>
                        )}
                      </HStack>
                    )}
                  </FormControl>

                  {/* Password Requirements */}
                  <Box w="full" p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg">
                    <Text fontSize="sm" fontWeight="semibold" mb={2}>Password Requirements:</Text>
                    <List spacing={1} fontSize="sm">
                      <ListItem>
                        <ListIcon as={formData.password.length >= 8 ? FaCheck : FaTimes} 
                          color={formData.password.length >= 8 ? 'green.500' : 'red.500'} />
                        At least 8 characters
                      </ListItem>
                      <ListItem>
                        <ListIcon as={/[a-z]/.test(formData.password) ? FaCheck : FaTimes} 
                          color={/[a-z]/.test(formData.password) ? 'green.500' : 'red.500'} />
                        One lowercase letter
                      </ListItem>
                      <ListItem>
                        <ListIcon as={/[A-Z]/.test(formData.password) ? FaCheck : FaTimes} 
                          color={/[A-Z]/.test(formData.password) ? 'green.500' : 'red.500'} />
                        One uppercase letter
                      </ListItem>
                      <ListItem>
                        <ListIcon as={/[0-9]/.test(formData.password) ? FaCheck : FaTimes} 
                          color={/[0-9]/.test(formData.password) ? 'green.500' : 'red.500'} />
                        One number
                      </ListItem>
                    </List>
                  </Box>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    borderRadius="lg"
                    isLoading={loading}
                    loadingText="Creating Account..."
                    _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
                    transition="all 0.2s"
                  >
                    Create Account
                  </Button>
                </VStack>
              </Box>

              {/* Login Link */}
              <VStack spacing={2}>
                <Text color={textColor} textAlign="center">
                  Already have an account?{' '}
                  <Link
                    as={RouterLink}
                    to="/login"
                    color="blue.500"
                    fontWeight="semibold"
                    _hover={{ color: 'blue.600', textDecoration: 'none' }}
                  >
                    Sign In
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
        </Card>
      </Container>

      {/* Theme Toggle */}
      <Box position="fixed" top={4} right={4} zIndex={10}>
        <ThemeToggle />
      </Box>
    </Box>
  );
};

export default Register;
