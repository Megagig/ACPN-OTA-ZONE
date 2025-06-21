import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Avatar,  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import {
  FiEdit2,
  FiSave,
  FiX,
  FiEye,
  FiEyeOff,
  FiLock,
  FiCamera,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MotionBox = motion(Box);

const ModernProfile: React.FC = () => {
  const { user: authUser, updateUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Color mode values
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');

  // Modal control
  const { isOpen: isPasswordModalOpen, onOpen: onPasswordModalOpen, onClose: onPasswordModalClose } = useDisclosure();

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
          const userData = response.data.data;
          setPersonalInfo({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            phone: userData.phone || '',
            pcnLicense: userData.pcnLicense || '',
          });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [toast]);

  // Handle personal info update
  const handlePersonalInfoUpdate = async () => {
    try {
      setSaving(true);
      const response = await api.put('/auth/profile', personalInfo);
      
      if (response.data.success) {
        setIsEditing(false);
        updateUser(response.data.data);
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSaving(true);
      const response = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        onPasswordModalClose();
        toast({
          title: 'Success',
          description: 'Password changed successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to change password',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original values
    if (authUser) {
      setPersonalInfo({
        firstName: authUser.firstName || '',
        lastName: authUser.lastName || '',
        email: authUser.email || '',
        phone: authUser.phone || '',
        pcnLicense: authUser.pcnLicense || '',
      });
    }
  };

  if (loading) {
    return (
      <Box bg={bg} minH="100vh" p={6}>
        <VStack spacing={4} align="center" justify="center" minH="400px">
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text color={textColor}>Loading profile...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box bg={bg} minH="100vh" p={6}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box bg={bg} minH="100vh" p={6}>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        maxW="4xl"
        mx="auto"
      >
        {/* Header */}
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" color={headingColor} mb={2}>
              My Profile
            </Heading>
            <Text color={textColor}>
              Manage your personal information and account settings
            </Text>
          </Box>

          {/* Profile Overview Card */}
          <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
            <CardBody>
              <HStack spacing={6} align="start">
                <VStack spacing={4}>
                  <Avatar
                    size="xl"
                    name={`${personalInfo.firstName} ${personalInfo.lastName}`}
                    src={authUser?.profilePicture}
                    bg="brand.500"
                  />
                  <Button
                    leftIcon={<FiCamera />}
                    size="sm"
                    variant="outline"
                    colorScheme="brand"
                    isDisabled
                  >
                    Change Photo
                  </Button>
                </VStack>

                <VStack align="start" spacing={2} flex={1}>
                  <HStack>
                    <Heading size="md" color={headingColor}>
                      {personalInfo.firstName} {personalInfo.lastName}
                    </Heading>
                    <Badge
                      colorScheme="brand"
                      variant="subtle"
                      textTransform="capitalize"
                    >
                      {authUser?.role || 'Member'}
                    </Badge>
                  </HStack>
                  <Text color={textColor}>{personalInfo.email}</Text>
                  <Text color={textColor} fontSize="sm">
                    PCN License: {personalInfo.pcnLicense || 'Not provided'}
                  </Text>
                  {authUser?.createdAt && (
                    <Text color={textColor} fontSize="sm">
                      Member since: {new Date(authUser.createdAt).toLocaleDateString()}
                    </Text>
                  )}
                </VStack>

                <VStack spacing={2}>
                  <Button
                    leftIcon={isEditing ? <FiX /> : <FiEdit2 />}
                    colorScheme={isEditing ? "gray" : "brand"}
                    variant={isEditing ? "outline" : "solid"}
                    onClick={isEditing ? handleCancel : () => setIsEditing(true)}
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                  <Button
                    leftIcon={<FiLock />}
                    variant="outline"
                    colorScheme="gray"
                    onClick={onPasswordModalOpen}
                  >
                    Change Password
                  </Button>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          {/* Tabs Section */}
          <Tabs colorScheme="brand" variant="line">
            <TabList>
              <Tab>Personal Information</Tab>
              <Tab>Account Stats</Tab>
              <Tab>Activity</Tab>
            </TabList>

            <TabPanels>
              {/* Personal Information Tab */}
              <TabPanel px={0}>
                <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md" color={headingColor}>
                      Personal Information
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel color={textColor}>First Name</FormLabel>
                        <Input
                          value={personalInfo.firstName}
                          onChange={(e) =>
                            setPersonalInfo({
                              ...personalInfo,
                              firstName: e.target.value,
                            })
                          }
                          isDisabled={!isEditing}
                          bg={cardBg}
                          borderColor={borderColor}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel color={textColor}>Last Name</FormLabel>
                        <Input
                          value={personalInfo.lastName}
                          onChange={(e) =>
                            setPersonalInfo({
                              ...personalInfo,
                              lastName: e.target.value,
                            })
                          }
                          isDisabled={!isEditing}
                          bg={cardBg}
                          borderColor={borderColor}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel color={textColor}>Email Address</FormLabel>
                        <Input
                          type="email"
                          value={personalInfo.email}
                          onChange={(e) =>
                            setPersonalInfo({
                              ...personalInfo,
                              email: e.target.value,
                            })
                          }
                          isDisabled={!isEditing}
                          bg={cardBg}
                          borderColor={borderColor}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel color={textColor}>Phone Number</FormLabel>
                        <Input
                          value={personalInfo.phone}
                          onChange={(e) =>
                            setPersonalInfo({
                              ...personalInfo,
                              phone: e.target.value,
                            })
                          }
                          isDisabled={!isEditing}
                          bg={cardBg}
                          borderColor={borderColor}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel color={textColor}>PCN License Number</FormLabel>
                        <Input
                          value={personalInfo.pcnLicense}
                          onChange={(e) =>
                            setPersonalInfo({
                              ...personalInfo,
                              pcnLicense: e.target.value,
                            })
                          }
                          isDisabled={!isEditing}
                          bg={cardBg}
                          borderColor={borderColor}
                        />
                      </FormControl>
                    </SimpleGrid>

                    {isEditing && (
                      <HStack spacing={4} mt={6} justify="flex-end">
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                        >
                          Cancel
                        </Button>
                        <Button
                          leftIcon={<FiSave />}
                          colorScheme="brand"
                          onClick={handlePersonalInfoUpdate}
                          isLoading={saving}
                          loadingText="Saving..."
                        >
                          Save Changes
                        </Button>
                      </HStack>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>

              {/* Account Stats Tab */}
              <TabPanel px={0}>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                  <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                    <CardBody>
                      <Stat>
                        <StatLabel color={textColor}>Account Status</StatLabel>
                        <StatNumber color="green.500">Active</StatNumber>
                        <StatHelpText>Since registration</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                    <CardBody>
                      <Stat>
                        <StatLabel color={textColor}>Role</StatLabel>
                        <StatNumber textTransform="capitalize">
                          {authUser?.role || 'Member'}
                        </StatNumber>
                        <StatHelpText>Current access level</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                    <CardBody>
                      <Stat>
                        <StatLabel color={textColor}>Profile Completion</StatLabel>
                        <StatNumber>
                          {Math.round(
                            ((personalInfo.firstName ? 1 : 0) +
                              (personalInfo.lastName ? 1 : 0) +
                              (personalInfo.email ? 1 : 0) +
                              (personalInfo.phone ? 1 : 0) +
                              (personalInfo.pcnLicense ? 1 : 0)) /
                              5 *
                              100
                          )}%
                        </StatNumber>
                        <Progress
                          value={Math.round(
                            ((personalInfo.firstName ? 1 : 0) +
                              (personalInfo.lastName ? 1 : 0) +
                              (personalInfo.email ? 1 : 0) +
                              (personalInfo.phone ? 1 : 0) +
                              (personalInfo.pcnLicense ? 1 : 0)) /
                              5 *
                              100
                          )}
                          colorScheme="brand"
                          size="sm"
                          mt={2}
                        />
                      </Stat>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </TabPanel>

              {/* Activity Tab */}
              <TabPanel px={0}>
                <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                  <CardBody>
                    <VStack spacing={4} align="start">
                      <Heading size="md" color={headingColor}>
                        Recent Activity
                      </Heading>
                      <Text color={textColor}>
                        Activity tracking is not yet implemented. This section will show your recent
                        actions, login history, and profile changes.
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>

        {/* Password Change Modal */}
        <Modal isOpen={isPasswordModalOpen} onClose={onPasswordModalClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Change Password</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Current Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                        icon={showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                        variant="ghost"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <FormLabel>New Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        icon={showNewPassword ? <FiEyeOff /> : <FiEye />}
                        variant="ghost"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <FormLabel>Confirm New Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                        variant="ghost"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onPasswordModalClose}>
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                onClick={handlePasswordChange}
                isLoading={saving}
                loadingText="Changing..."
              >
                Change Password
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </MotionBox>
    </Box>
  );
};

export default ModernProfile;
