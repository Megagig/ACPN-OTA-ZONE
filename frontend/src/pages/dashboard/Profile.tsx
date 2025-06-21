import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  VStack,
  HStack,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  SimpleGrid,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Center,
  Badge,
  Icon,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { EditIcon, LockIcon } from '@chakra-ui/icons';
import api from '../../services/api';
import authService from '../../services/auth.service';
import type { User } from '../../types/auth.types';

const Profile = () => {
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state for personal information
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    pcnLicense: '',
  });

  // Form state for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.data);
          setPersonalInfo({
            firstName: response.data.data.firstName || '',
            lastName: response.data.data.lastName || '',
            email: response.data.data.email || '',
            phone: response.data.data.phone || '',
            pcnLicense: response.data.data.pcnLicense || '',
          });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle input change for personal information
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle input change for password fields
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission for personal information update
  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await api.put('/auth/update-details', {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        phone: personalInfo.phone,
        pcnLicense: personalInfo.pcnLicense,
      });

      if (response.data.success) {
        const updatedUser = response.data.data;
        setUser(updatedUser);
        setIsEditing(false);

        // Update user info in localStorage
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          const updatedUserForStorage = { ...currentUser, ...updatedUser };
          localStorage.setItem('user', JSON.stringify(updatedUserForStorage));
        }

        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
      }
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      const errorMessage: string =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data &&
        typeof err.response.data.message === 'string'
          ? err.response.data.message
          : 'Failed to update profile. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission for password change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password matching
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.put('/auth/update-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data.success) {
        // Reset form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        toast({
          title: 'Success',
          description: 'Password updated successfully',
        });
      }
    } catch (err: unknown) {
      console.error('Error updating password:', err);
      const errorMessage: string =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data &&
        typeof err.response.data.message === 'string'
          ? err.response.data.message
          : 'Failed to update password. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  // Loading state
  if (loading && !user) {
    return (
      <Center minH="50vh">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Center>
    );
  }

  // Error state
  if (error) {
    return (
      <Center minH="50vh">
        <VStack spacing={4}>
          <Alert status="error" borderRadius="lg" maxW="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Error Loading Profile</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
          <Button 
            onClick={() => window.location.reload()}
            colorScheme="brand"
            variant="outline"
          >
            Try Again
          </Button>
        </VStack>
      </Center>
    );
  }
  return (
    <Container maxW="4xl" py={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>My Profile</Heading>
          <Text color="gray.500">
            Manage your personal information and account settings
          </Text>
        </Box>

        {/* Personal Information Section */}
        <Card bg={cardBg} shadow="lg">
          <CardHeader>
            <HStack justify="space-between" align="flex-start">
              <VStack align="start" spacing={1}>
                <Heading size="md">Personal Information</Heading>
                <Text color="gray.500" fontSize="sm">
                  Your personal details and contact information
                </Text>
              </VStack>
              {!isEditing && (
                <Button
                  leftIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                >
                  Edit
                </Button>
              )}
            </HStack>
          </CardHeader>        {!isEditing ? (
          <CardBody>
            <SimpleGrid columns={1} spacing={4}>
              <HStack justify="space-between" align="center" py={3}>
                <Text fontWeight="medium" color="gray.600">Full name</Text>
                <Text>{user?.firstName} {user?.lastName}</Text>
              </HStack>
              <Divider />
              
              <HStack justify="space-between" align="center" py={3}>
                <Text fontWeight="medium" color="gray.600">Email address</Text>
                <Text>{user?.email}</Text>
              </HStack>
              <Divider />
              
              <HStack justify="space-between" align="center" py={3}>
                <Text fontWeight="medium" color="gray.600">Phone number</Text>
                <Text>{user?.phone || 'Not set'}</Text>
              </HStack>
              <Divider />
              
              <HStack justify="space-between" align="center" py={3}>
                <Text fontWeight="medium" color="gray.600">PCN License Number</Text>
                <Text>{user?.pcnLicense || 'Not set'}</Text>
              </HStack>
              <Divider />
              
              <HStack justify="space-between" align="center" py={3}>
                <Text fontWeight="medium" color="gray.600">Role</Text>
                <Badge colorScheme="blue" variant="subtle" textTransform="capitalize">
                  {user?.role || 'Member'}
                </Badge>
              </HStack>
              <Divider />
              
              <HStack justify="space-between" align="center" py={3}>
                <Text fontWeight="medium" color="gray.600">Member since</Text>
                <Text>
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Unknown'}
                </Text>
              </HStack>
            </SimpleGrid>
          </CardBody>        ) : (
          <CardBody>
            <Box as="form" onSubmit={handlePersonalInfoSubmit}>
              <VStack spacing={6} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>First name</FormLabel>
                    <Input
                      name="firstName"
                      value={personalInfo.firstName}
                      onChange={handlePersonalInfoChange}
                      placeholder="Enter your first name"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Last name</FormLabel>
                    <Input
                      name="lastName"
                      value={personalInfo.lastName}
                      onChange={handlePersonalInfoChange}
                      placeholder="Enter your last name"
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Email address</FormLabel>
                  <Input
                    type="email"
                    name="email"
                    value={personalInfo.email}
                    isDisabled
                    bg="gray.50"
                  />
                  <FormHelperText>Email cannot be changed</FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>Phone number</FormLabel>
                  <Input
                    name="phone"
                    value={personalInfo.phone}
                    onChange={handlePersonalInfoChange}
                    placeholder="Enter your phone number"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>PCN License Number</FormLabel>
                  <Input
                    name="pcnLicense"
                    value={personalInfo.pcnLicense}
                    onChange={handlePersonalInfoChange}
                    placeholder="Enter your PCN license number"
                  />
                </FormControl>

                <HStack justify="flex-end" spacing={3}>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={loading}
                    loadingText="Saving..."
                  >
                    Save Changes
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </CardBody>        )}
        </Card>

        {/* Change Password Section */}
        <Card bg={cardBg} shadow="lg">
          <CardHeader>
            <VStack align="start" spacing={1}>
              <HStack>
                <Icon as={LockIcon} color="gray.500" />
                <Heading size="md">Change Password</Heading>
              </HStack>
              <Text color="gray.500" fontSize="sm">
                Update your account password
              </Text>
            </VStack>
          </CardHeader>
          
          <CardBody>
            <Box as="form" onSubmit={handlePasswordSubmit}>
              <VStack spacing={6} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Current Password</FormLabel>
                  <Input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>New Password</FormLabel>
                  <Input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your new password"
                    minLength={6}
                  />
                  <FormHelperText>Password must be at least 6 characters long</FormHelperText>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Confirm New Password</FormLabel>
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm your new password"
                    minLength={6}
                  />
                </FormControl>

                <HStack justify="flex-end">
                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={loading}
                    loadingText="Updating..."
                  >
                    Update Password
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default Profile;
