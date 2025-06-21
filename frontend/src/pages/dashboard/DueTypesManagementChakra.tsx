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
  useToast,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  SimpleGrid,
  HStack,
  Spinner,
  useColorModeValue,
  Icon,
  useDisclosure,
} from '@chakra-ui/react';
import { 
  AddIcon, 
  EditIcon, 
  DeleteIcon, 
  InfoIcon
} from '@chakra-ui/icons';
import type { DueType } from '../../types/pharmacy.types';
import financialService from '../../services/financial.service';
import DashboardLayout from '../../components/layout/DashboardLayout';

interface DueTypeForm {
  name: string;
  description: string;
  defaultAmount: number;
  isRecurring: boolean;
  isActive: boolean;
}

const DueTypesManagementChakra: React.FC = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [dueTypes, setDueTypes] = useState<DueType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDueType, setEditingDueType] = useState<DueType | null>(null);
  const [formData, setFormData] = useState<DueTypeForm>({
    name: '',
    description: '',
    defaultAmount: 0,
    isRecurring: false,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    fetchDueTypes();
  }, []);

  const fetchDueTypes = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      defaultAmount: 0,
      isRecurring: false,
      isActive: true,
    });
    setEditingDueType(null);
  };

  const openCreateModal = () => {
    resetForm();
    onOpen();
  };

  const openEditModal = (dueType: DueType) => {
    setFormData({
      name: dueType.name,
      description: dueType.description || '',
      defaultAmount: dueType.defaultAmount,
      isRecurring: dueType.isRecurring || false,
      isActive: dueType.isActive !== false,
    });
    setEditingDueType(dueType);
    onOpen();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    // Special handling for different types of inputs
    let processedValue;
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      // Convert number input values to actual numbers
      processedValue = value === '' ? '' : Number(value);
    } else {
      processedValue = value;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.defaultAmount <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingDueType) {
        await financialService.updateDueType(editingDueType._id, formData);
        toast({
          title: 'Success',
          description: 'Due type updated successfully!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        await financialService.createDueType(formData);
        toast({
          title: 'Success',
          description: 'Due type created successfully!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }

      handleClose();
      await fetchDueTypes();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save due type';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (dueTypeId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this due type? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await financialService.deleteDueType(dueTypeId);
      toast({
        title: 'Success',
        description: 'Due type deleted successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      await fetchDueTypes();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete due type';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatCurrency = (amount: number | undefined): string => {
    // Check if amount is undefined, null, NaN, or non-numeric
    if (amount === undefined || amount === null || isNaN(amount)) {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
      }).format(0);
    }

    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <Container maxW="container.xl" py={6}>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8}>
          <Box>
            <Heading as="h1" size="xl" mb={2}>
              Due Types Management
            </Heading>
            <Text color={textColor}>
              Create and manage different types of dues for pharmacies
            </Text>
          </Box>
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="blue" 
            onClick={openCreateModal}
          >
            Add New Due Type
          </Button>
        </Flex>

        {loading ? (
          <Flex justify="center" align="center" h="50vh">
            <Spinner size="xl" thickness="4px" color="blue.500" />
          </Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {dueTypes.length === 0 ? (
              <Box gridColumn="1 / -1" textAlign="center" py={12}>
                <Icon as={InfoIcon} boxSize={12} color="gray.400" mb={4} />
                <Heading as="h3" size="md" mb={2}>
                  No due types found
                </Heading>
                <Text mb={6} color={textColor}>
                  Get started by creating a new due type.
                </Text>
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  onClick={openCreateModal}
                >
                  Add Due Type
                </Button>
              </Box>
            ) : (
              dueTypes.map((dueType) => (
                <Card
                  key={dueType._id}
                  bg={cardBg}
                  shadow="md"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                  overflow="hidden"
                >
                  <CardBody p={6}>
                    <Flex justify="space-between" mb={4}>
                      <Box flex="1">
                        <Heading as="h3" size="md" mb={2}>
                          {dueType.name}
                        </Heading>
                        <Text fontSize="sm" color={textColor} mb={3}>
                          {dueType.description || 'No description provided'}
                        </Text>
                      </Box>
                      <HStack spacing={1}>
                        <Badge
                          colorScheme={dueType.isActive !== false ? 'green' : 'gray'}
                          variant="subtle"
                          rounded="full"
                          px={2}
                          py={1}
                        >
                          {dueType.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                        {dueType.isRecurring && (
                          <Badge
                            colorScheme="blue"
                            variant="subtle"
                            rounded="full"
                            px={2}
                            py={1}
                          >
                            Recurring
                          </Badge>
                        )}
                      </HStack>
                    </Flex>

                    <VStack align="stretch" spacing={2} mb={4}>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color={textColor}>
                          Default Amount:
                        </Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {formatCurrency(
                            typeof dueType.defaultAmount === 'number'
                              ? dueType.defaultAmount
                              : 0
                          )}
                        </Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color={textColor}>
                          Created:
                        </Text>
                        <Text fontSize="sm">
                          {formatDate(dueType.createdAt)}
                        </Text>
                      </Flex>
                      {dueType.updatedAt !== dueType.createdAt && (
                        <Flex justify="space-between">
                          <Text fontSize="sm" color={textColor}>
                            Updated:
                          </Text>
                          <Text fontSize="sm">
                            {formatDate(dueType.updatedAt)}
                          </Text>
                        </Flex>
                      )}
                    </VStack>

                    <Flex gap={2}>
                      <Button
                        flex="1"
                        leftIcon={<EditIcon />}
                        colorScheme="blue"
                        size="sm"
                        onClick={() => openEditModal(dueType)}
                      >
                        Edit
                      </Button>
                      <Button
                        flex="1"
                        leftIcon={<DeleteIcon />}
                        colorScheme="red"
                        size="sm"
                        onClick={() => handleDelete(dueType._id)}
                      >
                        Delete
                      </Button>
                    </Flex>
                  </CardBody>
                </Card>
              ))
            )}
          </SimpleGrid>
        )}

        {/* Form Modal */}
        <Modal isOpen={isOpen} onClose={handleClose} size="md">
          <ModalOverlay />
          <ModalContent as="form" onSubmit={handleSubmit}>
            <ModalHeader>
              {editingDueType ? 'Edit Due Type' : 'Create New Due Type'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Annual Dues, Registration Fee"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe what this due type is for..."
                    rows={3}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Default Amount (₦)</FormLabel>
                  <Input
                    type="number"
                    name="defaultAmount"
                    value={formData.defaultAmount || ''}
                    onChange={handleInputChange}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </FormControl>

                <FormControl>
                  <Flex align="center">
                    <Switch
                      id="isRecurring"
                      isChecked={formData.isRecurring}
                      onChange={(e) => handleSwitchChange('isRecurring', e.target.checked)}
                      mr={3}
                      colorScheme="blue"
                    />
                    <FormLabel htmlFor="isRecurring" mb={0}>
                      This is a recurring due type
                    </FormLabel>
                  </Flex>
                </FormControl>

                <FormControl>
                  <Flex align="center">
                    <Switch
                      id="isActive"
                      isChecked={formData.isActive}
                      onChange={(e) => handleSwitchChange('isActive', e.target.checked)}
                      mr={3}
                      colorScheme="green"
                    />
                    <FormLabel htmlFor="isActive" mb={0}>
                      Active (available for assignment)
                    </FormLabel>
                  </Flex>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="outline" mr={3} onClick={handleClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={submitting}
                loadingText={editingDueType ? 'Updating...' : 'Creating...'}
              >
                {editingDueType ? 'Update' : 'Create'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </DashboardLayout>
  );
};

export default DueTypesManagementChakra;
