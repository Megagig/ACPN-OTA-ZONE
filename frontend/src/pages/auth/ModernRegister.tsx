import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  useColorModeValue,
  Image,
  useToast,
  List,
  ListItem,
  ListIcon,
  Progress,
  Badge,
} from '@chakra-ui/react';
import { FaCheck, FaTimes, FaUser, FaEnvelope, FaPhone, FaLock, FaIdCard } from 'react-icons/fa';
import { MdSecurity, MdEmail, MdPerson } from 'react-icons/md';

import ThemeToggle from '../../components/ui/ThemeToggle';
import authService from '../../services/auth.service';
import {
  ModernFormContainer,
  ModernFormSection,
  ModernFormGrid,
  ModernMultiStepForm,
  ModernStepNavigation,
} from '../../components/forms/ModernFormLayout';
import {
  ModernTextField,
  ModernSelectField,
} from '../../components/forms/ModernFormFields';

// Form steps configuration
const FORM_STEPS = [
  {
    title: 'Personal Info',
    description: 'Basic information',
    icon: <MdPerson />,
  },
  {
    title: 'Contact',
    description: 'Contact details',
    icon: <MdEmail />,
  },
  {
    title: 'Security',
    description: 'Password & verification',
    icon: <MdSecurity />,
  },
];

// Nigerian states for PCN license
const NIGERIAN_STATES = [
  { value: '', label: 'Select State' },
  { value: 'AB', label: 'Abia' },
  { value: 'AD', label: 'Adamawa' },
  { value: 'AK', label: 'Akwa Ibom' },
  { value: 'AN', label: 'Anambra' },
  { value: 'BA', label: 'Bauchi' },
  { value: 'BY', label: 'Bayelsa' },
  { value: 'BE', label: 'Benue' },
  { value: 'BO', label: 'Borno' },
  { value: 'CR', label: 'Cross River' },
  { value: 'DE', label: 'Delta' },
  { value: 'EB', label: 'Ebonyi' },
  { value: 'ED', label: 'Edo' },
  { value: 'EK', label: 'Ekiti' },
  { value: 'EN', label: 'Enugu' },
  { value: 'FC', label: 'Federal Capital Territory' },
  { value: 'GO', label: 'Gombe' },
  { value: 'IM', label: 'Imo' },
  { value: 'JI', label: 'Jigawa' },
  { value: 'KD', label: 'Kaduna' },
  { value: 'KN', label: 'Kano' },
  { value: 'KT', label: 'Katsina' },
  { value: 'KE', label: 'Kebbi' },
  { value: 'KO', label: 'Kogi' },
  { value: 'KW', label: 'Kwara' },
  { value: 'LA', label: 'Lagos' },
  { value: 'NA', label: 'Nasarawa' },
  { value: 'NI', label: 'Niger' },
  { value: 'OG', label: 'Ogun' },
  { value: 'ON', label: 'Ondo' },
  { value: 'OS', label: 'Osun' },
  { value: 'OY', label: 'Oyo' },
  { value: 'PL', label: 'Plateau' },
  { value: 'RI', label: 'Rivers' },
  { value: 'SO', label: 'Sokoto' },
  { value: 'TA', label: 'Taraba' },
  { value: 'YO', label: 'Yobe' },
  { value: 'ZA', label: 'Zamfara' },
];

