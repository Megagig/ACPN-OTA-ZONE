import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardBody,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Textarea,
  Button,
  useToast,
  Text,
  Spinner,
  Center,
  useColorModeValue,
  Grid,
  GridItem,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Flex,
  Alert,
  AlertIcon,
  Divider,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import financialService from '../../services/financial.service';
import pharmacyService from '../../services/pharmacy.service';
import type { Donation } from '../../types/financial.types';
import type { Pharmacy } from '../../types/pharmacy.types';

const DonationFormComponent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const isEditMode = Boolean(id);

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>('');

  const [formData, setFormData] = useState<Partial<Donation>>({
    title: '',
    description: '',
    amount: 0,
    donor: {
      name: '',
      email: '',
      phone: '',
      type: 'individual',
    },
    purpose: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    status: 'pending',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPharmacies, setIsLoadingPharmacies] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (isEditMode) {
      fetchDonation();
    }
    fetchPharmacies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const fetchPharmacies = async () => {
    setIsLoadingPharmacies(true);
    try {
      const response = await pharmacyService.getPharmacies(1, 100);
      setPharmacies(response.pharmacies);

      // Select the first pharmacy by default if available
      if (response.pharmacies.length > 0 && !selectedPharmacyId) {
        setSelectedPharmacyId(response.pharmacies[0]._id);
      }    } catch (err) {
      console.error('Error fetching pharmacies:', err);
      toast({
        title: 'Error loading pharmacies',
        description: 'Failed to load pharmacies. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingPharmacies(false);
    }
  };

  const fetchDonation = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const donation = await financialService.getDonationById(id);
      // Format date to YYYY-MM-DD for input[type="date"]
      const formattedDate = new Date(donation.date).toISOString().split('T')[0];

      setFormData({
        ...donation,
        date: formattedDate,
      });
    } catch (err) {
      console.error('Error fetching donation:', err);
      setError('Failed to load donation data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      // Handle nested properties (for donor object)
      const [parent, child] = name.split('.');

      // Create safe copy of the parent object with proper typing
      const parentObj =
        (formData[parent as keyof typeof formData] as Record<
          string,
          string | number | undefined
        >) || {};

      setFormData({
        ...formData,
        [parent]: {
          ...parentObj,
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: name === 'amount' ? parseFloat(value) || 0 : value,
      });
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Validate form fields
    if (!selectedPharmacyId) {
      setError('Please select a pharmacy');
      setIsSaving(false);
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      setError('Please enter a valid donation amount');
      setIsSaving(false);
      return;
    }

    if (!formData.date) {
      setError('Please select a donation date');
      setIsSaving(false);
      return;
    }

    if (!formData.title) {
      setError('Please enter a donation title');
      setIsSaving(false);
      return;
    }

    try {
      // Transform the frontend data model to match the backend expectations
      const donationData = {
        pharmacyId: selectedPharmacyId,
        amount: formData.amount,
        donationDate: formData.date,
        purpose: formData.purpose || formData.title, // Use purpose if available, otherwise use title
      };

      if (isEditMode && id) {
        await financialService.updateDonation(id, donationData);
        toast({
          title: 'Donation updated successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await financialService.createDonation(donationData);
        toast({
          title: 'Donation created successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        // Reset form if creating new donation
        if (!isEditMode) {
          setFormData({
            title: '',
            description: '',
            amount: 0,
            donor: {
              name: '',
              email: '',
              phone: '',
              type: 'individual',
            },
            purpose: '',
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'cash',
            status: 'pending',
          });
        }
      }

      // Redirect after successful submission with a short delay
      setTimeout(() => {
        navigate('/finances/donations');
      }, 1500);
    } catch (err: unknown) {
      console.error('Error saving donation:', err);

      // Handle error in a type-safe way
      let errorMessage = 'Failed to save donation. Please try again.';

      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as {
          response?: { data?: { message?: string; error?: string } };
        };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      toast({
        title: 'Error saving donation',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Center>
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text fontSize="lg" color="gray.600">
              Loading donation data...
            </Text>
          </VStack>
        </Center>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Heading size="lg" color="gray.800">
            {isEditMode ? 'Edit Donation' : 'Record New Donation'}
          </Heading>
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="outline"
            colorScheme="gray"
            onClick={() => navigate('/finances/donations')}
          >
            Back to Donations
          </Button>
        </Flex>

        {/* Error Alert */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Form Card */}
        <Card bg={bgColor} shadow="lg">
          <CardBody>
            <Box as="form" onSubmit={handleSubmit}>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={8}>
                {/* Basic Information */}
                <GridItem>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="md" mb={4} pb={2} borderBottom="1px" borderColor={borderColor}>
                        Donation Information
                      </Heading>
                    </Box>

                    <FormControl isRequired isInvalid={!!error && error.includes('title')}>
                      <FormLabel>Title</FormLabel>
                      <Input
                        name="title"
                        value={formData.title || ''}
                        onChange={handleChange}
                        placeholder="Donation Title"
                      />
                      <FormErrorMessage>Title is required</FormErrorMessage>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Brief description of the donation"
                      />
                    </FormControl>

                    <FormControl isRequired isInvalid={!!error && error.includes('amount')}>
                      <FormLabel>Amount (₦)</FormLabel>
                      <NumberInput
                        min={0}
                        precision={2}
                        value={formData.amount || ''}
                        onChange={(valueString) => {
                          setFormData({
                            ...formData,
                            amount: parseFloat(valueString) || 0,
                          });
                        }}
                      >
                        <NumberInputField placeholder="0.00" />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <FormErrorMessage>Valid amount is required</FormErrorMessage>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Purpose</FormLabel>
                      <Input
                        name="purpose"
                        value={formData.purpose || ''}
                        onChange={handleChange}
                        placeholder="Purpose of donation"
                      />
                    </FormControl>

                    <FormControl isRequired isInvalid={!!error && error.includes('date')}>
                      <FormLabel>Date</FormLabel>
                      <Input
                        type="date"
                        name="date"
                        value={formData.date || ''}
                        onChange={handleChange}
                      />
                      <FormErrorMessage>Date is required</FormErrorMessage>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Payment Method</FormLabel>
                      <Select
                        name="paymentMethod"
                        value={formData.paymentMethod || 'cash'}
                        onChange={handleChange}
                      >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="check">Check</option>
                        <option value="card">Card</option>
                        <option value="mobile_money">Mobile Money</option>
                        <option value="online_payment">Online Payment</option>
                        <option value="other">Other</option>
                      </Select>
                    </FormControl>

                    {isEditMode && (
                      <FormControl isRequired>
                        <FormLabel>Status</FormLabel>
                        <Select
                          name="status"
                          value={formData.status || 'pending'}
                          onChange={handleChange}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </Select>
                      </FormControl>
                    )}

                    <FormControl isRequired isInvalid={!!error && error.includes('pharmacy')}>
                      <FormLabel>Pharmacy</FormLabel>
                      <Select
                        value={selectedPharmacyId}
                        onChange={(e) => setSelectedPharmacyId(e.target.value)}
                        placeholder="Select a pharmacy"
                        isDisabled={isLoadingPharmacies}
                      >
                        {pharmacies.length > 0 ? (
                          pharmacies.map((pharmacy) => (
                            <option key={pharmacy._id} value={pharmacy._id}>
                              {pharmacy.name} ({pharmacy.registrationNumber || 'No Reg Number'})
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            {isLoadingPharmacies
                              ? 'Loading pharmacies...'
                              : 'No pharmacies available'}
                          </option>
                        )}
                      </Select>
                      {isLoadingPharmacies && (
                        <Text fontSize="sm" color="gray.500" mt={1}>
                          <Spinner size="xs" mr={2} />
                          Loading pharmacies...
                        </Text>
                      )}
                      <FormErrorMessage>Pharmacy selection is required</FormErrorMessage>
                    </FormControl>
                  </VStack>
                </GridItem>                {/* Donor Information */}
                <GridItem>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="md" mb={4} pb={2} borderBottom="1px" borderColor={borderColor}>
                        Donor Information
                      </Heading>
                    </Box>

                    <FormControl isRequired>
                      <FormLabel>Donor Type</FormLabel>
                      <Select
                        name="donor.type"
                        value={formData.donor?.type || 'individual'}
                        onChange={handleChange}
                      >
                        <option value="member">Member</option>
                        <option value="organization">Organization</option>
                        <option value="individual">Individual</option>
                        <option value="anonymous">Anonymous</option>
                      </Select>
                    </FormControl>

                    <FormControl isRequired={formData.donor?.type !== 'anonymous'}>
                      <FormLabel>Donor Name</FormLabel>
                      <Input
                        name="donor.name"
                        value={formData.donor?.name || ''}
                        onChange={handleChange}
                        placeholder="Donor name"
                        isDisabled={formData.donor?.type === 'anonymous'}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Donor Email</FormLabel>
                      <Input
                        type="email"
                        name="donor.email"
                        value={formData.donor?.email || ''}
                        onChange={handleChange}
                        placeholder="Donor email address"
                        isDisabled={formData.donor?.type === 'anonymous'}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Donor Phone</FormLabel>
                      <Input
                        type="tel"
                        name="donor.phone"
                        value={formData.donor?.phone || ''}
                        onChange={handleChange}
                        placeholder="Donor phone number"
                        isDisabled={formData.donor?.type === 'anonymous'}
                      />
                    </FormControl>

                    <Box pt={8}>
                      <FormLabel mb={3}>Attachments (Coming soon)</FormLabel>
                      <Box
                        border="2px dashed"
                        borderColor="gray.300"
                        borderRadius="md"
                        p={6}
                        textAlign="center"
                      >
                        <VStack spacing={2}>
                          <Text fontSize="3xl" color="gray.400">📎</Text>
                          <Text fontSize="sm" color="gray.500">
                            Drag and drop files here or click to browse
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            Supported file types: PDF, JPG, PNG (max 5MB each)
                          </Text>
                        </VStack>
                      </Box>
                    </Box>
                  </VStack>
                </GridItem>
              </Grid>

              <Divider my={8} />

              {/* Submit Buttons */}
              <HStack spacing={3} justify="flex-end">
                <Button
                  variant="outline"
                  onClick={() => navigate('/finances/donations')}
                  isDisabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={isSaving}
                  loadingText={isEditMode ? 'Updating...' : 'Saving...'}
                  px={6}
                >
                  {isEditMode ? 'Update Donation' : 'Save Donation'}
                </Button>
              </HStack>
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default DonationFormComponent;
