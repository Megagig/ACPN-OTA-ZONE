import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  Icon,
  Image,
  useColorModeValue,
  Stack,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  IconButton,
  Link,
  Divider,
  Center,
  Avatar,
  useBreakpointValue,
} from '@chakra-ui/react';
import { 
  FaShieldAlt, 
  FaUsers, 
  FaClock, 
  FaStar, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt,
  FaChevronRight,
  FaArrowRight,
  FaCheckCircle,
  FaBars
} from 'react-icons/fa';
import ThemeToggle from '../components/ui/ThemeToggle';

const LandingPage: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Navigation */}
      <Box 
        bg={bg} 
        borderBottom="1px" 
        borderColor={borderColor}
        position="fixed" 
        w="full" 
        top={0} 
        zIndex={50}
        backdropFilter="blur(10px)"
        backgroundColor={useColorModeValue('rgba(255,255,255,0.8)', 'rgba(26,32,44,0.8)')}
      >
        <Container maxW="7xl">
          <Flex h={16} alignItems="center" justifyContent="space-between">
            {/* Logo */}
            <HStack spacing={2}>
              <Image 
                src="/acpn-ota-zone-logo.svg" 
                alt="ACPN OTA Zone" 
                h={10}
                fallback={<Box w={10} h={10} bg="blue.500" borderRadius="md" />}
              />
              <Heading size="lg" fontWeight="bold">ACPN OTA Zone</Heading>
            </HStack>

            {/* Desktop Navigation */}
            <HStack as="nav" spacing={8} display={{ base: 'none', md: 'flex' }}>
              <Link href="#features" _hover={{ color: 'blue.500' }}>Features</Link>
              <Link href="#about" _hover={{ color: 'blue.500' }}>About</Link>
              <Link href="#testimonials" _hover={{ color: 'blue.500' }}>Testimonials</Link>
              <Link href="#contact" _hover={{ color: 'blue.500' }}>Contact</Link>
            </HStack>

            {/* Auth Buttons + Theme Toggle */}
            <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
              <ThemeToggle />
              <Button 
                as={RouterLink} 
                to="/login" 
                variant="ghost"
                _hover={{ color: 'blue.500' }}
              >
                Sign In
              </Button>
              <Button 
                as={RouterLink} 
                to="/register" 
                colorScheme="blue"
                size={buttonSize}
                rightIcon={<Icon as={FaChevronRight} />}
              >
                Get Started
              </Button>
            </HStack>

            {/* Mobile menu button */}
            <IconButton
              aria-label="Open menu"
              icon={<FaBars />}
              onClick={onOpen}
              display={{ base: 'flex', md: 'none' }}
              variant="ghost"
            />
          </Flex>
        </Container>

        {/* Mobile Drawer */}
        <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Menu</DrawerHeader>            <DrawerBody>
              <VStack spacing={4} align="stretch">
                <Link href="#features" onClick={onClose}>Features</Link>
                <Link href="#about" onClick={onClose}>About</Link>
                <Link href="#testimonials" onClick={onClose}>Testimonials</Link>
                <Link href="#contact" onClick={onClose}>Contact</Link>
                <Divider />
                <HStack justifyContent="space-between" alignItems="center">
                  <Text>Theme</Text>
                  <ThemeToggle size="sm" />
                </HStack>
                <Divider />
                <Button as={RouterLink} to="/login" variant="ghost" onClick={onClose}>
                  Sign In
                </Button>
                <Button as={RouterLink} to="/register" colorScheme="blue" onClick={onClose}>
                  Get Started
                </Button>
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Box>

      {/* Hero Section */}
      <Box pt={20} pb={16}>
        <Container maxW="7xl">
          <VStack spacing={8} textAlign="center">
            <Heading 
              size="3xl" 
              fontWeight="bold"
              bgGradient="linear(to-r, blue.400, blue.600)"
              bgClip="text"
              lineHeight="shorter"
            >
              Welcome to ACPN OTA Zone
            </Heading>
            <Text fontSize="xl" color={textColor} maxW="3xl" lineHeight="tall">
              Your comprehensive platform for managing continuing professional development, 
              tracking requirements, and staying connected with the pharmacy community.
            </Text>
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
              <Button 
                as={RouterLink} 
                to="/register" 
                colorScheme="blue"
                size="lg"
                rightIcon={<Icon as={FaChevronRight} />}
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                transition="all 0.2s"
              >
                Get Started Today
              </Button>
              <Button 
                as={RouterLink} 
                to="/login" 
                size="lg"
                variant="outline"
                rightIcon={<Icon as={FaArrowRight} />}
                _hover={{ transform: 'translateY(-2px)' }}
                transition="all 0.2s"
              >
                Sign In
              </Button>
            </Stack>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" py={16} bg={bg}>
        <Container maxW="7xl">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Heading size="xl">Powerful Features for Pharmacy Professionals</Heading>
              <Text fontSize="lg" color={textColor} maxW="2xl">
                Everything you need to manage your professional development and stay compliant.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="full">
              {/* Feature 1 */}
              <Box 
                p={8} 
                borderRadius="2xl" 
                bg={useColorModeValue('blue.50', 'blue.900')}
                border="1px"
                borderColor={useColorModeValue('blue.100', 'blue.700')}
                _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                transition="all 0.3s"
              >
                <VStack align="start" spacing={4}>
                  <Center 
                    w={12} 
                    h={12} 
                    bg="blue.500" 
                    borderRadius="xl" 
                    color="white"                  >
                    <Icon as={FaShieldAlt} boxSize={6} />
                  </Center>
                  <Heading size="md">Secure Platform</Heading>
                  <Text color={textColor}>
                    Your data is protected with enterprise-grade security measures and encryption.
                  </Text>
                </VStack>
              </Box>

              {/* Feature 2 */}
              <Box 
                p={8} 
                borderRadius="2xl" 
                bg={useColorModeValue('green.50', 'green.900')}
                border="1px"
                borderColor={useColorModeValue('green.100', 'green.700')}
                _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                transition="all 0.3s"
              >
                <VStack align="start" spacing={4}>
                  <Center 
                    w={12} 
                    h={12} 
                    bg="green.500" 
                    borderRadius="xl" 
                    color="white"
                  >
                    <Icon as={FaUsers} boxSize={6} />
                  </Center>
                  <Heading size="md">Community Driven</Heading>
                  <Text color={textColor}>
                    Connect with fellow pharmacy professionals and share knowledge and experiences.
                  </Text>
                </VStack>
              </Box>

              {/* Feature 3 */}
              <Box 
                p={8} 
                borderRadius="2xl" 
                bg={useColorModeValue('purple.50', 'purple.900')}
                border="1px"
                borderColor={useColorModeValue('purple.100', 'purple.700')}
                _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                transition="all 0.3s"
              >
                <VStack align="start" spacing={4}>
                  <Center 
                    w={12} 
                    h={12} 
                    bg="purple.500" 
                    borderRadius="xl" 
                    color="white"
                  >
                    <Icon as={FaClock} boxSize={6} />
                  </Center>
                  <Heading size="md">24/7 Access</Heading>
                  <Text color={textColor}>
                    Access your account and manage your professional development anytime, anywhere.
                  </Text>
                </VStack>
              </Box>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* About Section */}
      <Box id="about" py={16} bg={useColorModeValue('gray.50', 'gray.800')}>
        <Container maxW="7xl">
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={12} alignItems="center">
            <VStack align="start" spacing={6}>
              <Heading size="xl">About ACPN OTA Zone</Heading>
              <Text fontSize="lg" color={textColor} lineHeight="tall">
                ACPN OTA Zone is the premier platform for pharmacy professionals in Nigeria, 
                providing comprehensive tools for continuing professional development, 
                compliance tracking, and professional networking.
              </Text>
              <VStack align="start" spacing={4}>
                <HStack align="start">
                  <Icon as={FaCheckCircle} color="green.500" mt={1} />
                  <VStack align="start" spacing={1}>
                    <Heading size="sm">Professional Development</Heading>
                    <Text color={textColor}>Track your CPD hours and manage your professional growth.</Text>
                  </VStack>
                </HStack>
                <HStack align="start">
                  <Icon as={FaCheckCircle} color="green.500" mt={1} />
                  <VStack align="start" spacing={1}>
                    <Heading size="sm">Compliance Management</Heading>
                    <Text color={textColor}>Stay up-to-date with regulatory requirements and deadlines.</Text>
                  </VStack>
                </HStack>
                <HStack align="start">
                  <Icon as={FaCheckCircle} color="green.500" mt={1} />
                  <VStack align="start" spacing={1}>
                    <Heading size="sm">Community Network</Heading>
                    <Text color={textColor}>Connect with peers and industry experts nationwide.</Text>
                  </VStack>
                </HStack>
              </VStack>
            </VStack>

            <Box p={8} bg={bg} borderRadius="2xl" boxShadow="xl">
              <SimpleGrid columns={2} spacing={6} textAlign="center">
                <VStack>
                  <Heading size="2xl" color="blue.500">5000+</Heading>
                  <Text color={textColor}>Active Members</Text>
                </VStack>
                <VStack>
                  <Heading size="2xl" color="green.500">98%</Heading>
                  <Text color={textColor}>Satisfaction Rate</Text>
                </VStack>
                <VStack>
                  <Heading size="2xl" color="purple.500">24/7</Heading>
                  <Text color={textColor}>Support Available</Text>
                </VStack>
                <VStack>
                  <Heading size="2xl" color="orange.500">3+</Heading>
                  <Text color={textColor}>Years of Service</Text>
                </VStack>
              </SimpleGrid>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box id="testimonials" py={16} bg={bg}>
        <Container maxW="7xl">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Heading size="xl">What Our Members Say</Heading>
              <Text fontSize="lg" color={textColor} maxW="2xl">
                Hear from pharmacy professionals who have transformed their practice with ACPN OTA Zone.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="full">
              {/* Testimonial 1 */}
              <Box 
                p={8} 
                borderRadius="2xl" 
                bg={useColorModeValue('blue.50', 'blue.900')}
                border="1px"
                borderColor={useColorModeValue('blue.100', 'blue.700')}
                _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                transition="all 0.3s"
              >
                <VStack align="start" spacing={4}>
                  <HStack>
                    {[...Array(5)].map((_, i) => (
                      <Icon key={i} as={FaStar} color="yellow.400" />
                    ))}
                  </HStack>
                  <Text color={textColor} lineHeight="tall">
                    "ACPN OTA Zone has revolutionized how I manage my professional development. 
                    The platform is intuitive and comprehensive."
                  </Text>
                  <HStack>
                    <Avatar 
                      name="Adaora Saliu" 
                      bg="blue.500" 
                      color="white"
                      size="md"
                    />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="semibold">Dr. Adaora Saliu</Text>
                      <Text fontSize="sm" color={textColor}>Community Pharmacist</Text>
                    </VStack>
                  </HStack>
                </VStack>
              </Box>

              {/* Testimonial 2 */}
              <Box 
                p={8} 
                borderRadius="2xl" 
                bg={useColorModeValue('green.50', 'green.900')}
                border="1px"
                borderColor={useColorModeValue('green.100', 'green.700')}
                _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                transition="all 0.3s"
              >
                <VStack align="start" spacing={4}>
                  <HStack>
                    {[...Array(5)].map((_, i) => (
                      <Icon key={i} as={FaStar} color="yellow.400" />
                    ))}
                  </HStack>
                  <Text color={textColor} lineHeight="tall">
                    "The networking opportunities and professional resources available 
                    through this platform are unmatched."
                  </Text>
                  <HStack>
                    <Avatar 
                      name="Biodun Okonkwo" 
                      bg="green.500" 
                      color="white"
                      size="md"
                    />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="semibold">Pharm. Biodun Okonkwo</Text>
                      <Text fontSize="sm" color={textColor}>Hospital Pharmacist</Text>
                    </VStack>
                  </HStack>
                </VStack>
              </Box>

              {/* Testimonial 3 */}
              <Box 
                p={8} 
                borderRadius="2xl" 
                bg={useColorModeValue('purple.50', 'purple.900')}
                border="1px"
                borderColor={useColorModeValue('purple.100', 'purple.700')}
                _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                transition="all 0.3s"
              >
                <VStack align="start" spacing={4}>
                  <HStack>
                    {[...Array(5)].map((_, i) => (
                      <Icon key={i} as={FaStar} color="yellow.400" />
                    ))}
                  </HStack>
                  <Text color={textColor} lineHeight="tall">
                    "Finally, a platform that understands the unique needs of pharmacy 
                    professionals in Nigeria. Highly recommended!"
                  </Text>
                  <HStack>
                    <Avatar 
                      name="Funmi Ibrahim" 
                      bg="purple.500" 
                      color="white"
                      size="md"
                    />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="semibold">Dr. Funmi Ibrahim</Text>
                      <Text fontSize="sm" color={textColor}>Clinical Pharmacist</Text>
                    </VStack>
                  </HStack>
                </VStack>
              </Box>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={16} bgGradient="linear(to-r, blue.500, blue.600)">
        <Container maxW="7xl">
          <VStack spacing={8} textAlign="center" color="white">
            <Heading size="xl">Ready to Transform Your Professional Journey?</Heading>
            <Text fontSize="xl" maxW="2xl" opacity={0.9}>
              Join thousands of pharmacy professionals who are already using ACPN OTA Zone 
              to advance their careers and stay compliant.
            </Text>
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
              <Button 
                as={RouterLink} 
                to="/register" 
                size="lg"
                bg="white"
                color="blue.600"
                rightIcon={<Icon as={FaChevronRight} />}
                _hover={{ 
                  bg: 'gray.100', 
                  transform: 'translateY(-2px)', 
                  boxShadow: 'xl' 
                }}
                transition="all 0.2s"
              >
                Start Your Free Account
              </Button>
              <Button 
                href="#contact" 
                as="a"
                size="lg"
                variant="outline"
                borderColor="white"
                color="white"
                _hover={{ 
                  bg: 'whiteAlpha.200', 
                  borderColor: 'whiteAlpha.800' 
                }}
              >
                Learn More
              </Button>
            </Stack>
          </VStack>
        </Container>
      </Box>

      {/* Contact Section */}
      <Box id="contact" py={16} bg={useColorModeValue('gray.50', 'gray.800')}>
        <Container maxW="7xl">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Heading size="xl">Get in Touch</Heading>
              <Text fontSize="lg" color={textColor} maxW="2xl">
                Have questions? We're here to help you get started on your professional journey.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
              {/* Phone Support */}
              <Box 
                p={8} 
                bg={bg} 
                borderRadius="2xl" 
                boxShadow="lg" 
                textAlign="center"
                _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                transition="all 0.3s"
              >
                <VStack spacing={4}>
                  <Center 
                    w={16} 
                    h={16} 
                    bg="blue.100" 
                    borderRadius="full" 
                    color="blue.500"
                  >
                    <Icon as={FaPhone} boxSize={8} />
                  </Center>
                  <Heading size="md">Phone Support</Heading>
                  <Text color={textColor}>Speak with our support team</Text>
                  <Link 
                    href="tel:+234-XXX-XXXX" 
                    color="blue.500" 
                    fontWeight="semibold"
                    _hover={{ color: 'blue.600' }}
                  >
                    +234-XXX-XXXX
                  </Link>
                </VStack>
              </Box>

              {/* Email Support */}
              <Box 
                p={8} 
                bg={bg} 
                borderRadius="2xl" 
                boxShadow="lg" 
                textAlign="center"
                _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                transition="all 0.3s"
              >
                <VStack spacing={4}>
                  <Center 
                    w={16} 
                    h={16} 
                    bg="green.100" 
                    borderRadius="full" 
                    color="green.500"
                  >
                    <Icon as={FaEnvelope} boxSize={8} />
                  </Center>
                  <Heading size="md">Email Support</Heading>
                  <Text color={textColor}>Send us your questions</Text>
                  <Link 
                    href="mailto:support@acpn-ota-zone.com" 
                    color="green.500" 
                    fontWeight="semibold"
                    _hover={{ color: 'green.600' }}
                  >
                    support@acpn-ota-zone.com
                  </Link>
                </VStack>
              </Box>

              {/* Office Location */}
              <Box 
                p={8} 
                bg={bg} 
                borderRadius="2xl" 
                boxShadow="lg" 
                textAlign="center"
                _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                transition="all 0.3s"
              >
                <VStack spacing={4}>
                  <Center 
                    w={16} 
                    h={16} 
                    bg="purple.100" 
                    borderRadius="full" 
                    color="purple.500"
                  >
                    <Icon as={FaMapMarkerAlt} boxSize={8} />
                  </Center>
                  <Heading size="md">Office Location</Heading>
                  <Text color={textColor}>Visit our headquarters</Text>
                  <Text color="purple.500" fontWeight="semibold">Lagos, Nigeria</Text>
                </VStack>
              </Box>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg={useColorModeValue('gray.900', 'gray.900')} color="white" py={12}>
        <Container maxW="7xl">
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8}>
            {/* Company Info */}
            <Box gridColumn={{ base: '1', md: '1 / 3' }}>
              <VStack align="start" spacing={6}>
                <HStack spacing={2}>
                  <Image 
                    src="/acpn-ota-zone-logo.svg" 
                    alt="ACPN OTA Zone" 
                    h={10}
                    fallback={<Box w={10} h={10} bg="blue.500" borderRadius="md" />}
                  />
                  <Heading size="lg">ACPN OTA Zone</Heading>
                </HStack>
                <Text color="gray.400" maxW="md">
                  Empowering pharmacy professionals across Nigeria with comprehensive 
                  tools for professional development and compliance management.
                </Text>
              </VStack>
            </Box>

            {/* Quick Links */}
            <Box>
              <Heading size="sm" mb={6}>Quick Links</Heading>
              <VStack align="start" spacing={4}>
                <Link href="#features" _hover={{ color: 'white' }}>Features</Link>
                <Link href="#about" _hover={{ color: 'white' }}>About</Link>
                <Link href="#testimonials" _hover={{ color: 'white' }}>Testimonials</Link>
                <Link href="#contact" _hover={{ color: 'white' }}>Contact</Link>
              </VStack>
            </Box>

            {/* Support */}
            <Box>
              <Heading size="sm" mb={6}>Support</Heading>
              <VStack align="start" spacing={4}>
                <Link href="#" _hover={{ color: 'white' }}>Help Center</Link>
                <Link href="#" _hover={{ color: 'white' }}>Privacy Policy</Link>
                <Link href="#" _hover={{ color: 'white' }}>Terms of Service</Link>
                <Link href="#" _hover={{ color: 'white' }}>Documentation</Link>
              </VStack>
            </Box>
          </SimpleGrid>

          <Divider my={8} borderColor="gray.700" />          <Flex 
            direction={{ base: 'column', md: 'row' }} 
            justify="space-between" 
            align="center"
            gap={4}
          >
            <Text color="gray.400" fontSize="sm">
              © 2024 ACPN OTA Zone. All rights reserved.
            </Text>
            <Text color="gray.400" fontSize="sm">
              Made with ❤️ for pharmacy professionals in Nigeria
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;