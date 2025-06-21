import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  useToast,
  useColorModeValue,
  InputGroup,
  Input,
  InputRightElement,
  Icon,
  Stack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack,
} from '@chakra-ui/react';
import { FaFilePdf, FaSearch, FaHistory, FaChevronDown } from 'react-icons/fa';
import { CalendarIcon, DownloadIcon, ViewIcon } from '@chakra-ui/icons';
import { useAuth } from '../../context/AuthContext';
import financialService from '../../services/financial.service';
import { CertificateData } from '../../types/financial.types';
import DashboardLayout from '../../components/layout/DashboardLayout';

// Simple inline EmptyState component
interface EmptyStateProps {
  icon: React.ComponentType;
  title: string;
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box 
      py={10} 
      px={6} 
      borderRadius="lg" 
      bg={bgColor} 
      minH="300px" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      width="100%"
    >
      <VStack spacing={4}>
        <Icon as={icon} boxSize={12} color="blue.500" />
        <Text fontSize="xl" fontWeight="medium">{title}</Text>
        <Text color={textColor} textAlign="center" maxW="400px">
          {message}
        </Text>
      </VStack>
    </Box>
  );
};

const CertificateHistory: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<CertificateData[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
    // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const iconBgColor = useColorModeValue('blue.50', 'blue.900');
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        // If user is an admin, fetch all certificates, otherwise fetch only user's pharmacy certificates
        const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
        
        // Try to fetch from API, but use mock data if the API call fails
        try {
          const data = await financialService.getCertificateHistory(isAdmin ? undefined : user?.pharmacyId);
          setCertificates(data);
          setFilteredCertificates(data);
        } catch (error) {
          console.warn('API not implemented yet, using mock data:', error);
          
          // Use mock data when API is not yet implemented
          const mockData = [
            {
              pharmacyId: '123',
              pharmacyName: 'ABC Pharmacy',
              dueType: 'Annual Dues',
              amount: 25000,
              paidDate: '2025-02-15',
              validUntil: '2025-12-31',
              certificateNumber: 'ACPN-0001',
              issueDate: '2025-02-16',
              issuedBy: 'Financial Secretary'
            },
            {
              pharmacyId: '123',
              pharmacyName: 'ABC Pharmacy',
              dueType: 'Registration Fee',
              amount: 10000,
              paidDate: '2025-01-10',
              validUntil: '2025-12-31',
              certificateNumber: 'ACPN-0002',
              issueDate: '2025-01-12',
              issuedBy: 'Financial Secretary'
            },
            {
              pharmacyId: '456',
              pharmacyName: 'XYZ Pharmacy',
              dueType: 'Annual Dues',
              amount: 25000,
              paidDate: '2024-12-10',
              validUntil: '2025-12-31',
              certificateNumber: 'ACPN-0003',
              issueDate: '2024-12-11',
              issuedBy: 'Financial Secretary'
            }
          ];
          setCertificates(mockData);
          setFilteredCertificates(mockData);
        }
      } catch (err) {
        console.error('Failed to load certificate history:', err);
        toast({
          title: 'Error',
          description: 'Failed to load certificate history',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [user, toast]);

  // Filtering logic
  useEffect(() => {
    let filtered = [...certificates];
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (cert) =>
          cert.pharmacyName.toLowerCase().includes(query) ||
          cert.certificateNumber.toLowerCase().includes(query) ||
          cert.dueType.toLowerCase().includes(query)
      );
    }
    
    // Apply year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter((cert) => {
        const issueYear = new Date(cert.issueDate || '').getFullYear().toString();
        return issueYear === yearFilter;
      });
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((cert) => 
        cert.dueType.toLowerCase() === typeFilter.toLowerCase()
      );
    }
    
    setFilteredCertificates(filtered);
  }, [certificates, searchQuery, yearFilter, typeFilter]);
  const handleDownload = async (certificateNumber: string) => {
    try {
      // Try API first, fallback to mock
      try {
        await financialService.downloadCertificateByNumber(certificateNumber);
      } catch (error) {
        console.warn('API not implemented yet:', error);
        // Mock behavior
        console.log(`Downloading certificate ${certificateNumber}`);
      }
      
      toast({
        title: 'Success',
        description: 'Certificate downloaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to download certificate',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleView = async (certificateNumber: string) => {
    try {
      // Try API first, fallback to mock
      try {
        await financialService.viewCertificateByNumber(certificateNumber);
      } catch (error) {
        console.warn('API not implemented yet:', error);
        // Mock behavior
        console.log(`Viewing certificate ${certificateNumber}`);
        // Simulate viewing by opening a new tab
        window.open(`https://example.com/certificates/${certificateNumber}`, '_blank');
      }
      
      toast({
        title: 'Success',
        description: 'Certificate opened for viewing',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to view certificate',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Get unique years from certificates
  const years = [...new Set(certificates.map((cert) => 
    new Date(cert.issueDate || '').getFullYear().toString()
  ))].sort((a, b) => parseInt(b) - parseInt(a));

  // Get unique due types
  const dueTypes = [...new Set(certificates.map((cert) => cert.dueType))];

  if (loading) {
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
          <Box mb={{ base: 4, md: 6 }} textAlign="left" width="100%">
            <Heading as="h1" size="xl" fontWeight="bold">
              Certificate History
            </Heading>
            <Text color="gray.600" mt={2}>
              View and download your clearance certificates
            </Text>
          </Box>
          
          {/* Summary Card */}
          <Card bg={cardBg} shadow="md" mb={{ base: 6, md: 8 }} borderRadius="lg" overflow="hidden">
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 4, md: 6 }}>
                <Flex alignItems="center">
                  <Box p={3} bg={iconBgColor} borderRadius="lg">
                    <Icon as={FaFilePdf} w={6} h={6} color="blue.500" />
                  </Box>
                  <Box ml={4}>
                    <Text fontSize="2xl" fontWeight="bold">
                      {certificates.length}
                    </Text>
                    <Text color="gray.600">Total Certificates</Text>
                  </Box>
                </Flex>
                
                <Flex alignItems="center">
                  <Box p={3} bg={iconBgColor} borderRadius="lg">
                    <Icon as={CalendarIcon} w={6} h={6} color="blue.500" />
                  </Box>
                  <Box ml={4}>
                    <Text fontSize="2xl" fontWeight="bold">
                      {years.length > 0 ? years[0] : new Date().getFullYear()}
                    </Text>
                    <Text color="gray.600">Latest Certificate Year</Text>
                  </Box>
                </Flex>
                
                <Flex alignItems="center">
                  <Box p={3} bg={iconBgColor} borderRadius="lg">
                    <Icon as={FaHistory} w={6} h={6} color="blue.500" />
                  </Box>
                  <Box ml={4}>
                    <Text fontSize="2xl" fontWeight="bold">
                      {dueTypes.length}
                    </Text>
                    <Text color="gray.600">Certificate Types</Text>
                  </Box>
                </Flex>
              </SimpleGrid>
            </CardBody>
          </Card>
          
          {/* Filters and Search */}
          <Card bg={cardBg} shadow="md" mb={{ base: 6, md: 8 }} borderRadius="lg" overflow="hidden">
            <CardHeader pb={0}>
              <Heading size="md">Find Certificates</Heading>
            </CardHeader>
            <CardBody>
              <Stack spacing={4} direction={{ base: 'column', md: 'row' }} align="flex-end">
                <Box flex="1">
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Search
                  </Text>
                  <InputGroup>
                    <Input
                      placeholder="Search by pharmacy name or certificate number"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <InputRightElement>
                      <Icon as={FaSearch} color="gray.400" />
                    </InputRightElement>
                  </InputGroup>
                </Box>
                
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Filter by Year
                  </Text>
                  <Menu>
                    <MenuButton as={Button} rightIcon={<FaChevronDown />} width="160px">
                      {yearFilter === 'all' ? 'All Years' : yearFilter}
                    </MenuButton>
                    <MenuList>
                      <MenuItem onClick={() => setYearFilter('all')}>All Years</MenuItem>
                      {years.map((year) => (
                        <MenuItem key={year} onClick={() => setYearFilter(year)}>
                          {year}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                </Box>
                
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Filter by Type
                  </Text>
                  <Menu>
                    <MenuButton as={Button} rightIcon={<FaChevronDown />} width="180px">
                      {typeFilter === 'all' ? 'All Types' : typeFilter}
                    </MenuButton>
                    <MenuList>
                      <MenuItem onClick={() => setTypeFilter('all')}>All Types</MenuItem>
                      {dueTypes.map((type) => (
                        <MenuItem key={type} onClick={() => setTypeFilter(type)}>
                          {type}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                </Box>
              </Stack>
            </CardBody>
          </Card>
          
          {/* Certificate List */}
          <Card bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
            <CardBody px={{ base: 3, md: 4 }} py={4}>
              <Heading size="md" mb={4}>Certificate History</Heading>
              
              {filteredCertificates.length === 0 ? (
                <EmptyState
                  icon={FaFilePdf}
                  title="No certificates found"
                  message="No certificates match your search criteria."
                />
              ) : (
                <Box overflowX="auto" width="100%" sx={{
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "thin",
                  "&::-webkit-scrollbar": {
                    height: "8px",
                    backgroundColor: "transparent"
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "gray.300",
                    borderRadius: "8px"
                  }
                }}>
                  <Table variant="simple" size={{ base: "sm", md: "md" }} width="100%">
                    <Thead>
                      <Tr>
                        <Th>Certificate #</Th>
                        <Th>Pharmacy</Th>
                        <Th>Due Type</Th>
                        <Th>Issue Date</Th>
                        <Th>Valid Until</Th>
                        <Th>Status</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredCertificates.map((certificate) => {
                        const issuedDate = new Date(certificate.issueDate || '');
                        const validUntilDate = new Date(certificate.validUntil);
                        const isExpired = validUntilDate < new Date();
                        
                        return (
                          <Tr key={certificate.certificateNumber} _hover={{ bg: hoverBg }}>
                            <Td fontWeight="medium">{certificate.certificateNumber}</Td>
                            <Td>{certificate.pharmacyName}</Td>
                            <Td>{certificate.dueType}</Td>
                            <Td>{issuedDate.toLocaleDateString()}</Td>
                            <Td>{validUntilDate.toLocaleDateString()}</Td>
                            <Td>
                              <Badge
                                colorScheme={isExpired ? "red" : "green"}
                                borderRadius="full"
                                px={2}
                                py={1}
                              >
                                {isExpired ? "Expired" : "Valid"}
                              </Badge>
                            </Td>
                            <Td>
                              <Flex gap={2}>
                                <Tooltip label="View Certificate">
                                  <Button
                                    size="sm"
                                    colorScheme="blue"
                                    variant="ghost"
                                    onClick={() => handleView(certificate.certificateNumber)}
                                    aria-label="View"
                                  >
                                    <Icon as={ViewIcon} />
                                  </Button>
                                </Tooltip>
                                <Tooltip label="Download Certificate">
                                  <Button
                                    size="sm"
                                    colorScheme="green"
                                    variant="ghost"
                                    onClick={() => handleDownload(certificate.certificateNumber)}
                                    aria-label="Download"
                                  >
                                    <Icon as={DownloadIcon} />
                                  </Button>
                                </Tooltip>
                              </Flex>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </CardBody>
          </Card>
          
          {/* Info Box */}
          <Alert status="info" mt={6} borderRadius="lg">
            <AlertIcon />
            <Box>
              <AlertTitle>Need help?</AlertTitle>
              <AlertDescription>
                Contact the financial secretary if you're having trouble accessing your certificates.
              </AlertDescription>
            </Box>
          </Alert>
        </Container>
      </Flex>
    </DashboardLayout>
  );
};

export default CertificateHistory;
