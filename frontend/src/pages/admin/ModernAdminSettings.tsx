import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Button,
  Icon,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Input,
  Select,
  Textarea,
  Switch,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Grid,
} from '@chakra-ui/react';
import {
  FiSettings,
  FiSave,
  FiRefreshCw,
  FiUsers,
  FiDollarSign,
  FiBell,
  FiShield,
  FiServer,
  FiUpload,
  FiDownload,
  FiTrash2,
  FiFileText,
} from 'react-icons/fi';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

interface SystemSetting {
  id: string;
  category: string;
  name: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
  options?: string[];
  description: string;
  required: boolean;
}

const ModernAdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const toast = useToast();

  // Theme colors
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');

  // Mock settings data
  const mockSettings: SystemSetting[] = [
    // General Settings
    {
      id: '1',
      category: 'general',
      name: 'Organization Name',
      value: 'Association of Community Pharmacists of Nigeria (ACPN) - Ota Zone',
      type: 'text',
      description: 'The official name of the organization',
      required: true,
    },
    {
      id: '2',
      category: 'general',
      name: 'Organization Address',
      value: 'Ota, Ogun State, Nigeria',
      type: 'textarea',
      description: 'The physical address of the organization',
      required: true,
    },
    {
      id: '3',
      category: 'general',
      name: 'Contact Email',
      value: 'admin@acpn-ota.org',
      type: 'text',
      description: 'Primary contact email address',
      required: true,
    },
    {
      id: '4',
      category: 'general',
      name: 'Contact Phone',
      value: '+234-XXX-XXX-XXXX',
      type: 'text',
      description: 'Primary contact phone number',
      required: true,
    },

    // Membership Settings
    {
      id: '5',
      category: 'membership',
      name: 'Auto-approve Registrations',
      value: false,
      type: 'boolean',
      description: 'Automatically approve new member registrations',
      required: false,
    },
    {
      id: '6',
      category: 'membership',
      name: 'Membership Fee (Annual)',
      value: 50000,
      type: 'number',
      description: 'Annual membership fee in Naira',
      required: true,
    },
    {
      id: '7',
      category: 'membership',
      name: 'Grace Period (Days)',
      value: 30,
      type: 'number',
      description: 'Grace period for late payments in days',
      required: true,
    },
    {
      id: '8',
      category: 'membership',
      name: 'Member Status Check',
      value: 'weekly',
      type: 'select',
      options: ['daily', 'weekly', 'monthly'],
      description: 'How often to check member status for dues',
      required: true,
    },

    // Financial Settings
    {
      id: '9',
      category: 'financial',
      name: 'Currency',
      value: 'NGN',
      type: 'select',
      options: ['NGN', 'USD', 'EUR', 'GBP'],
      description: 'Default currency for financial transactions',
      required: true,
    },
    {
      id: '10',
      category: 'financial',
      name: 'Late Payment Penalty (%)',
      value: 10,
      type: 'number',
      description: 'Percentage penalty for late payments',
      required: true,
    },
    {
      id: '11',
      category: 'financial',
      name: 'Payment Confirmation Required',
      value: true,
      type: 'boolean',
      description: 'Require admin confirmation for payments',
      required: false,
    },

    // Notification Settings
    {
      id: '12',
      category: 'notifications',
      name: 'Email Notifications',
      value: true,
      type: 'boolean',
      description: 'Enable email notifications',
      required: false,
    },
    {
      id: '13',
      category: 'notifications',
      name: 'SMS Notifications',
      value: false,
      type: 'boolean',
      description: 'Enable SMS notifications',
      required: false,
    },
    {
      id: '14',
      category: 'notifications',
      name: 'Reminder Frequency',
      value: 'weekly',
      type: 'select',
      options: ['daily', 'weekly', 'monthly'],
      description: 'How often to send payment reminders',
      required: true,
    },

    // Security Settings
    {
      id: '15',
      category: 'security',
      name: 'Password Minimum Length',
      value: 8,
      type: 'number',
      description: 'Minimum required password length',
      required: true,
    },
    {
      id: '16',
      category: 'security',
      name: 'Session Timeout (Minutes)',
      value: 60,
      type: 'number',
      description: 'User session timeout in minutes',
      required: true,
    },
    {
      id: '17',
      category: 'security',
      name: 'Two-Factor Authentication',
      value: false,
      type: 'boolean',
      description: 'Require two-factor authentication for admins',
      required: false,
    },

    // System Settings
    {
      id: '18',
      category: 'system',
      name: 'Maintenance Mode',
      value: false,
      type: 'boolean',
      description: 'Enable maintenance mode',
      required: false,
    },
    {
      id: '19',
      category: 'system',
      name: 'Max Upload Size (MB)',
      value: 10,
      type: 'number',
      description: 'Maximum file upload size in MB',
      required: true,
    },
    {
      id: '20',
      category: 'system',
      name: 'Backup Frequency',
      value: 'daily',
      type: 'select',
      options: ['hourly', 'daily', 'weekly', 'monthly'],
      description: 'How often to backup system data',
      required: true,
    },
  ];

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSettings(mockSettings);
      setLoading(false);
    }, 1000);
  };

  const handleSettingChange = (settingId: string, value: any) => {
    setSettings(prev => prev.map(setting => 
      setting.id === settingId ? { ...setting, value } : setting
    ));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      toast({
        title: 'Settings saved',
        description: 'Your changes have been saved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }, 2000);
  };

  const renderSettingField = (setting: SystemSetting) => {
    switch (setting.type) {
      case 'text':
        return (
          <Input
            value={setting.value as string}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            placeholder={`Enter ${setting.name.toLowerCase()}`}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={setting.value as string}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            placeholder={`Enter ${setting.name.toLowerCase()}`}
            rows={3}
          />
        );
      
      case 'number':
        return (          <NumberInput
            value={setting.value as number}
            onChange={(_, valueNumber) => 
              handleSettingChange(setting.id, valueNumber)
            }
            min={0}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        );
      
      case 'boolean':
        return (
          <Switch
            isChecked={setting.value as boolean}
            onChange={(e) => handleSettingChange(setting.id, e.target.checked)}
            size="lg"
          />
        );
      
      case 'select':
        return (
          <Select
            value={setting.value as string}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
          >
            {setting.options?.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </Select>
        );
      
      default:
        return null;
    }
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(setting => setting.category === category);
  };

  const categories = [
    { id: 'general', name: 'General', icon: FiSettings },
    { id: 'membership', name: 'Membership', icon: FiUsers },
    { id: 'financial', name: 'Financial', icon: FiDollarSign },
    { id: 'notifications', name: 'Notifications', icon: FiBell },
    { id: 'security', name: 'Security', icon: FiShield },
    { id: 'system', name: 'System', icon: FiServer },
  ];

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      p={8}
    >
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <VStack align="start" spacing={2}>
          <Heading size="lg" color={headingColor}>
            System Settings
          </Heading>
          <Text color={textColor}>
            Configure system preferences and organization settings
          </Text>
        </VStack>
        <HStack>
          <Button
            leftIcon={<Icon as={FiRefreshCw} />}
            variant="outline"
            onClick={fetchSettings}
            isLoading={loading}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<Icon as={FiSave} />}
            colorScheme="brand"
            onClick={handleSaveSettings}
            isLoading={saving}
          >
            Save Changes
          </Button>
        </HStack>
      </Flex>

      {/* Settings Tabs */}
      <Card bg={bg} border="1px" borderColor={borderColor}>
        <CardBody p={0}>
          <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
            <TabList borderBottom="1px" borderColor={borderColor}>
              {categories.map((category) => (
                <Tab key={category.id} py={4} px={6}>
                  <HStack>
                    <Icon as={category.icon} />
                    <Text>{category.name}</Text>
                  </HStack>
                </Tab>
              ))}
            </TabList>

            <TabPanels>
              {categories.map((category) => (
                <TabPanel key={category.id} p={8}>
                  {loading ? (
                    <Flex justify="center" align="center" h="200px">
                      <Spinner size="xl" color="brand.500" />
                    </Flex>
                  ) : (
                    <VStack spacing={6} align="stretch">
                      <Heading size="md" color={headingColor} mb={4}>
                        {category.name} Settings
                      </Heading>
                      
                      {getSettingsByCategory(category.id).map((setting) => (
                        <MotionCard
                          key={setting.id}
                          bg={bg}
                          border="1px"
                          borderColor={borderColor}
                          whileHover={{ y: -1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CardBody>
                            <Grid templateColumns="1fr 300px" gap={6} alignItems="center">
                              <VStack align="start" spacing={2}>
                                <HStack>
                                  <Text fontWeight="600" color={headingColor}>
                                    {setting.name}
                                  </Text>
                                  {setting.required && (
                                    <Badge colorScheme="red" size="sm">
                                      Required
                                    </Badge>
                                  )}
                                </HStack>
                                <Text fontSize="sm" color={textColor}>
                                  {setting.description}
                                </Text>
                              </VStack>
                              <Box>
                                {renderSettingField(setting)}
                              </Box>
                            </Grid>
                          </CardBody>
                        </MotionCard>
                      ))}

                      {category.id === 'system' && (
                        <Alert status="warning" borderRadius="md">
                          <AlertIcon />
                          <VStack align="start" spacing={1}>
                            <AlertTitle>System Settings Warning!</AlertTitle>
                            <AlertDescription>
                              Changing system settings may affect application performance. 
                              Please consult with your system administrator before making changes.
                            </AlertDescription>
                          </VStack>
                        </Alert>
                      )}

                      {category.id === 'security' && (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <VStack align="start" spacing={1}>
                            <AlertTitle>Security Best Practices</AlertTitle>
                            <AlertDescription>
                              Enable two-factor authentication and use strong passwords to 
                              maintain system security.
                            </AlertDescription>
                          </VStack>
                        </Alert>
                      )}
                    </VStack>
                  )}
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>

      {/* System Information */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6} mt={8}>
        <MotionCard
          bg={bg}
          border="1px"
          borderColor={borderColor}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <CardHeader>
            <Heading size="md" color={headingColor}>
              System Information
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Flex justify="space-between">
                <Text color={textColor}>Application Version</Text>
                <Text fontWeight="600">v2.1.0</Text>
              </Flex>
              <Flex justify="space-between">
                <Text color={textColor}>Database Version</Text>
                <Text fontWeight="600">PostgreSQL 14.2</Text>
              </Flex>
              <Flex justify="space-between">
                <Text color={textColor}>Last Backup</Text>
                <Text fontWeight="600">2 hours ago</Text>
              </Flex>
              <Flex justify="space-between">
                <Text color={textColor}>Uptime</Text>
                <Text fontWeight="600">15 days, 8 hours</Text>
              </Flex>
              <Flex justify="space-between">
                <Text color={textColor}>Active Users</Text>
                <Text fontWeight="600">127</Text>
              </Flex>
            </VStack>
          </CardBody>
        </MotionCard>

        <MotionCard
          bg={bg}
          border="1px"
          borderColor={borderColor}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <CardHeader>
            <Heading size="md" color={headingColor}>
              Quick Actions
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <Button
                leftIcon={<Icon as={FiDownload} />}
                variant="outline"
                justifyContent="flex-start"
              >
                Download System Backup
              </Button>
              <Button
                leftIcon={<Icon as={FiUpload} />}
                variant="outline"
                justifyContent="flex-start"
              >
                Import Settings
              </Button>
              <Button
                leftIcon={<Icon as={FiFileText} />}
                variant="outline"
                justifyContent="flex-start"
              >
                View System Logs
              </Button>
              <Button
                leftIcon={<Icon as={FiRefreshCw} />}
                variant="outline"
                justifyContent="flex-start"
              >
                Clear Application Cache
              </Button>
              <Divider />
              <Button
                leftIcon={<Icon as={FiTrash2} />}
                variant="outline"
                colorScheme="red"
                justifyContent="flex-start"
              >
                Reset to Default Settings
              </Button>
            </VStack>
          </CardBody>
        </MotionCard>
      </Grid>
    </MotionBox>
  );
};

export default ModernAdminSettings;
