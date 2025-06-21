import React, { useState, useEffect } from 'react';
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
  Badge,
  Icon,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { EditIcon, LockIcon } from '@chakra-ui/icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const UserProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    pcnLicense: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        pcnLicense: user.pcnLicense || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        pcnLicense: formData.pcnLicense,
      };
      const response = await api.put('/auth/update-details', profileData);
      updateUser(response.data.user);
      
      toast({
        title: 'Success',
        description: response.data.message || 'Profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setIsEditing(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const passwordData = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      };
      const response = await api.put('/auth/change-password', passwordData);
      
      toast({
        title: 'Success',
        description: response.data.message || 'Password changed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to change password',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          </CardHeader>

          {!isEditing ? (
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
            </CardBody>
          ) : (
            <CardBody>
              <Box as="form" onSubmit={handleProfileUpdate}>
                <VStack spacing={6} align="stretch">
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>First name</FormLabel>
                      <Input
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Enter your first name"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Last name</FormLabel>
                      <Input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Enter your last name"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel>Email address</FormLabel>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      isDisabled
                      bg="gray.50"
                    />
                    <FormHelperText>Email cannot be changed</FormHelperText>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Phone number</FormLabel>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>PCN License Number</FormLabel>
                    <Input
                      name="pcnLicense"
                      value={formData.pcnLicense}
                      onChange={handleChange}
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
                      isLoading={isLoading}
                      loadingText="Saving..."
                    >
                      Save Changes
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </CardBody>
          )}
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
            <Box as="form" onSubmit={handlePasswordChange}>
              <VStack spacing={6} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Current Password</FormLabel>
                  <Input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter your current password"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>New Password</FormLabel>
                  <Input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
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
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your new password"
                    minLength={6}
                  />
                </FormControl>

                <HStack justify="flex-end">
                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={isLoading}
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

export default UserProfile;
