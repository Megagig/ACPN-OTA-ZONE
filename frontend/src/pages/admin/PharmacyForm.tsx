import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Text,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
} from '@chakra-ui/react';

const PharmacyForm: React.FC = () => {
  const toast = useToast();

  // State variables
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    licenseNumber: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation would go here
    toast({
      title: 'Success',
      description: 'Pharmacy form submitted successfully',
      status: 'success',
    });
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Text fontSize="2xl" fontWeight="bold">
          Pharmacy Form
        </Text>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Pharmacy Name</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter pharmacy name"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Address</FormLabel>
              <Textarea
                name="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter pharmacy address"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Phone Number</FormLabel>
              <Input
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>License Number</FormLabel>
              <Input
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="Enter license number"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Owner Name</FormLabel>
              <Input
                name="ownerName"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="Enter owner name"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Owner Phone</FormLabel>
              <Input
                name="ownerPhone"
                value={formData.ownerPhone}
                onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                placeholder="Enter owner phone"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Owner Email</FormLabel>
              <Input
                name="ownerEmail"
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                placeholder="Enter owner email"
              />
            </FormControl>
            <Button type="submit" colorScheme="blue" width="full">
              Submit
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default PharmacyForm;
