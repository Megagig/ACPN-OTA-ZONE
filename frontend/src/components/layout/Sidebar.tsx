import React from 'react';
import {
  Box,
  Flex,
  VStack,
  Text,
  Icon,
  Link,
  Avatar,
  Badge,
  Divider,
  useColorModeValue,
  Tooltip,
  Image,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiUser, 
  FiUsers, 
  FiShield, 
  FiCalendar, 
  FiClipboard, 
  FiDollarSign, 
  FiFileText, 
  FiMail, 
  FiBell, 
  FiSettings,
  FiBarChart,
  FiTrendingUp,
  FiCreditCard,
  FiGift,
  FiPieChart,
  FiActivity
} from 'react-icons/fi';
import { HiOutlineOfficeBuilding, HiOutlineCheckCircle } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const activeColor = useColorModeValue('brand.500', 'brand.300');
  const activeBg = useColorModeValue('brand.50', 'brand.900');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Define navigation items based on user role
  const getNavItems = (): NavItem[] => {
    const commonItems: NavItem[] = [
      { name: 'My Profile', path: '/profile', icon: FiUser },
    ];

    const adminCommonItems: NavItem[] = [
      { name: 'Dashboard', path: '/dashboard', icon: FiHome },
      { name: 'My Profile', path: '/profile', icon: FiUser },
    ];    const adminItems: NavItem[] = [
      { name: 'Admin Dashboard', path: '/admin/dashboard', icon: FiActivity },
      { name: 'Dues Management', path: '/admin/dues-management', icon: FiDollarSign },
      { name: 'Pharmacies', path: '/admin/pharmacies', icon: HiOutlineOfficeBuilding },
      { name: 'Users', path: '/admin/users', icon: FiUsers },
      { name: 'Roles', path: '/admin/roles', icon: FiShield },
      { name: 'Permissions', path: '/admin/permissions', icon: FiShield },
      { name: 'Event Management', path: '/admin/events', icon: FiCalendar },
      { name: 'Legacy Events', path: '/events', icon: FiCalendar },
      { name: 'Attendance', path: '/dashboard/attendance-management', icon: FiClipboard },
      { name: 'Elections', path: '/elections', icon: HiOutlineCheckCircle },
      { name: 'Polls', path: '/polls', icon: FiPieChart },
      { name: 'Communications', path: '/communications', icon: FiMail },
      { name: 'Notifications', path: '/notifications', icon: FiBell },
      { name: 'Finances', path: '/finances', icon: FiTrendingUp },
      { name: 'Financial Management', path: '/dashboard/financial-management', icon: FiBarChart },
      { name: 'Documents', path: '/documents', icon: FiFileText },
      { name: 'Settings', path: '/settings', icon: FiSettings },
    ];    const memberItems: NavItem[] = [
      { name: 'Dashboard', path: '/dashboard', icon: FiHome },
      { name: 'My Pharmacy', path: '/my-pharmacy', icon: HiOutlineOfficeBuilding },
      { name: 'My Documents', path: '/my-documents', icon: FiFileText },
      { name: 'Dues & Payments', path: '/payments', icon: FiCreditCard },
      { name: 'Events', path: '/member/events', icon: FiCalendar },
      { name: 'My Attendance', path: '/dashboard/attendance-status', icon: FiClipboard },
      { name: 'Elections', path: '/elections', icon: HiOutlineCheckCircle },
      { name: 'Messages', path: '/messages', icon: FiMail },
      { name: 'Notifications', path: '/notifications', icon: FiBell },
    ];

    if (['admin', 'superadmin'].includes(user?.role)) {
      return [...adminCommonItems, ...adminItems];    } else if (['treasurer', 'financial_secretary'].includes(user?.role)) {
      return [
        ...adminCommonItems,
        { name: 'Pharmacies', path: '/pharmacies', icon: HiOutlineOfficeBuilding },
        { name: 'Finances', path: '/finances', icon: FiTrendingUp },
        { name: 'Financial Management', path: '/dashboard/financial-management', icon: FiBarChart },
        { name: 'Dues', path: '/dues', icon: FiDollarSign },
        { name: 'Donations', path: '/donations', icon: FiGift },
      ];
    } else if (user?.role === 'secretary') {
      return [
        ...adminCommonItems,
        { name: 'Pharmacies', path: '/pharmacies', icon: HiOutlineOfficeBuilding },
        { name: 'Event Management', path: '/admin/events', icon: FiCalendar },
        { name: 'Legacy Events', path: '/events', icon: FiCalendar },
        { name: 'Communications', path: '/communications', icon: FiMail },
        { name: 'Notifications', path: '/notifications', icon: FiBell },
        { name: 'Documents', path: '/documents', icon: FiFileText },
      ];
    } else {
      return [...commonItems, ...memberItems];
    }
  };

  const navItems = getNavItems();

  const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
    const isActive = location.pathname === item.path;
    
    return (
      <Tooltip label={item.name} placement="right" hasArrow isDisabled={isOpen}>
        <Link
          as={RouterLink}
          to={item.path}
          w="full"
          _hover={{ textDecoration: 'none' }}
          onClick={onClose}
        >
          <Flex
            align="center"
            p={3}
            mx={2}
            borderRadius="xl"
            cursor="pointer"
            bg={isActive ? activeBg : 'transparent'}
            color={isActive ? activeColor : textColor}
            _hover={{
              bg: isActive ? activeBg : hoverBg,
              color: isActive ? activeColor : 'gray.800',
            }}
            transition="all 0.2s"
            position="relative"
          >
            {isActive && (
              <Box
                position="absolute"
                left={0}
                w={1}
                h={6}
                bg={activeColor}
                borderRadius="full"
              />
            )}
            <Icon as={item.icon} fontSize="20" />
            <Text
              ml={4}
              fontSize="sm"
              fontWeight={isActive ? '600' : '500'}
              opacity={isOpen ? 1 : 0}
              transition="opacity 0.2s"
            >
              {item.name}
            </Text>
            {item.badge && (
              <Badge
                ml="auto"
                colorScheme={item.badgeColor || 'brand'}
                variant="solid"
                fontSize="xs"
                opacity={isOpen ? 1 : 0}
                transition="opacity 0.2s"
              >
                {item.badge}
              </Badge>
            )}
          </Flex>
        </Link>
      </Tooltip>
    );
  };
  return (
    <Box
      as="nav"
      pos="fixed"
      left={0}
      top={0}
      w={isOpen ? "280px" : "80px"}
      h="100vh"
      bg={bg}
      borderRight="1px"
      borderColor={borderColor}
      transition="width 0.3s ease"
      zIndex={1000}
      display="flex"
      flexDirection="column"
    >      <VStack spacing={0} align="stretch" h="full">
        {/* Logo Section */}
        <Flex
          align="center"
          justify={isOpen ? "flex-start" : "center"}
          p={4}
          h="80px"
          borderBottom="1px"
          borderColor={borderColor}
          flexShrink={0}
        >
          <Image
            src="/acpn-logo.png"
            alt="ACPN Logo"
            boxSize="40px"
            objectFit="contain"
          />
          <VStack
            align="start"
            spacing={0}
            ml={3}
            opacity={isOpen ? 1 : 0}
            transition="opacity 0.2s"
          >
            <Text fontSize="lg" fontWeight="bold" color={activeColor}>
              ACPN
            </Text>
            <Text fontSize="sm" color={textColor}>
              Ota Zone
            </Text>
          </VStack>
        </Flex>        {/* Navigation Links */}
        <Box flex={1} overflowY="auto" css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: borderColor,
            borderRadius: '24px',
          },
        }}>
          <VStack spacing={1} align="stretch" p={2}>
            <Text
              fontSize="xs"
              fontWeight="600"
              color={textColor}
              textTransform="uppercase"
              letterSpacing="wide"
              p={2}
              ml={2}
              opacity={isOpen ? 1 : 0}
              transition="opacity 0.2s"
            >
              Menu
            </Text>
            {navItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </VStack>
        </Box>        <Divider />

        {/* User Profile Section */}
        <Box p={4} flexShrink={0}>
          <Flex
            align="center"
            p={3}
            borderRadius="xl"
            bg={hoverBg}
            cursor="pointer"
            _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
          >
            <Avatar
              size="sm"
              name={user ? `${user.firstName} ${user.lastName}` : 'User'}
              src={user?.profilePicture}
              bg={activeColor}
            />
            <VStack
              align="start"
              spacing={0}
              ml={3}
              flex={1}
              opacity={isOpen ? 1 : 0}
              transition="opacity 0.2s"
            >
              <Text fontSize="sm" fontWeight="600" noOfLines={1}>
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </Text>
              <Text fontSize="xs" color={textColor} textTransform="capitalize">
                {user?.role || 'Member'}
              </Text>
            </VStack>
          </Flex>
        </Box>
      </VStack>
    </Box>
  );
};

export default Sidebar;
