import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  SimpleGrid,
  GridItem,
  Heading,
  Text,
  VStack,
  Badge,
  Card,
  CardBody,
  CardHeader,
  useToast,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Checkbox,
  Alert,
  AlertIcon,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import type {
  DueType,
  Pharmacy as PharmacyType,
} from '../../types/pharmacy.types';
import financialService from '../../services/financial.service';
import DashboardLayout from '../../components/layout/DashboardLayout';

interface FormData {
  pharmacyId: string;
  dueTypeId: string;
  amount: number;
  dueDate: string;
  description: string;
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'annually';
}

interface Pharmacy {
  _id: string;
  name: string;
  registrationNumber: string;
  owner: {
    firstName: string;
    lastName: string;
  };
}

const DueAssignmentChakra: React.FC = () => {
  const toast = useToast();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [dueTypes, setDueTypes] = useState<DueType[]>([]);
  const [formData, setFormData] = useState<FormData>({
    pharmacyId: '',
    dueTypeId: '',
    amount: 0,
    dueDate: '',
    description: '',
    isRecurring: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const amountColor = useColorModeValue('green.600', 'green.300');

  useEffect(() => {
    fetchDueTypes();
    fetchPharmacies();
  }, []);

  const fetchDueTypes = async () => {
    try {
      const response = await financialService.getDueTypes();
      setDueTypes(response);
    } catch (err) {
      console.error('Failed to fetch due types:', err);
      toast({
        title: 'Error',
        description: 'Failed to load due types',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchPharmacies = async () => {
    try {
      const pharmaciesData = await financialService.getAllPharmacies();

      // Map the API response to match our local Pharmacy interface structure
      const mappedPharmacies = (pharmaciesData || []).map(
        (pharmacy: PharmacyType) => ({
          _id: pharmacy._id,
          name: pharmacy.name || '', // Use name or empty string as fallback
          registrationNumber: pharmacy.registrationNumber || '',
          owner: {
            firstName: pharmacy.superintendentName?.split(' ')[0] || '',
            lastName: pharmacy.superintendentName?.split(' ')[1] || '',
          },
        })
      );

      setPharmacies(mappedPharmacies);
    } catch (err) {
      console.error('Failed to fetch pharmacies:', err);
      toast({
        title: 'Error',
        description: 'Failed to load pharmacies',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : name === 'amount' // Specifically check for the amount field
          ? parseFloat(value) || 0 // Parse to float, fallback to 0 if NaN
          : value,
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await financialService.assignDue(formData.pharmacyId, {
        dueTypeId: formData.dueTypeId,
        amount: formData.amount,
        dueDate: formData.dueDate,
        description: formData.description,
        isRecurring: formData.isRecurring,
        recurringFrequency: formData.recurringFrequency,
      });

      setSuccess('Due assigned successfully!');
      toast({
        title: 'Success',
        description: 'Due assigned successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      setFormData({
        pharmacyId: '',
        dueTypeId: '',
        amount: 0,
        dueDate: '',
        description: '',
        isRecurring: false,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to assign due';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPharmacies = pharmacies.filter(
    (pharmacy) =>
      pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.registrationNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      `${pharmacy.owner.firstName} ${pharmacy.owner.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const selectedDueType = dueTypes.find((dt) => dt._id === formData.dueTypeId);

  // Effect to update amount when dueType changes
  useEffect(() => {
    if (selectedDueType) {
      const newDefaultAmountFromSelectedType =
        Number(selectedDueType.defaultAmount) || 0;
      setFormData((prev) => {
        const isPrevAmountZero = prev.amount === 0;
        const doesPrevAmountMatchAnyDefault = dueTypes.some(
          (dt) => dt.defaultAmount === prev.amount
        );

        if (isPrevAmountZero || doesPrevAmountMatchAnyDefault) {
          if (prev.amount !== newDefaultAmountFromSelectedType) {
            return { ...prev, amount: newDefaultAmountFromSelectedType };
          }
        }
        return prev;
      });
    } else {
      setFormData((prev) => {
        const isPrevAmountADefault =
          prev.amount !== 0 &&
          dueTypes.some((dt) => dt.defaultAmount === prev.amount);

        if (isPrevAmountADefault) {
          return { ...prev, amount: 0 };
        }
        return prev;
      });
    }
  }, [selectedDueType, dueTypes]);

  return (
    <DashboardLayout>
      <Container maxW="container.xl" py={6}>
        {/* Header */}
        <Box mb={8}>
          <Heading as="h1" size="xl" mb={2}>
            Assign Due
          </Heading>
          <Text color={mutedColor}>
            Assign dues to individual pharmacies with optional recurring settings
          </Text>
        </Box>

        {/* Alert Messages */}
        {error && (
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {success && (
          <Alert status="success" mb={6} borderRadius="md">
            <AlertIcon />
            {success}
          </Alert>
        )}

        <SimpleGrid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
          {/* Assignment Form */}
          <GridItem>
            <Card bg={cardBg} shadow="md" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <CardHeader borderBottomWidth="1px" borderColor={borderColor} pb={4}>
                <Heading size="md">Due Assignment Form</Heading>
              </CardHeader>

              <CardBody p={6}>
                <form onSubmit={handleSubmit}>
                  <VStack spacing={6} align="stretch">
                    {/* Pharmacy Selection */}
                    <FormControl isRequired>
                      <FormLabel fontWeight="medium">Select Pharmacy</FormLabel>
                      <VStack spacing={3} align="stretch">
                        <Input
                          placeholder="Search pharmacies..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <Select
                          name="pharmacyId"
                          value={formData.pharmacyId}
                          onChange={handleInputChange}
                          placeholder="Select a pharmacy"
                          isRequired
                        >
                          {filteredPharmacies.map((pharmacy) => (
                            <option key={pharmacy._id} value={pharmacy._id}>
                              {pharmacy.name} - {pharmacy.registrationNumber} (
                              {pharmacy.owner.firstName} {pharmacy.owner.lastName})
                            </option>
                          ))}
                        </Select>
                      </VStack>
                    </FormControl>

                    {/* Due Type Selection */}
                    <FormControl isRequired>
                      <FormLabel fontWeight="medium">Due Type</FormLabel>
                      <Select
                        name="dueTypeId"
                        value={formData.dueTypeId}
                        onChange={handleInputChange}
                        placeholder="Select due type"
                        isRequired
                      >
                        {dueTypes.map((dueType) => (
                          <option key={dueType._id} value={dueType._id}>
                            {dueType.name} - ₦
                            {dueType.defaultAmount?.toLocaleString() || '0'}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Amount */}
                    <FormControl isRequired>
                      <FormLabel fontWeight="medium">Amount (₦)</FormLabel>
                      <Input
                        type="number"
                        name="amount"
                        value={formData.amount || ''}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        isRequired
                        placeholder="Enter amount"
                      />
                      {selectedDueType && (
                        <Text fontSize="sm" color={mutedColor} mt={1}>
                          Default amount: ₦
                          {selectedDueType.defaultAmount?.toLocaleString() || '0'}
                        </Text>
                      )}
                    </FormControl>

                    {/* Due Date */}
                    <FormControl isRequired>
                      <FormLabel fontWeight="medium">Due Date</FormLabel>
                      <Input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        isRequired
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </FormControl>

                    {/* Description */}
                    <FormControl>
                      <FormLabel fontWeight="medium">Description</FormLabel>
                      <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Optional description for this due assignment"
                      />
                    </FormControl>

                    {/* Recurring Options */}
                    <FormControl>
                      <Flex align="center" mb={4}>
                        <Checkbox
                          name="isRecurring"
                          isChecked={formData.isRecurring}
                          onChange={(e) => handleCheckboxChange('isRecurring', e.target.checked)}
                          colorScheme="blue"
                        >
                          Make this a recurring due
                        </Checkbox>
                      </Flex>

                      {formData.isRecurring && (
                        <FormControl isRequired={formData.isRecurring}>
                          <FormLabel fontWeight="medium">Recurring Frequency</FormLabel>
                          <Select
                            name="recurringFrequency"
                            value={formData.recurringFrequency || ''}
                            onChange={handleInputChange}
                            placeholder="Select frequency"
                            isRequired={formData.isRecurring}
                          >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="annually">Annually</option>
                          </Select>
                        </FormControl>
                      )}
                    </FormControl>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      colorScheme="blue"
                      isLoading={loading}
                      loadingText="Assigning Due..."
                      mt={4}
                      w="full"
                    >
                      Assign Due
                    </Button>
                  </VStack>
                </form>
              </CardBody>
            </Card>
          </GridItem>

          {/* Summary Panel */}
          <GridItem>
            <VStack spacing={6} align="stretch">
              <Card bg={cardBg} shadow="md" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <CardHeader borderBottomWidth="1px" borderColor={borderColor} pb={4}>
                  <Heading size="md">Assignment Summary</Heading>
                </CardHeader>

                <CardBody p={6}>
                  <VStack spacing={4} align="stretch">
                    {formData.pharmacyId && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">
                          Pharmacy:
                        </Text>
                        <Text color={mutedColor}>
                          {pharmacies.find((p) => p._id === formData.pharmacyId)
                            ?.name || 'Not selected'}
                        </Text>
                      </Box>
                    )}

                    {selectedDueType && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">
                          Due Type:
                        </Text>
                        <Text color={mutedColor}>
                          {selectedDueType.name}
                        </Text>
                        {selectedDueType.description && (
                          <Text fontSize="sm" color={mutedColor}>
                            {selectedDueType.description}
                          </Text>
                        )}
                      </Box>
                    )}

                    {formData.amount > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">
                          Amount:
                        </Text>
                        <Text fontSize="lg" fontWeight="bold" color={amountColor}>
                          ₦{Number(formData.amount).toLocaleString()}
                        </Text>
                      </Box>
                    )}

                    {formData.dueDate && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">
                          Due Date:
                        </Text>
                        <Text color={mutedColor}>
                          {new Date(formData.dueDate).toLocaleDateString()}
                        </Text>
                      </Box>
                    )}

                    {formData.isRecurring && formData.recurringFrequency && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">
                          Recurring:
                        </Text>
                        <Badge colorScheme="blue" textTransform="capitalize">
                          {formData.recurringFrequency}
                        </Badge>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Quick Actions */}
              <Card bg={cardBg} shadow="sm" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <CardHeader borderBottomWidth="1px" borderColor={borderColor} pb={4}>
                  <Heading size="sm">Quick Actions</Heading>
                </CardHeader>

                <CardBody p={0}>
                  <VStack spacing={0} align="stretch" divider={<Divider />}>
                    <Button as={Link} to="/dashboard/bulk-assign-dues" variant="ghost" justifyContent="flex-start" py={3} px={6} borderRadius={0} width="100%" textAlign="left" fontWeight="normal">
                      Bulk Assign Dues
                    </Button>
                    <Button as={Link} to="/dashboard/due-types" variant="ghost" justifyContent="flex-start" py={3} px={6} borderRadius={0} width="100%" textAlign="left" fontWeight="normal">
                      Manage Due Types
                    </Button>
                    <Button as={Link} to="/dashboard/admin-payment-review" variant="ghost" justifyContent="flex-start" py={3} px={6} borderRadius={0} width="100%" textAlign="left" fontWeight="normal">
                      Review Payments
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </GridItem>
        </SimpleGrid>
      </Container>
    </DashboardLayout>
  );
};

export default DueAssignmentChakra;
