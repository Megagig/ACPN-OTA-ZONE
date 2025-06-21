import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  FormHelperText,
  Input,
  Select,
  Textarea,
  Button,
  useToast,
  Text,
  useColorModeValue,
  Grid,
  GridItem,
  Icon,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { ArrowBackIcon, AttachmentIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import documentService from '../../services/document.service';
import type {
  DocumentCategory,
  DocumentAccessLevel,
} from '../../types/document.types';

const DocumentForm: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other' as DocumentCategory,
    accessLevel: 'members' as DocumentAccessLevel,
    tags: '',
    expirationDate: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      toast({
        title: 'File required',
        description: 'Please select a file to upload',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create form data for file upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('category', formData.category);
      uploadFormData.append('accessLevel', formData.accessLevel);

      if (formData.tags) {
        uploadFormData.append('tags', formData.tags);
      }

      if (formData.expirationDate) {
        uploadFormData.append('expirationDate', formData.expirationDate);
      }

      // Upload document
      const result = await documentService.uploadDocument(uploadFormData);

      setSuccess(true);
      toast({
        title: 'Document uploaded successfully',
        description: 'Document has been uploaded successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Redirect to document detail after a short delay
      setTimeout(() => {
        navigate(`/documents/${result._id}`);
      }, 1500);
    } catch (err) {
      const errorMessage = 'Failed to upload document. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Upload failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories: DocumentCategory[] = [
    'policy',
    'form',
    'report',
    'newsletter',
    'minutes',
    'guideline',
    'other',
  ];
  const accessLevels: DocumentAccessLevel[] = [
    'public',
    'members',
    'committee',
    'executives',
    'admin',
  ];
  return (
    <Container maxW="container.lg" py={6}>
      <Card bg={bgColor} shadow="md">
        <CardHeader>
          <VStack align="start" spacing={2}>
            <Button
              as={Link}
              to="/documents/list"
              leftIcon={<ArrowBackIcon />}
              variant="link"
              colorScheme="blue"
              size="sm"
            >
              Back to Documents
            </Button>
            <Heading size="lg" color="gray.800">
              Upload New Document
            </Heading>
          </VStack>
        </CardHeader>

        <CardBody>
          {error && (
            <Alert status="error" mb={6}>
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Error</Text>
                <Text>{error}</Text>
              </Box>
            </Alert>
          )}

          {success && (
            <Alert status="success" mb={6}>
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Success!</Text>
                <Text>Document uploaded successfully. Redirecting to document details...</Text>
              </Box>
            </Alert>
          )}

          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                {/* Document Title */}
                <GridItem colSpan={2}>
                  <FormControl isRequired>
                    <FormLabel>Document Title</FormLabel>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter document title"
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
                      placeholder="Enter document description"
                    />
                  </FormControl>
                </GridItem>

                {/* Category */}
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Category</FormLabel>
                    <Select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>

                {/* Access Level */}
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Access Level</FormLabel>
                    <Select
                      name="accessLevel"
                      value={formData.accessLevel}
                      onChange={handleInputChange}
                    >
                      {accessLevels.map((level) => (
                        <option key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>

                {/* Tags */}
                <GridItem>
                  <FormControl>
                    <FormLabel>Tags</FormLabel>
                    <Input
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="Enter tags separated by commas"
                    />
                    <FormHelperText>
                      Separate tags with commas (e.g. policy, financial, annual)
                    </FormHelperText>
                  </FormControl>
                </GridItem>

                {/* Expiration Date */}
                <GridItem>
                  <FormControl>
                    <FormLabel>Expiration Date (Optional)</FormLabel>
                    <Input
                      type="date"
                      name="expirationDate"
                      value={formData.expirationDate}
                      onChange={handleInputChange}
                    />                  </FormControl>
                </GridItem>

                {/* Document File */}
                <GridItem colSpan={2}>
                  <FormControl isRequired>
                    <FormLabel>Document File</FormLabel>
                    <Box
                      p={6}
                      border="2px"
                      borderStyle="dashed"
                      borderColor={borderColor}
                      borderRadius="md"
                      textAlign="center"
                      _hover={{ borderColor: 'blue.300' }}
                      transition="border-color 0.2s"
                    >
                      {!file ? (
                        <VStack spacing={3}>
                          <Icon as={AttachmentIcon} boxSize={10} color="gray.400" />
                          <Text color="gray.500" fontSize="sm">
                            <Text as="span" color="blue.600" fontWeight="medium">
                              Upload a file
                            </Text>{' '}
                            or drag and drop
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            PDF, Word, Excel, PowerPoint or image files up to 10MB
                          </Text>
                        </VStack>
                      ) : (
                        <VStack spacing={2}>
                          <Icon as={CheckIcon} boxSize={8} color="blue.500" />
                          <Text fontWeight="medium" color="gray.700">
                            {file.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {file.size < 1024
                              ? `${file.size} B`
                              : file.size < 1048576
                              ? `${(file.size / 1024).toFixed(1)} KB`
                              : `${(file.size / 1048576).toFixed(1)} MB`}
                          </Text>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            leftIcon={<CloseIcon />}
                            onClick={() => setFile(null)}
                          >
                            Remove file
                          </Button>
                        </VStack>
                      )}
                    </Box>
                    <Button
                      as="label"
                      mt={3}
                      w="full"
                      variant="outline"
                      cursor="pointer"
                      leftIcon={<AttachmentIcon />}
                    >
                      Select File
                      <Box as="input" type="file" hidden onChange={handleFileChange} required={!file} />
                    </Button>
                  </FormControl>
                </GridItem>
              </Grid>

              {/* Action Buttons */}
              <HStack spacing={4} justify="flex-end" pt={4}>
                <Button
                  as={Link}
                  to="/documents/list"
                  variant="outline"
                  colorScheme="gray"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={loading || success}
                  loadingText={loading ? "Uploading..." : "Uploaded"}
                  leftIcon={success ? <CheckIcon /> : <AttachmentIcon />}
                  isDisabled={loading || success}
                >
                  {success ? 'Uploaded' : 'Upload Document'}
                </Button>
              </HStack>
            </VStack>
          </Box>
        </CardBody>
      </Card>
    </Container>
  );
};

export default DocumentForm;
