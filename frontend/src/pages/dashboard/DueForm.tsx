import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  useToast,
  Text,
  useColorModeValue,
  Grid,
  GridItem,
  Switch,
  Alert,
  AlertIcon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import financialService from '../../services/financial.service';
import type { DueType, Pharmacy } from '../../types/pharmacy.types';

interface FormData {
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  dueTypeId: string;
  pharmacyId: string;
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'annually';
  isRecurring: boolean;
  year?: number;
  assignmentType?: 'individual' | 'bulk';
  assignedBy?: string;
  assignedAt?: Date;
}

const DueForm: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dueTypes, setDueTypes] = useState<DueType[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    amount: 0,
    dueDate: '',
    dueTypeId: '',
    pharmacyId: '',
    frequency: 'one-time',
    isRecurring: false,
  });

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
      const errorMessage = 'Failed to load due types';
      setError(errorMessage);
      toast({
        title: 'Error loading due types',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchPharmacies = async () => {
    try {
      const response = await financialService.getAllPharmacies();
      setPharmacies(response);
    } catch (err) {
      console.error('Failed to fetch pharmacies:', err);
      const errorMessage = 'Failed to load pharmacies';
      setError(errorMessage);
      toast({
        title: 'Error loading pharmacies',
        description: errorMessage,
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

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Set year from due date
      const dueYear = new Date(formData.dueDate).getFullYear();

      const dueData = {
        ...formData,
        year: dueYear,
        assignmentType: 'individual' as const,
        assignedAt: new Date(),
        // Convert amount to number
        amount: Number(formData.amount),
      };

      const response = await financialService.assignDue(
        formData.pharmacyId,
        dueData
      );      if (response) {
        toast({
          title: 'Due created successfully',
          description: 'The due has been assigned successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/finances/dues');
      }
    } catch (err: any) {
      console.error('Error creating due:', err);
      const errorMessage = err.message || 'Failed to create due';
      setError(errorMessage);
      toast({
        title: 'Error creating due',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Container maxW="container.lg" py={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="xl" color="gray.800" mb={2}>
            Create New Due
          </Heading>
          <Text color="gray.600">
            Create a new due for assignment to pharmacies
          </Text>
        </Box>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Card bg={bgColor} shadow="md">
          <CardHeader>
            <Heading size="lg">Due Details</Heading>
          </CardHeader>

          <CardBody>
            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={6} align="stretch">
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                  {/* Pharmacy Selection */}
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Pharmacy</FormLabel>
                      <Select
                        name="pharmacyId"
                        value={formData.pharmacyId}
                        onChange={handleInputChange}
                        placeholder="Select a pharmacy"
                      >
                        {pharmacies.map((pharmacy) => (
                          <option key={pharmacy._id} value={pharmacy._id}>
                            {pharmacy.name} ({pharmacy.registrationNumber})
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>

                  {/* Due Type Selection */}
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Due Type</FormLabel>
                      <Select
                        name="dueTypeId"
                        value={formData.dueTypeId}
                        onChange={handleInputChange}
                        placeholder="Select a due type"
                      >
                        {dueTypes.map((dueType) => (
                          <option key={dueType._id} value={dueType._id}>
                            {dueType.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>

                  {/* Title */}
                  <GridItem colSpan={2}>
                    <FormControl isRequired>
                      <FormLabel>Title</FormLabel>
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter due title"
                      />
                    </FormControl>
                  </GridItem>

                  {/* Description */}
                  <GridItem colSpan={2}>
                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Enter due description"
                      />
                    </FormControl>
                  </GridItem>

                  {/* Amount */}
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Amount</FormLabel>
                      <NumberInput
                        min={0}
                        precision={2}
                        value={formData.amount}
                        onChange={(valueString) =>
                          setFormData((prev) => ({ ...prev, amount: Number(valueString) || 0 }))
                        }
                      >
                        <NumberInputField
                          name="amount"
                          placeholder="Enter amount"
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </GridItem>

                  {/* Due Date */}
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Due Date</FormLabel>
                      <Input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                      />
                    </FormControl>
                  </GridItem>

                  {/* Recurring Options */}
                  <GridItem colSpan={2}>
                    <VStack spacing={4} align="stretch">
                      <HStack>
                        <Switch
                          name="isRecurring"
                          isChecked={formData.isRecurring}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, isRecurring: e.target.checked }))
                          }
                        />
                        <FormLabel mb={0}>Make this a recurring due</FormLabel>
                      </HStack>

                      {formData.isRecurring && (
                        <FormControl>
                          <FormLabel>Frequency</FormLabel>
                          <Select
                            name="frequency"
                            value={formData.frequency}
                            onChange={handleInputChange}
                          >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="annually">Annually</option>
                          </Select>
                        </FormControl>
                      )}
                    </VStack>
                  </GridItem>
                </Grid>

                {/* Submit Buttons */}
                <HStack spacing={4} justify="flex-end" pt={4}>
                  <Button
                    variant="outline"
                    colorScheme="gray"
                    onClick={() => navigate('/finances/dues')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    leftIcon={<AddIcon />}
                    isLoading={loading}
                    loadingText="Creating..."
                  >
                    Create Due
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

export default DueForm;