const ModernRegister: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pcnLicense: '',
    pcnState: '',
  });

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({
    score: 0,
    feedback: [],
  });

  // Color mode values
  const bg = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.600', 'gray.200');

  // Form validation
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 0: // Personal Info
        if (!formData.firstName.trim()) errors.firstName = 'First name is required';
        if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
        break;
      
      case 1: // Contact
        if (!formData.email.trim()) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Please enter a valid email address';
        }
        
        if (!formData.phone.trim()) {
          errors.phone = 'Phone number is required';
        } else if (!/^(\+234|0)[7-9][0-1][0-9]{8}$/.test(formData.phone.replace(/\s+/g, ''))) {
          errors.phone = 'Please enter a valid Nigerian phone number';
        }
        
        if (!formData.pcnLicense.trim()) {
          errors.pcnLicense = 'PCN License number is required';
        } else if (!/^PCN\/\d{4}\/\d{4,6}$/.test(formData.pcnLicense)) {
          errors.pcnLicense = 'Invalid PCN License format (e.g., PCN/2020/12345)';
        }
        
        if (!formData.pcnState) {
          errors.pcnState = 'Please select your PCN registration state';
        }
        break;
      
      case 2: // Security
        if (!formData.password) {
          errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
          errors.password = 'Password must be at least 8 characters long';
        }
        
        if (!formData.confirmPassword) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
        break;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Lowercase letter');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Uppercase letter');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Number');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Special character');

    setPasswordStrength({ score, feedback });
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Calculate password strength
    if (field === 'password') {
      calculatePasswordStrength(value);
    }
  };

  // Step navigation
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Form submission
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    setError(null);

    try {
      await authService.register(formData);
      
      toast({
        title: 'Registration Successful!',
        description: 'Please check your email to verify your account.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      navigate('/login', { 
        state: { message: 'Registration successful! Please verify your email and login.' }
      });
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
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'red';
    if (passwordStrength.score <= 3) return 'yellow';
    return 'green';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Medium';
    return 'Strong';
  };

  return (
    <Box minH="100vh" bg={bg} py={8} px={4}>
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

      <Box position="relative" zIndex={1}>
        <ModernFormContainer
          title="Join ACPN OTA Zone"
          subtitle="Create your account to access exclusive member benefits"
          maxWidth="4xl"
        >
          {/* Header with Logo */}
          <VStack spacing={6} mb={8}>
            <HStack>
              <Image 
                src="/acpn-ota-zone-logo.svg" 
                alt="ACPN OTA Zone" 
                h={10}
                fallback={<Box w={10} h={10} bg="blue.500" borderRadius="md" />}
              />
              <Heading size="lg" fontWeight="bold">ACPN OTA Zone</Heading>
            </HStack>
          </VStack>

          {/* Error Alert */}
          {error && (
            <Alert status="error" borderRadius="md" mb={6}>
              <AlertIcon />
              {error}
            </Alert>
          )}

          {/* Multi-Step Form */}
          <ModernMultiStepForm
            steps={FORM_STEPS}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            isStepValid={validateStep}
            allowStepClick={false}
          >
            {/* Step 1: Personal Information */}
            {currentStep === 0 && (
              <ModernFormSection
                title="Personal Information"
                subtitle="Tell us about yourself"
              >
                <ModernFormGrid columns={{ base: 1, md: 2 }}>
                  <ModernTextField
                    label="First Name"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={(value) => handleInputChange('firstName', value)}
                    error={fieldErrors.firstName}
                    isRequired
                    leftIcon={<FaUser />}
                  />
                  
                  <ModernTextField
                    label="Last Name"
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={(value) => handleInputChange('lastName', value)}
                    error={fieldErrors.lastName}
                    isRequired
                    leftIcon={<FaUser />}
                  />
                </ModernFormGrid>
              </ModernFormSection>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 1 && (
              <ModernFormSection
                title="Contact & Professional Details"
                subtitle="How can we reach you and verify your credentials?"
              >
                <VStack spacing={6}>
                  <ModernFormGrid columns={{ base: 1, md: 2 }}>
                    <ModernTextField
                      label="Email Address"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(value) => handleInputChange('email', value)}
                      error={fieldErrors.email}
                      isRequired
                      leftIcon={<FaEnvelope />}
                    />
                    
                    <ModernTextField
                      label="Phone Number"
                      type="tel"
                      placeholder="+234 xxx xxx xxxx"
                      value={formData.phone}
                      onChange={(value) => handleInputChange('phone', value)}
                      error={fieldErrors.phone}
                      isRequired
                      leftIcon={<FaPhone />}
                      helperText="Nigerian phone number format"
                    />
                  </ModernFormGrid>

                  <ModernFormGrid columns={{ base: 1, md: 2 }}>
                    <ModernTextField
                      label="PCN License Number"
                      placeholder="PCN/YYYY/XXXXX"
                      value={formData.pcnLicense}
                      onChange={(value) => handleInputChange('pcnLicense', value)}
                      error={fieldErrors.pcnLicense}
                      isRequired
                      leftIcon={<FaIdCard />}
                      helperText="Format: PCN/2020/12345"
                      tooltip="Your Pharmacists Council of Nigeria license number"
                    />
                    
                    <ModernSelectField
                      label="PCN Registration State"
                      placeholder="Select your state"
                      value={formData.pcnState}
                      onChange={(value) => handleInputChange('pcnState', value)}
                      options={NIGERIAN_STATES}
                      error={fieldErrors.pcnState}
                      isRequired
                      tooltip="State where your PCN license was issued"
                    />
                  </ModernFormGrid>
                </VStack>
              </ModernFormSection>
            )}

            {/* Step 3: Security */}
            {currentStep === 2 && (
              <ModernFormSection
                title="Security & Password"
                subtitle="Secure your account with a strong password"
              >
                <VStack spacing={6}>
                  <ModernTextField
                    label="Password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(value) => handleInputChange('password', value)}
                    error={fieldErrors.password}
                    isRequired
                    leftIcon={<FaLock />}
                  />

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <Box w="full">
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" fontWeight="medium">
                          Password Strength
                        </Text>
                        <Badge 
                          colorScheme={getPasswordStrengthColor()}
                          variant="subtle"
                        >
                          {getPasswordStrengthText()}
                        </Badge>
                      </HStack>
                      
                      <Progress
                        value={(passwordStrength.score / 5) * 100}
                        colorScheme={getPasswordStrengthColor()}
                        size="sm"
                        borderRadius="full"
                      />
                      
                      {passwordStrength.feedback.length > 0 && (
                        <Box mt={3}>
                          <Text fontSize="sm" color={textColor} mb={2}>
                            Password should include:
                          </Text>
                          <List spacing={1}>
                            {passwordStrength.feedback.map((item, index) => (
                              <ListItem key={index} fontSize="sm" color={textColor}>
                                <ListIcon as={FaTimes} color="red.500" />
                                {item}
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </Box>
                  )}

                  <ModernTextField
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(value) => handleInputChange('confirmPassword', value)}
                    error={fieldErrors.confirmPassword}
                    isRequired
                    leftIcon={<FaLock />}
                  />

                  {/* Security Features */}
                  <Box 
                    w="full" 
                    p={4} 
                    bg={useColorModeValue('blue.50', 'blue.900')} 
                    borderRadius="lg"
                    border="1px"
                    borderColor={useColorModeValue('blue.200', 'blue.700')}
                  >
                    <Text fontSize="sm" fontWeight="semibold" mb={2}>
                      Your Account Security:
                    </Text>
                    <List spacing={1}>
                      <ListItem fontSize="sm" color={textColor}>
                        <ListIcon as={FaCheck} color="green.500" />
                        Email verification required
                      </ListItem>
                      <ListItem fontSize="sm" color={textColor}>
                        <ListIcon as={FaCheck} color="green.500" />
                        PCN license verification
                      </ListItem>
                      <ListItem fontSize="sm" color={textColor}>
                        <ListIcon as={FaCheck} color="green.500" />
                        Secure password encryption
                      </ListItem>
                    </List>
                  </Box>
                </VStack>
              </ModernFormSection>
            )}

            {/* Step Navigation */}
            <ModernStepNavigation
              currentStep={currentStep}
              totalSteps={FORM_STEPS.length}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSubmit={handleSubmit}
              isNextDisabled={!validateStep(currentStep)}
              isSubmitting={isLoading}
              submitText="Create Account"
            />
          </ModernMultiStepForm>

          {/* Footer Links */}
          <VStack spacing={4} mt={8} pt={6} borderTop="1px" borderColor={useColorModeValue('gray.200', 'gray.600')}>
            <Text color={textColor} textAlign="center">
              Already have an account?{' '}
              <Text 
                as={RouterLink} 
                to="/login" 
                color="blue.500" 
                fontWeight="semibold"
                _hover={{ color: 'blue.600', textDecoration: 'none' }}
              >
                Sign In
              </Text>
            </Text>
            <Text 
              as={RouterLink} 
              to="/landing" 
              color={textColor} 
              fontSize="sm"
              _hover={{ color: 'blue.500' }}
            >
              ← Back to Home
            </Text>
          </VStack>
        </ModernFormContainer>
      </Box>

      {/* Theme Toggle */}
      <Box position="fixed" top={4} right={4} zIndex={10}>
        <ThemeToggle />
      </Box>
    </Box>
  );
};

export default ModernRegister;
