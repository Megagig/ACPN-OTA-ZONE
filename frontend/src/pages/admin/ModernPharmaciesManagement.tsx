import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,  useColorModeValue,
  useToast,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Input,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  InputGroup,
  InputLeftElement,
  Divider,
  Flex,
  Container,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiMoreVertical,
  FiMapPin,
  FiPhone,
  FiMail,
  FiSearch,
  FiDownload,
  FiRefreshCw,  FiEye,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import pharmacyService from '../../services/pharmacy.service';
import type { Pharmacy, PharmacyStats } from '../../types/pharmacy.types';

const MotionBox = motion(Box);

const ModernPharmaciesManagement: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [stats, setStats] = useState<PharmacyStats>({
    totalPharmacies: 0,
    activePharmacies: 0,
    pendingApproval: 0,
    recentlyAdded: 0,
    duesCollected: 0,
    duesOutstanding: 0,
  });
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Color mode values
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');

  // Modal controls
  const { isOpen: isViewModalOpen, onOpen: onViewModalOpen, onClose: onViewModalClose } = useDisclosure();

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pharmaciesData, statsData] = await Promise.all([
        pharmacyService.getPharmacies(),
        pharmacyService.getPharmacyStats(),
      ]);

      setPharmacies(pharmaciesData?.pharmacies || []);
      setStats(statsData || {
        totalPharmacies: 0,
        activePharmacies: 0,
        pendingApproval: 0,
        recentlyAdded: 0,
        duesCollected: 0,
        duesOutstanding: 0,
      });
    } catch (error) {
      console.error('Error loading pharmacies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pharmacies data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter pharmacies
  const filteredPharmacies = pharmacies.filter((pharmacy) => {
    const matchesSearch = 
      pharmacy.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pharmacy as any).ownerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || (pharmacy as any).status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  // Handle pharmacy approval
  const handleApprovePharmacy = async (pharmacyId: string) => {
    try {
      await pharmacyService.approvePharmacy(pharmacyId);
      setPharmacies(prev => prev.map(p => 
        p._id === pharmacyId ? { ...p, status: 'active' } : p
      ));
      toast({
        title: 'Success',
        description: 'Pharmacy approved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadData(); // Refresh stats
    } catch (error: any) {
      console.error('Error approving pharmacy:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve pharmacy',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  // Handle pharmacy suspension
  const handleSuspendPharmacy = async (pharmacyId: string) => {
    if (!confirm('Are you sure you want to suspend this pharmacy?')) return;

    try {
      await pharmacyService.updatePharmacy(pharmacyId, { status: 'suspended' } as any);
      setPharmacies(prev => prev.map(p => 
        p._id === pharmacyId ? { ...p, status: 'suspended' } : p
      ));
      toast({
        title: 'Success',
        description: 'Pharmacy suspended successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadData(); // Refresh stats
    } catch (error: any) {
      console.error('Error suspending pharmacy:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to suspend pharmacy',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  // Handle pharmacy deletion
  const handleDeletePharmacy = async (pharmacyId: string) => {
    if (!confirm('Are you sure you want to delete this pharmacy? This action cannot be undone.')) return;

    try {
      await pharmacyService.deletePharmacy(pharmacyId);
      setPharmacies(prev => prev.filter(p => p._id !== pharmacyId));
      toast({
        title: 'Success',
        description: 'Pharmacy deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadData(); // Refresh stats
    } catch (error: any) {
      console.error('Error deleting pharmacy:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete pharmacy',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const openViewModal = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    onViewModalOpen();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'pending': return 'yellow';
      case 'suspended': return 'red';
      case 'expired': return 'orange';      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <Box bg={bg} minH="100vh" p={6}>
        <VStack spacing={4} align="center" justify="center" minH="400px">
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text color={textColor}>Loading pharmacies...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box bg={bg} minH="100vh" p={6}>
      <Container maxW="7xl">
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <VStack spacing={6} align="stretch">
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <Box>
                <Heading size="lg" color={headingColor} mb={2}>
                  Pharmacies Management
                </Heading>
                <Text color={textColor}>
                  Manage and monitor registered pharmacies
                </Text>
              </Box>
              <HStack spacing={3}>
                <Button
                  leftIcon={<FiRefreshCw />}
                  variant="outline"
                  onClick={loadData}
                  isLoading={loading}
                >
                  Refresh
                </Button>
                <Button
                  leftIcon={<FiDownload />}
                  variant="outline"
                  colorScheme="gray"
                >
                  Export
                </Button>
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="brand"
                  onClick={() => navigate('/admin/pharmacies/create')}
                >
                  Add Pharmacy
                </Button>
              </HStack>
            </Flex>

            {/* Statistics Cards */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Total Pharmacies</StatLabel>
                    <StatNumber>{stats.totalPharmacies}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      Registered
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Active</StatLabel>
                    <StatNumber color="green.500">{stats.activePharmacies}</StatNumber>
                    <StatHelpText>
                      {stats.totalPharmacies > 0 ? Math.round((stats.activePharmacies / stats.totalPharmacies) * 100) : 0}% of total
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Pending Approval</StatLabel>
                    <StatNumber color="yellow.500">{stats.pendingApproval}</StatNumber>
                    <StatHelpText>Awaiting review</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Recently Added</StatLabel>
                    <StatNumber color="blue.500">{stats.recentlyAdded}</StatNumber>
                    <StatHelpText>Last 30 days</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Filters */}
            <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
              <CardBody>
                <HStack spacing={4} wrap="wrap">
                  <InputGroup maxW="300px">
                    <InputLeftElement>
                      <FiSearch />
                    </InputLeftElement>
                    <Input
                      placeholder="Search pharmacies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>

                  <Select
                    maxW="200px"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                    <option value="expired">Expired</option>
                  </Select>

                  {(searchTerm || statusFilter !== 'all') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </HStack>
              </CardBody>
            </Card>

            {/* Pharmacies Table */}
            <Card bg={cardBg} shadow="sm" borderColor={borderColor}>
              <CardHeader>
                <Heading size="md" color={headingColor}>
                  Pharmacies List ({filteredPharmacies.length})
                </Heading>
              </CardHeader>
              <CardBody>
                {filteredPharmacies.length === 0 ? (
                  <VStack spacing={4} py={8}>
                    <Text color={textColor} textAlign="center">
                      No pharmacies found matching your criteria
                    </Text>
                    <Button
                      leftIcon={<FiPlus />}
                      colorScheme="brand"
                      onClick={() => navigate('/admin/pharmacies/create')}
                    >
                      Add First Pharmacy
                    </Button>
                  </VStack>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Pharmacy</Th>
                          <Th>Owner</Th>
                          <Th>Contact</Th>
                          <Th>Status</Th>
                          <Th>Registration Date</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredPharmacies.map((pharmacy) => (
                          <Tr key={pharmacy._id}>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">{pharmacy.name}</Text>
                                <Text fontSize="sm" color={textColor} noOfLines={1}>
                                  <FiMapPin style={{ display: 'inline', marginRight: '4px' }} />
                                  {pharmacy.address}
                                </Text>
                                {pharmacy.registrationNumber && (
                                  <Text fontSize="xs" color={textColor}>
                                    Reg: {pharmacy.registrationNumber}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">{(pharmacy as any).ownerName || 'N/A'}</Text>
                                {pharmacy.pcnLicense && (
                                  <Text fontSize="sm" color={textColor}>
                                    PCN: {pharmacy.pcnLicense}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                {pharmacy.phone && (
                                  <Text fontSize="sm">
                                    <FiPhone style={{ display: 'inline', marginRight: '4px' }} />
                                    {pharmacy.phone}
                                  </Text>
                                )}
                                {pharmacy.email && (
                                  <Text fontSize="sm" color={textColor}>
                                    <FiMail style={{ display: 'inline', marginRight: '4px' }} />
                                    {pharmacy.email}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <Badge                                colorScheme={getStatusColor((pharmacy as any).status || 'pending')}
                                variant="subtle"
                                textTransform="capitalize"
                              >
                                {(pharmacy as any).status || 'pending'}
                              </Badge>
                            </Td>
                            <Td>
                              <Text>
                                {pharmacy.createdAt 
                                  ? new Date(pharmacy.createdAt).toLocaleDateString()
                                  : 'N/A'
                                }
                              </Text>
                            </Td>
                            <Td>
                              <Menu>
                                <MenuButton
                                  as={IconButton}
                                  aria-label="More actions"
                                  icon={<FiMoreVertical />}
                                  variant="ghost"
                                  size="sm"
                                />
                                <MenuList>
                                  <MenuItem
                                    icon={<FiEye />}
                                    onClick={() => openViewModal(pharmacy)}
                                  >
                                    View Details
                                  </MenuItem>
                                  <MenuItem
                                    icon={<FiEdit2 />}
                                    onClick={() => navigate(`/admin/pharmacies/${pharmacy._id}/edit`)}
                                  >
                                    Edit
                                  </MenuItem>
                                  {(pharmacy as any).status === 'pending' && (
                                    <MenuItem
                                      icon={<FiCheckCircle />}
                                      onClick={() => handleApprovePharmacy(pharmacy._id)}
                                      color="green.600"
                                    >
                                      Approve
                                    </MenuItem>
                                  )}
                                  {(pharmacy as any).status === 'active' && (
                                    <MenuItem
                                      icon={<FiAlertCircle />}
                                      onClick={() => handleSuspendPharmacy(pharmacy._id)}
                                      color="orange.600"
                                    >
                                      Suspend
                                    </MenuItem>
                                  )}
                                  <Divider />
                                  <MenuItem
                                    icon={<FiTrash2 />}
                                    onClick={() => handleDeletePharmacy(pharmacy._id)}
                                    color="red.600"
                                  >
                                    Delete
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </CardBody>
            </Card>
          </VStack>
        </MotionBox>

        {/* View Pharmacy Modal */}
        <Modal isOpen={isViewModalOpen} onClose={onViewModalClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Pharmacy Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedPharmacy && (
                <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Pharmacy Name</Text>
                      <Text fontWeight="semibold">{selectedPharmacy.name}</Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Status</Text>
                      <Badge                        colorScheme={getStatusColor((selectedPharmacy as any).status || 'pending')}
                        variant="subtle"
                        textTransform="capitalize"
                      >
                        {(selectedPharmacy as any).status || 'pending'}
                      </Badge>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Owner Name</Text>
                      <Text>{(selectedPharmacy as any).ownerName || 'N/A'}</Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>PCN License</Text>
                      <Text>{selectedPharmacy.pcnLicense || 'Not provided'}</Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Phone</Text>
                      <Text>{selectedPharmacy.phone || 'Not provided'}</Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Email</Text>
                      <Text>{selectedPharmacy.email || 'Not provided'}</Text>
                    </Box>
                  </SimpleGrid>

                  <Box>
                    <Text fontSize="sm" color={textColor} mb={1}>Address</Text>
                    <Text>{selectedPharmacy.address}</Text>
                  </Box>

                  {selectedPharmacy.registrationNumber && (
                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Registration Number</Text>
                      <Text>{selectedPharmacy.registrationNumber}</Text>
                    </Box>
                  )}

                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Registration Date</Text>
                      <Text>
                        {selectedPharmacy.createdAt 
                          ? new Date(selectedPharmacy.createdAt).toLocaleDateString()
                          : 'N/A'
                        }
                      </Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>Last Updated</Text>
                      <Text>
                        {selectedPharmacy.updatedAt 
                          ? new Date(selectedPharmacy.updatedAt).toLocaleDateString()
                          : 'N/A'
                        }
                      </Text>
                    </Box>
                  </SimpleGrid>
                </VStack>
              )}
            </ModalBody>

            <ModalFooter>
              <Button onClick={onViewModalClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default ModernPharmaciesManagement;
