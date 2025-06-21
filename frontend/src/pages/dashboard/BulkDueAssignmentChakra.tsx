import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
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
  Select,
  Checkbox,  Alert,
  AlertIcon,
  Divider,
  Icon,
  SimpleGrid,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaFilter, FaUsers, FaMoneyBillWave } from 'react-icons/fa';
import financialService from '../../services/financial.service';
import type { Pharmacy, DueType } from '../../types/pharmacy.types';
import DashboardLayout from '../../components/layout/DashboardLayout';

interface BulkAssignmentForm {
  dueTypeId: string;
  amount: number;
  dueDate: string;
  description: string;
  isRecurring: boolean;
  recurringFrequency: 'monthly' | 'quarterly' | 'annually';
  recurringEndDate?: string;
  selectedPharmacies: string[];
  filterCriteria: {
    status: string;
    state: string;
    lga: string;
    registrationYear: string;
  };
}

const BulkDueAssignmentChakra: React.FC = () => {
  const toast = useToast();
  const [form, setForm] = useState<BulkAssignmentForm>({
    dueTypeId: '',
    amount: 0,
    dueDate: '',
    description: '',
    isRecurring: false,
    recurringFrequency: 'annually',
    selectedPharmacies: [],
    filterCriteria: {
      status: '',
      state: '',
      lga: '',
      registrationYear: '',
    },
  });

  const [dueTypes, setDueTypes] = useState<DueType[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);

  // Unique values for filters
  const [states, setStates] = useState<string[]>([]);
  const [lgas, setLgas] = useState<string[]>([]);
    // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    // Use a function reference inside useEffect to avoid dependency on filterPharmacies
    const applyFilters = () => {
      let filtered = [...pharmacies];

      if (form.filterCriteria.status) {
        filtered = filtered.filter(
          (p) => p.registrationStatus === form.filterCriteria.status
        );
      }

      if (form.filterCriteria.state) {
        filtered = filtered.filter(
          (p) => p.townArea === form.filterCriteria.state
        );
      }

      if (form.filterCriteria.lga) {
        filtered = filtered.filter(
          (p) => p.landmark === form.filterCriteria.lga
        );
      }

      if (form.filterCriteria.registrationYear) {
        filtered = filtered.filter((p) => {
          const regYear = new Date(p.registrationDate).getFullYear().toString();
          return regYear === form.filterCriteria.registrationYear;
        });
      }

      setFilteredPharmacies(filtered);
    };

    applyFilters();
  }, [form.filterCriteria, pharmacies]);

  useEffect(() => {
    if (selectAll) {
      setForm((prev) => ({
        ...prev,
        selectedPharmacies: filteredPharmacies.map((p) => p._id),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        selectedPharmacies: [],
      }));
    }
  }, [selectAll, filteredPharmacies]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [dueTypesRes, pharmaciesRes] = await Promise.all([
        financialService.getDueTypes(),
        financialService.getAllPharmacies(),
      ]);

      setDueTypes(dueTypesRes);
      setPharmacies(pharmaciesRes);

      // Extract unique areas and town areas (since address is a string, we'll use townArea for filtering)
      const uniqueStates = Array.from(
        new Set(pharmaciesRes.map((p: Pharmacy) => p.townArea).filter(Boolean))
      );
      const uniqueLgas = Array.from(
        new Set(pharmaciesRes.map((p: Pharmacy) => p.landmark).filter(Boolean))
      );

      setStates(uniqueStates);
      setLgas(uniqueLgas);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (
    field: keyof BulkAssignmentForm,
    value: string | number | boolean | string[]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleFilterChange = (
    field: keyof BulkAssignmentForm['filterCriteria'],
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      filterCriteria: { ...prev.filterCriteria, [field]: value },
    }));
  };

  const togglePharmacySelection = (pharmacyId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedPharmacies: prev.selectedPharmacies.includes(pharmacyId)
        ? prev.selectedPharmacies.filter((id) => id !== pharmacyId)
        : [...prev.selectedPharmacies, pharmacyId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.selectedPharmacies.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one pharmacy',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setError('Please select at least one pharmacy');
      return;
    }

    if (!form.dueTypeId || !form.amount || !form.dueDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const bulkAssignmentData = {
        dueTypeId: form.dueTypeId,
        amount: form.amount,
        dueDate: form.dueDate,
        description: form.description,
        pharmacyIds: form.selectedPharmacies,
      };

      await financialService.bulkAssignDues(bulkAssignmentData);

      toast({
        title: 'Success',
        description: `Successfully assigned dues to ${form.selectedPharmacies.length} pharmacies`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setSuccess(
        `Successfully assigned dues to ${form.selectedPharmacies.length} pharmacies`
      );

      // Reset form
      setForm({
        dueTypeId: '',
        amount: 0,
        dueDate: '',
        description: '',
        isRecurring: false,
        recurringFrequency: 'annually',
        selectedPharmacies: [],
        filterCriteria: {
          status: '',
          state: '',
          lga: '',
          registrationYear: '',
        },
      });
      setSelectAll(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign dues';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="xl" thickness="4px" color="blue.500" />
        </Flex>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxW="container.xl" py={6}>
        <Box mb={6}>
          <Heading as="h1" size="xl" mb={2}>
            Bulk Due Assignment
          </Heading>
          <Text color={mutedColor}>
            Assign dues to multiple pharmacies at once using filters and selection criteria
          </Text>
        </Box>

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

        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            {/* Due Information Card */}
            <Card bg={cardBg} shadow="md" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <CardHeader pb={4} borderBottomWidth="1px" borderColor={borderColor}>
                <Flex align="center">
                  <Icon as={FaMoneyBillWave} mr={2} color="blue.500" />
                  <Heading size="md">Due Information</Heading>
                </Flex>
              </CardHeader>
              
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl isRequired>
                    <FormLabel>Due Type</FormLabel>
                    <Select
                      value={form.dueTypeId}
                      onChange={(e) => handleFormChange('dueTypeId', e.target.value)}
                      placeholder="Select due type"
                    >
                      {dueTypes.map((type) => (
                        <option key={type._id} value={type._id}>
                          {type.name} - ₦{type.defaultAmount.toLocaleString()}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Amount (₦)</FormLabel>
                    <Input
                      type="number"
                      value={form.amount || ''}
                      onChange={(e) => handleFormChange('amount', Number(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Due Date</FormLabel>
                    <Input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => handleFormChange('dueDate', e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Input
                      value={form.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      placeholder="Optional description"
                    />
                  </FormControl>
                </SimpleGrid>

                {/* Recurring Options */}
                <Box mt={6}>
                  <Checkbox
                    isChecked={form.isRecurring}
                    onChange={(e) => handleFormChange('isRecurring', e.target.checked)}
                    colorScheme="blue"
                    mb={4}
                  >
                    Make this a recurring due
                  </Checkbox>

                  {form.isRecurring && (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel>Frequency</FormLabel>
                        <Select
                          value={form.recurringFrequency}
                          onChange={(e) => handleFormChange('recurringFrequency', e.target.value)}
                        >
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="annually">Annually</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <Input
                          type="date"
                          value={form.recurringEndDate || ''}
                          onChange={(e) => handleFormChange('recurringEndDate', e.target.value)}
                        />
                      </FormControl>
                    </SimpleGrid>
                  )}
                </Box>
              </CardBody>
            </Card>

            {/* Pharmacy Filters Card */}
            <Card bg={cardBg} shadow="md" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <CardHeader pb={4} borderBottomWidth="1px" borderColor={borderColor}>
                <Flex align="center">
                  <Icon as={FaFilter} mr={2} color="blue.500" />
                  <Heading size="md">Filter Pharmacies</Heading>
                </Flex>
              </CardHeader>
              
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Registration Status</FormLabel>
                    <Select
                      value={form.filterCriteria.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      placeholder="All Statuses"
                    >
                      <option value="">All Statuses</option>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>State</FormLabel>
                    <Select
                      value={form.filterCriteria.state}
                      onChange={(e) => handleFilterChange('state', e.target.value)}
                      placeholder="All States"
                    >
                      <option value="">All States</option>
                      {states.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>LGA</FormLabel>
                    <Select
                      value={form.filterCriteria.lga}
                      onChange={(e) => handleFilterChange('lga', e.target.value)}
                      placeholder="All LGAs"
                    >
                      <option value="">All LGAs</option>
                      {lgas.map((lga) => (
                        <option key={lga} value={lga}>
                          {lga}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Registration Year</FormLabel>
                    <Select
                      value={form.filterCriteria.registrationYear}
                      onChange={(e) => handleFilterChange('registrationYear', e.target.value)}
                      placeholder="All Years"
                    >
                      <option value="">All Years</option>
                      {Array.from(
                        new Set(
                          pharmacies.map((p) =>
                            new Date(p.registrationDate).getFullYear()
                          )
                        )
                      )
                        .sort((a, b) => b - a)
                        .map((year) => (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Pharmacy Selection Card */}
            <Card bg={cardBg} shadow="md" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <CardHeader pb={4} borderBottomWidth="1px" borderColor={borderColor}>
                <Flex justify="space-between" align="center">
                  <Flex align="center">
                    <Icon as={FaUsers} mr={2} color="blue.500" />
                    <Heading size="md">
                      Select Pharmacies ({filteredPharmacies.length} found)
                    </Heading>
                  </Flex>
                  <Checkbox
                    isChecked={selectAll}
                    onChange={(e) => setSelectAll(e.target.checked)}
                    colorScheme="blue"
                  >
                    Select All
                  </Checkbox>
                </Flex>
              </CardHeader>

              <CardBody>
                <Alert status="info" mb={4} borderRadius="md">
                  <AlertIcon />
                  {form.selectedPharmacies.length} of {filteredPharmacies.length} pharmacies selected
                </Alert>

                <Box maxH="400px" overflowY="auto" borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                  <VStack spacing={0} align="stretch" divider={<Divider />}>
                    {filteredPharmacies.map((pharmacy) => (
                      <Flex
                        key={pharmacy._id}
                        p={3}
                        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                        borderRadius="md"
                        cursor="pointer"
                        onClick={() => togglePharmacySelection(pharmacy._id)}
                        align="center"
                      >
                        <Checkbox
                          isChecked={form.selectedPharmacies.includes(pharmacy._id)}
                          onChange={() => togglePharmacySelection(pharmacy._id)}
                          colorScheme="blue"
                          mr={3}
                        />
                        <Box flex="1">
                          <Flex justify="space-between" align="flex-start">
                            <Box>
                              <Text fontWeight="medium">{pharmacy.name}</Text>
                              <Text fontSize="sm" color={mutedColor}>
                                {pharmacy.townArea}, {pharmacy.landmark}
                              </Text>
                            </Box>
                            <Badge
                              colorScheme={
                                pharmacy.registrationStatus === 'active'
                                  ? 'green'
                                  : pharmacy.registrationStatus === 'pending'
                                  ? 'yellow'
                                  : 'red'
                              }
                              borderRadius="full"
                            >
                              {pharmacy.registrationStatus}
                            </Badge>
                          </Flex>
                        </Box>
                      </Flex>
                    ))}
                  </VStack>
                </Box>
              </CardBody>
            </Card>

            {/* Submit Buttons */}
            <Flex justify="flex-end" gap={4}>
              <Button variant="outline" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={submitting}
                loadingText="Assigning..."
                isDisabled={submitting || form.selectedPharmacies.length === 0}
              >
                {`Assign to ${form.selectedPharmacies.length} Pharmacies`}
              </Button>
            </Flex>
          </VStack>
        </form>
      </Container>
    </DashboardLayout>
  );
};

export default BulkDueAssignmentChakra;
