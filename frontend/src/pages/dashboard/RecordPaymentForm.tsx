import React, { useState, useEffect } from 'react';
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
  FormErrorMessage,
  Input,
  Select,
  Textarea,
  Button,
  useToast,
  Text,
  useColorModeValue,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Flex,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import financialService from '../../services/financial.service';
import pharmacyService from '../../services/pharmacy.service';

const RecordPaymentForm: React.FC = () => {
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [dues, setDues] = useState<any[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [selectedDue, setSelectedDue] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const navigate = useNavigate();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  
  const paymentTypes = [
    { value: 'due', label: 'Dues' },
    { value: 'donation', label: 'Donation' },
    { value: 'event_fee', label: 'Event Fee' },
    { value: 'registration_fee', label: 'Registration Fee' },
    { value: 'conference_fee', label: 'Conference Fee' },
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'building', label: 'Building' },
    { value: 'other', label: 'Other' },
  ];
  const [paymentType, setPaymentType] = useState('due');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [participant, setParticipant] = useState('');
  const [eventId, setEventId] = useState('');

  useEffect(() => {
    pharmacyService.getPharmacies(1, 100).then(res => setPharmacies(res.pharmacies));
  }, []);

  useEffect(() => {
    if (selectedPharmacy && paymentType === 'due') {
      financialService.getRealDues({ pharmacyId: selectedPharmacy, paymentStatus: undefined }).then((res) => {
        setDues(res.dues || []);
      });
    } else {
      setDues([]);
    }
  }, [selectedPharmacy, paymentType]);
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!selectedPharmacy) newErrors.pharmacy = 'Please select a pharmacy';
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Please enter a valid amount';
    if (!paymentMethod) newErrors.paymentMethod = 'Please select a payment method';
    if (!receipt) newErrors.receipt = 'Please upload a receipt';
    if (paymentType === 'due' && !selectedDue) newErrors.due = 'Please select a due';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields correctly.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('paymentType', paymentType);
      formData.append('pharmacyId', selectedPharmacy);
      formData.append('amount', amount);
      formData.append('paymentMethod', paymentMethod);
      formData.append('paymentReference', paymentReference);
      formData.append('receipt', receipt!);
      if (paymentType === 'due') formData.append('dueId', selectedDue);
      if (purpose) formData.append('purpose', purpose);
      if (description) formData.append('description', description);
      if (participant) formData.append('participant', participant);
      if (eventId) formData.append('eventId', eventId);
      
      await financialService.recordPayment(formData);
      
      toast({
        title: 'Success',
        description: 'Payment recorded successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      navigate('/finances/payment-history');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to record payment.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Container maxW="2xl" py={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Heading size="lg" color="gray.800">
            Record New Payment
          </Heading>
          <Button
            variant="outline"
            leftIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </Flex>

        {/* Form Card */}
        <Card bg={cardBg} shadow="lg">
          <CardHeader>
            <Heading size="md">Payment Details</Heading>
          </CardHeader>
          <CardBody>
            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={6}>
                {/* Payment Type */}
                <FormControl isInvalid={!!errors.paymentType}>
                  <FormLabel>Payment Type <Text as="span" color="red.500">*</Text></FormLabel>
                  <Select
                    value={paymentType}
                    onChange={e => setPaymentType(e.target.value)}
                    bg="white"
                  >
                    {paymentTypes.map(pt => (
                      <option key={pt.value} value={pt.value}>{pt.label}</option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.paymentType}</FormErrorMessage>
                </FormControl>

                {/* Pharmacy Selection */}
                <FormControl isInvalid={!!errors.pharmacy}>
                  <FormLabel>Pharmacy <Text as="span" color="red.500">*</Text></FormLabel>
                  <Select
                    value={selectedPharmacy}
                    onChange={e => setSelectedPharmacy(e.target.value)}
                    placeholder="Select Pharmacy"
                    bg="white"
                  >
                    {pharmacies.map(pharm => (
                      <option key={pharm._id} value={pharm._id}>{pharm.name}</option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.pharmacy}</FormErrorMessage>
                </FormControl>

                {/* Due Selection (conditional) */}
                {paymentType === 'due' && (
                  <FormControl isInvalid={!!errors.due}>
                    <FormLabel>Due <Text as="span" color="red.500">*</Text></FormLabel>
                    <Select
                      value={selectedDue}
                      onChange={e => setSelectedDue(e.target.value)}
                      placeholder="Select Due"
                      bg="white"
                      isDisabled={!selectedPharmacy}
                    >
                      {dues.map(due => (
                        <option key={due._id} value={due._id}>
                          {due.title} (₦{due.amount})
                        </option>
                      ))}
                    </Select>
                    <FormErrorMessage>{errors.due}</FormErrorMessage>
                  </FormControl>
                )}

                {/* Event Details (conditional) */}
                {paymentType === 'event_fee' && (
                  <VStack spacing={4} w="full">
                    <FormControl>
                      <FormLabel>Event ID</FormLabel>
                      <Input
                        value={eventId}
                        onChange={e => setEventId(e.target.value)}
                        placeholder="Enter Event ID or Name"
                        bg="white"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Participant</FormLabel>
                      <Input
                        value={participant}
                        onChange={e => setParticipant(e.target.value)}
                        placeholder="Participant Name"
                        bg="white"
                      />
                    </FormControl>
                  </VStack>
                )}

                {/* Purpose (conditional) */}
                {(paymentType === 'donation' || paymentType === 'other' || 
                  paymentType === 'conference_fee' || paymentType === 'accommodation' || 
                  paymentType === 'seminar' || paymentType === 'transportation' || 
                  paymentType === 'building' || paymentType === 'registration_fee') && (
                  <FormControl>
                    <FormLabel>Purpose <Text as="span" color="red.500">*</Text></FormLabel>
                    <Input
                      value={purpose}
                      onChange={e => setPurpose(e.target.value)}
                      placeholder="Purpose/Title"
                      bg="white"
                    />
                  </FormControl>
                )}

                {/* Amount and Payment Method */}
                <HStack w="full" spacing={4}>
                  <FormControl isInvalid={!!errors.amount} flex={1}>
                    <FormLabel>Amount (NGN) <Text as="span" color="red.500">*</Text></FormLabel>
                    <NumberInput 
                      min={0.01} 
                      precision={2}
                      value={amount}
                      onChange={(value) => setAmount(value)}
                    >
                      <NumberInputField bg="white" placeholder="0.00" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormErrorMessage>{errors.amount}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.paymentMethod} flex={1}>
                    <FormLabel>Payment Method <Text as="span" color="red.500">*</Text></FormLabel>
                    <Select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      bg="white"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="mobile_payment">Mobile Payment</option>
                    </Select>
                    <FormErrorMessage>{errors.paymentMethod}</FormErrorMessage>
                  </FormControl>
                </HStack>

                {/* Payment Reference */}
                <FormControl>
                  <FormLabel>Payment Reference</FormLabel>
                  <Input
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    placeholder="e.g. Bank transaction ID"
                    bg="white"
                  />
                </FormControl>

                {/* Description */}
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows={3}
                    bg="white"
                  />
                </FormControl>

                {/* Receipt Upload */}
                <FormControl isInvalid={!!errors.receipt}>
                  <FormLabel>Receipt Upload <Text as="span" color="red.500">*</Text></FormLabel>
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => setReceipt(e.target.files?.[0] || null)}
                    bg="white"
                    border="2px dashed"
                    borderColor="gray.300"
                    _hover={{ borderColor: 'gray.400' }}
                    py={2}
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Upload payment receipt (Image or PDF format)
                  </Text>
                  <FormErrorMessage>{errors.receipt}</FormErrorMessage>
                </FormControl>

                {/* Submit Button */}
                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  w="full"
                  isLoading={loading}
                  loadingText="Recording Payment..."
                  mt={4}
                >
                  Record Payment
                </Button>
              </VStack>
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default RecordPaymentForm; 