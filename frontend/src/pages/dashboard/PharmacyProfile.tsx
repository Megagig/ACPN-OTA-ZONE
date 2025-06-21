import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Icon,
  Text,
  useColorModeValue,
  Spinner,
  VStack,
  HStack,
  Badge,
  Divider,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  LinkBox,
  LinkOverlay,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  EditIcon,
  ExternalLinkIcon,
  WarningIcon,
  CheckCircleIcon,
} from '@chakra-ui/icons';
import {
  FaStore,
  FaFileAlt,
  FaCreditCard,
  FaCalendarAlt,
  FaFacebookSquare,
  FaTwitterSquare,
  FaInstagramSquare,
} from 'react-icons/fa';
import pharmacyService from '../../services/pharmacy.service';
import type { Pharmacy } from '../../types/pharmacy.types';

const PharmacyProfile: React.FC = () => {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const iconBg = useColorModeValue('blue.100', 'blue.900');
  const linkHoverBg = useColorModeValue('gray.100', 'gray.700');

  useEffect(() => {
    const fetchPharmacy = async () => {
      try {
        setLoading(true);
        const data = await pharmacyService.getPharmacyByUser();
        setPharmacy(data);
      } catch (err) {
        setError('Failed to load pharmacy profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacy();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="64">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color="gray.500">Loading pharmacy profile...</Text>
        </VStack>
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert
        status="error"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        height="200px"
        borderRadius="md"
        my={4}
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          Error
        </AlertTitle>
        <AlertDescription maxWidth="sm">
          {error}
          <Button
            mt={4}
            colorScheme="red"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!pharmacy) {
    return (
      <Container maxW="container.xl" py={6} px={4}>
        <Box textAlign="center">
          <Card bg={cardBg} shadow="md" p={6}>
            <CardBody>
              <VStack spacing={4}>
                <Icon as={FaStore} fontSize="5xl" color="gray.400" />
                <Heading size="lg">No Pharmacy Profile Found</Heading>
                <Text color="gray.500" mb={4}>
                  You haven't registered a pharmacy yet. Create a pharmacy profile
                  to manage your pharmacy details.
                </Text>
                <Button
                  as={Link}
                  to="/my-pharmacy/create"
                  colorScheme="blue"
                  leftIcon={<Icon as={EditIcon} />}
                >
                  Register Pharmacy
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={6} px={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Pharmacy Profile</Heading>
        <Button
          as={Link}
          to="/my-pharmacy/edit"
          colorScheme="blue"
          leftIcon={<Icon as={EditIcon} />}
        >
          Edit Profile
        </Button>
      </Flex>

      {/* Approval Status */}
      {pharmacy.registrationStatus === 'pending' && (
        <Alert status="warning" mb={6} borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle fontWeight="bold">Awaiting Approval</AlertTitle>
            <AlertDescription>
              Your pharmacy profile is pending approval by the administrator. Some features
              may be limited until your pharmacy is approved.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      <Card bg={cardBg} shadow="md" mb={6} overflow="hidden">
        {/* Pharmacy Header */}
        <Box p={6} bg={headerBg} borderBottomWidth="1px" borderColor={borderColor}>
          <Flex direction={{ base: 'column', md: 'row' }} alignItems={{ md: 'center' }}>
            <Flex 
              alignItems="center" 
              justifyContent="center" 
              h="24" 
              w="24" 
              borderRadius="full" 
              bg={iconBg} 
              color="blue.500" 
              fontSize="3xl"
              mb={{ base: 4, md: 0 }}
            >
              <Icon as={FaStore} />
            </Flex>
            <Box ml={{ md: 6 }}>
              <Heading size="lg" mb={1}>{pharmacy.name}</Heading>
              <Text color="gray.600" mb={1}>{pharmacy.address}</Text>
              <Text color="gray.600">{pharmacy.landmark}, {pharmacy.townArea}</Text>
              <HStack mt={2} spacing={2}>
                <Badge 
                  colorScheme={pharmacy.registrationStatus === 'active' ? 'green' : 'gray'}
                  px={2} 
                  py={1} 
                  borderRadius="full"
                >
                  {pharmacy.registrationStatus === 'active' ? 'Active' : 'Inactive'}
                </Badge>
                <Badge 
                  colorScheme={pharmacy.registrationStatus === 'active' ? 'green' : 'yellow'}
                  px={2} 
                  py={1} 
                  borderRadius="full"
                >
                  {pharmacy.registrationStatus === 'active' ? 'Approved' : 'Pending Approval'}
                </Badge>
              </HStack>
            </Box>
          </Flex>
        </Box>

        {/* Pharmacy Details */}
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Box>
              <Heading size="md" mb={4}>Registration Details</Heading>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">Registration Number</Text>
                  <Text>{pharmacy.registrationNumber}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">PCN License Number</Text>
                  <Text>{pharmacy.pcnLicense}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">License Expiry Date</Text>
                  <Text>{formatDate(pharmacy.licenseExpiryDate)}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">Director</Text>
                  <Text>{pharmacy.directorName}</Text>
                </Box>
                {pharmacy.superintendentName && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.500">Superintendent Pharmacist</Text>
                    <Text>{pharmacy.superintendentName}</Text>
                  </Box>
                )}
                {pharmacy.superintendentLicenseNumber && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.500">Superintendent License Number</Text>
                    <Text>{pharmacy.superintendentLicenseNumber}</Text>
                  </Box>
                )}
                {pharmacy.numberOfStaff !== undefined && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.500">Staff Count</Text>
                    <Text>{pharmacy.numberOfStaff}</Text>
                  </Box>
                )}
              </VStack>
            </Box>

            <Box>
              <Heading size="md" mb={4}>Contact Information</Heading>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">Phone Number</Text>
                  <Text>{pharmacy.phone}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">Email</Text>
                  <Text>{pharmacy.email}</Text>
                </Box>
                {pharmacy.websiteUrl && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.500">Website</Text>
                    <Link 
                      to={pharmacy.websiteUrl} 
                      color="blue.500" 
                      _hover={{ textDecoration: 'underline' }}
                      display="inline-flex"
                      alignItems="center"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {pharmacy.websiteUrl} <Icon as={ExternalLinkIcon} ml={1} />
                    </Link>
                  </Box>
                )}
                {pharmacy.socialMedia && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={1}>Social Media</Text>
                    <HStack spacing={2}>
                      {pharmacy.socialMedia.facebookUrl && (
                        <Link 
                          to={pharmacy.socialMedia.facebookUrl} 
                          color="blue.600" 
                          _hover={{ color: 'blue.800' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Icon as={FaFacebookSquare} fontSize="xl" />
                        </Link>
                      )}
                      {pharmacy.socialMedia.twitterUrl && (
                        <Link 
                          to={pharmacy.socialMedia.twitterUrl} 
                          color="blue.400" 
                          _hover={{ color: 'blue.600' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Icon as={FaTwitterSquare} fontSize="xl" />
                        </Link>
                      )}
                      {pharmacy.socialMedia.instagramUrl && (
                        <Link 
                          to={pharmacy.socialMedia.instagramUrl} 
                          color="pink.500" 
                          _hover={{ color: 'pink.700' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Icon as={FaInstagramSquare} fontSize="xl" />
                        </Link>
                      )}
                    </HStack>
                  </Box>
                )}
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Additional Information */}
          {(pharmacy.yearEstablished ||
            pharmacy.operatingHours ||
            (pharmacy.servicesOffered &&
              pharmacy.servicesOffered.length > 0)) && (
            <Box mt={6}>
              <Heading size="md" mb={4}>Additional Information</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {pharmacy.yearEstablished && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.500">Established Year</Text>
                    <Text>{pharmacy.yearEstablished}</Text>
                  </Box>
                )}
                {pharmacy.operatingHours && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.500">Operating Hours</Text>
                    <Text>{pharmacy.operatingHours}</Text>
                  </Box>
                )}
                {pharmacy.servicesOffered && pharmacy.servicesOffered.length > 0 && (
                  <Box gridColumn={{ md: 'span 2' }}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>Services Offered</Text>
                    <Flex wrap="wrap" gap={2}>
                      {pharmacy.servicesOffered.map((service, index) => (
                        <Badge 
                          key={index} 
                          px={2} 
                          py={1} 
                          colorScheme="blue" 
                          borderRadius="full"
                          fontSize="xs"
                        >
                          {service}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                )}
              </SimpleGrid>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Quick Actions */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <LinkBox as={Card} bg={cardBg} shadow="md" _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} transition="all 0.2s">
          <CardBody display="flex" flexDir="column" alignItems="center" textAlign="center">
            <Icon as={FaFileAlt} fontSize="3xl" color="blue.500" mb={3} />
            <Heading size="md" mb={1}>
              <LinkOverlay as={Link} to="/my-documents">
                My Documents
              </LinkOverlay>
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Access and manage pharmacy-related documents
            </Text>
          </CardBody>
        </LinkBox>

        <LinkBox as={Card} bg={cardBg} shadow="md" _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} transition="all 0.2s">
          <CardBody display="flex" flexDir="column" alignItems="center" textAlign="center">
            <Icon as={FaCreditCard} fontSize="3xl" color="green.500" mb={3} />
            <Heading size="md" mb={1}>
              <LinkOverlay as={Link} to="/payments">
                Dues & Payments
              </LinkOverlay>
            </Heading>
            <Text color="gray.500" fontSize="sm">
              View and pay outstanding dues
            </Text>
          </CardBody>
        </LinkBox>

        <LinkBox as={Card} bg={cardBg} shadow="md" _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} transition="all 0.2s">
          <CardBody display="flex" flexDir="column" alignItems="center" textAlign="center">
            <Icon as={FaCalendarAlt} fontSize="3xl" color="orange.500" mb={3} />
            <Heading size="md" mb={1}>
              <LinkOverlay as={Link} to="/events">
                Events
              </LinkOverlay>
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Register for upcoming events and trainings
            </Text>
          </CardBody>
        </LinkBox>
      </SimpleGrid>
    </Container>
  );
};

export default PharmacyProfile;
