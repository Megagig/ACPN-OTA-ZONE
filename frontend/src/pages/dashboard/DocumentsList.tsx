import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  useToast,
  useColorModeValue,
  Icon,
  HStack,
  VStack,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { 
  SearchIcon, 
  DownloadIcon, 
  ViewIcon, 
  CalendarIcon,
  AttachmentIcon 
} from '@chakra-ui/icons';
import { FaFileAlt, FaFileUpload, FaFolderOpen } from 'react-icons/fa';
import documentService from '../../services/document.service';
import type { Document, DocumentCategory, DocumentAccessLevel, DocumentStatus } from '../../types/document.types';
import DashboardLayout from '../../components/layout/DashboardLayout';

const DocumentsList: React.FC = () => {
  const toast = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: undefined as DocumentCategory | undefined,
    accessLevel: undefined as DocumentAccessLevel | undefined,
    status: undefined as DocumentStatus | undefined,
  });
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.800');
  const iconBg = useColorModeValue('blue.50', 'blue.900');

  useEffect(() => {
    loadDocuments();
  }, [filters]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getDocuments(filters);
      setDocuments(response);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Error loading documents',
        description: 'There was a problem fetching documents. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      search: value,
    }));
  };
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getAccessLevelBadge = (level: DocumentAccessLevel) => {
    const colorSchemes: Record<DocumentAccessLevel, string> = {
      public: 'blue',
      members: 'green',
      committee: 'purple',
      executives: 'orange',
      admin: 'red',
    };
    
    return (
      <Badge colorScheme={colorSchemes[level]} borderRadius="full" px={2} py={0.5}>
        {level}
      </Badge>
    );
  };

  if (loading && documents.length === 0) {
    return (
      <DashboardLayout>
        <Flex direction="column" align="center" width="100%">
          <Container maxW="container.xl" p={{ base: 4, md: 6 }} width="100%">
            <Flex justify="center" align="center" width="100%" minH="50vh">
              <Spinner size="xl" thickness="4px" color="blue.600" />
            </Flex>
          </Container>
        </Flex>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Flex direction="column" align="center" width="100%">
        <Container maxW="container.xl" p={{ base: 4, md: 6 }} width="100%">
          {/* Header */}
          <Flex 
            justify="space-between" 
            align={{ base: "start", md: "center" }} 
            mb={6}
            direction={{ base: "column", md: "row" }}
            gap={{ base: 4, md: 0 }}
          >
            <Box>
              <Heading as="h1" size="xl" fontWeight="bold">
                My Documents
              </Heading>
              <Text color="gray.600" mt={1}>
                Access and manage your organization documents
              </Text>
            </Box>
            <Link to="/dashboard/documents/upload">
              <Button 
                leftIcon={<Icon as={FaFileUpload} />}
                colorScheme="blue"
                size="md"
              >
                Upload Document
              </Button>
            </Link>
          </Flex>

          {/* Filters */}
          <Card bg={cardBg} shadow="md" mb={6} borderRadius="lg" overflow="hidden">
            <CardHeader bg={headerBg} py={4}>
              <Heading size="md">Document Filters</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Search Documents
                  </Text>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search by title or description..."
                      value={filters.search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </InputGroup>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Category
                  </Text>
                  <Select
                    value={filters.category || 'all'}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="policy">Policy</option>
                    <option value="form">Form</option>
                    <option value="report">Report</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="minutes">Minutes</option>
                    <option value="guideline">Guideline</option>
                    <option value="other">Other</option>
                  </Select>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Access Level
                  </Text>
                  <Select
                    value={filters.accessLevel || 'all'}
                    onChange={(e) => handleFilterChange('accessLevel', e.target.value)}
                  >
                    <option value="all">All Access Levels</option>
                    <option value="public">Public</option>
                    <option value="members">Members</option>
                    <option value="committee">Committee</option>
                    <option value="executives">Executives</option>
                    <option value="admin">Admin</option>
                  </Select>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Status
                  </Text>
                  <Select
                    value={filters.status || 'all'}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </Select>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Loading indicator */}
          {loading && documents.length > 0 && (
            <Flex justify="center" my={4}>
              <Spinner size="md" color="blue.500" />
            </Flex>
          )}

          {/* Documents List */}
          <VStack spacing={4} align="stretch" width="100%">
            {documents.map((doc) => (
              <Card 
                key={doc._id} 
                bg={cardBg} 
                shadow="sm" 
                borderRadius="lg" 
                overflow="hidden"
                _hover={{ shadow: "md", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <CardBody p={0}>
                  <Flex 
                    direction={{ base: "column", md: "row" }}
                    justify="space-between"
                    p={4}
                  >
                    <Flex gap={4}>
                      <Flex 
                        w={12} h={12} 
                        bg={iconBg} 
                        borderRadius="lg" 
                        align="center" 
                        justify="center"
                        flexShrink={0}
                      >
                        <Icon as={FaFileAlt} boxSize={6} color="blue.500" />
                      </Flex>
                      <Box>
                        <Heading as="h3" size="md" fontWeight="semibold" mb={1}>
                          {doc.title}
                        </Heading>
                        <Text color="gray.600" fontSize="sm" mb={2} noOfLines={2}>
                          {doc.description}
                        </Text>
                        <HStack spacing={2} mt={1}>
                          <Badge colorScheme="blue" variant="subtle">
                            {doc.category}
                          </Badge>
                          {getAccessLevelBadge(doc.accessLevel)}
                          <Badge 
                            colorScheme={doc.status === 'active' ? 'green' : 'gray'} 
                            variant="subtle"
                          >
                            {doc.status}
                          </Badge>
                        </HStack>
                      </Box>
                    </Flex>
                    
                    <Flex 
                      direction={{ base: "row", md: "column" }}
                      align={{ base: "center", md: "flex-end" }}
                      justify={{ base: "space-between", md: "center" }}
                      mt={{ base: 4, md: 0 }}
                      gap={2}
                      minW={{ md: "200px" }}
                    >
                      <HStack spacing={4} mt={{ base: 0, md: 1 }} mb={{ base: 0, md: 3 }}>
                        <Flex align="center" color="gray.500" fontSize="sm">
                          <Icon as={AttachmentIcon} mr={1} />
                          {formatFileSize(doc.fileSize)}
                        </Flex>
                        <Flex align="center" color="gray.500" fontSize="sm">
                          <Icon as={CalendarIcon} mr={1} />
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </Flex>
                      </HStack>
                      
                      <HStack spacing={2}>
                        <Tooltip label="View Document">
                          <IconButton
                            aria-label="View document"
                            icon={<ViewIcon />}
                            colorScheme="blue"
                            variant="ghost"
                            size="md"
                          />
                        </Tooltip>
                        <Tooltip label="Download">
                          <IconButton
                            aria-label="Download document"
                            icon={<DownloadIcon />}
                            colorScheme="green"
                            variant="ghost"
                            size="md"
                          />
                        </Tooltip>
                      </HStack>
                    </Flex>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </VStack>

          {/* Empty state */}
          {documents.length === 0 && !loading && (
            <Card bg={cardBg} shadow="md" p={6} borderRadius="lg">
              <CardBody>
                <VStack spacing={4} py={8}>
                  <Icon as={FaFolderOpen} boxSize={12} color="gray.400" />
                  <Heading size="md" textAlign="center">No Documents Found</Heading>
                  <Text color="gray.500" textAlign="center">
                    Try adjusting your filters or upload a new document.
                  </Text>
                  <Link to="/dashboard/documents/upload">
                    <Button 
                      leftIcon={<Icon as={FaFileUpload} />}
                      colorScheme="blue"
                      mt={2}
                    >
                      Upload Document
                    </Button>
                  </Link>
                </VStack>
              </CardBody>
            </Card>
          )}
        </Container>
      </Flex>
    </DashboardLayout>
  );
};

export default DocumentsList;
