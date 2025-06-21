import React from 'react';
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  HStack,
  Text,
  IconButton,
  useDisclosure,
  useBreakpointValue,
  Flex,
  Container,
  useColorModeValue,
  Button,
  Avatar,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Image,
  Collapse,
  useBoolean,
} from '@chakra-ui/react';
import { 
  FaBars,
  FaBell,
  FaUser,
  FaChevronDown,
  FaChevronUp,
  FaSignOutAlt,
  FaCog,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';

// Mobile Navigation Item
interface MobileNavItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
  hasSubmenu?: boolean;
  children?: React.ReactNode;
  badge?: string | number;
}

const MobileNavItem: React.FC<MobileNavItemProps> = ({
  icon,
  label,
  onClick,
  isActive,
  hasSubmenu,
  children,
  badge,
}) => {
  const [isOpen, setIsOpen] = useBoolean();
  const activeColor = useColorModeValue('blue.500', 'blue.300');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const activeBg = useColorModeValue('blue.50', 'blue.900');

  const handleClick = () => {
    if (hasSubmenu) {
      setIsOpen.toggle();
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <Box>
      <HStack
        as="button"
        w="full"
        p={3}
        rounded="lg"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : 'inherit'}
        _hover={{ bg: hoverBg }}
        onClick={handleClick}
        justify="space-between"
      >
        <HStack spacing={3}>
          <Box fontSize="lg">{icon}</Box>
          <Text fontWeight={isActive ? 'semibold' : 'normal'}>{label}</Text>
          {badge && (
            <Badge colorScheme="red" borderRadius="full" fontSize="xs">
              {badge}
            </Badge>
          )}
        </HStack>
        {hasSubmenu && (
          <Box>
            {isOpen ? <FaChevronUp /> : <FaChevronDown />}
          </Box>
        )}
      </HStack>
      
      {hasSubmenu && (
        <Collapse in={isOpen}>
          <Box pl={8} mt={2}>
            {children}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

// Mobile Header
interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
  showNotifications?: boolean;
  notificationCount?: number;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  onMenuClick,
  showNotifications = true,
  notificationCount = 0,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box
      as="header"
      bg={bg}
      borderBottom="1px"
      borderColor={borderColor}
      px={4}
      py={3}
      position="sticky"
      top={0}
      zIndex={10}
      backdropFilter="blur(10px)"
    >
      <Flex align="center" justify="space-between">
        {/* Left: Menu + Title */}
        <HStack spacing={3}>
          <IconButton
            aria-label="Open menu"
            icon={<FaBars />}
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
          />
          <Text fontSize="lg" fontWeight="semibold" noOfLines={1}>
            {title}
          </Text>
        </HStack>

        {/* Right: Notifications + Profile */}
        <HStack spacing={2}>
          {showNotifications && (
            <Box position="relative">
              <IconButton
                aria-label="Notifications"
                icon={<FaBell />}
                variant="ghost"
                size="sm"
              />
              {notificationCount > 0 && (
                <Badge
                  position="absolute"
                  top="-1"
                  right="-1"
                  colorScheme="red"
                  borderRadius="full"
                  fontSize="xs"
                  minW={5}
                  h={5}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Badge>
              )}
            </Box>
          )}

          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              size="sm"
              rightIcon={<FaChevronDown />}
              pl={2}
            >
              <Avatar
                size="sm"
                name={user ? `${user.firstName} ${user.lastName}` : 'User'}
                src={user?.avatar}
              />
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FaUser />} onClick={() => navigate('/profile')}>
                Profile
              </MenuItem>
              <MenuItem icon={<FaCog />} onClick={() => navigate('/settings')}>
                Settings
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<FaSignOutAlt />} onClick={handleLogout}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

// Mobile Sidebar
interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const { user } = useAuth();
  const bg = useColorModeValue('white', 'gray.800');

  return (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="sm">
      <DrawerOverlay />
      <DrawerContent bg={bg}>
        <DrawerCloseButton />
        
        <DrawerHeader borderBottomWidth="1px">
          <VStack spacing={3} align="center">
            <HStack>
              <Image 
                src="/acpn-ota-zone-logo.svg" 
                alt="ACPN OTA Zone" 
                h={8}
                fallback={<Box w={8} h={8} bg="blue.500" borderRadius="md" />}
              />
              <Text fontSize="lg" fontWeight="bold">ACPN OTA Zone</Text>
            </HStack>
            
            {user && (
              <VStack spacing={1}>
                <Avatar
                  size="md"
                  name={`${user.firstName} ${user.lastName}`}
                  src={user.avatar}
                />
                <Text fontSize="sm" fontWeight="medium">
                  {user.firstName} {user.lastName}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {user.role}
                </Text>
              </VStack>
            )}
          </VStack>
        </DrawerHeader>

        <DrawerBody py={4}>
          <VStack spacing={2} align="stretch">
            {children}
          </VStack>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px" justifyContent="center">
          <ThemeToggle />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

// Mobile Layout Container
interface MobileLayoutProps {
  children: React.ReactNode;
  title: string;
  sidebarContent: React.ReactNode;
  showNotifications?: boolean;
  notificationCount?: number;
  maxWidth?: string;
  bg?: string;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  sidebarContent,
  showNotifications,
  notificationCount,
  maxWidth = 'full',
  bg,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const containerBg = bg || useColorModeValue('gray.50', 'gray.900');

  if (!isMobile) {
    // Return desktop layout or redirect to desktop component
    return <Box>{children}</Box>;
  }

  return (
    <Box minH="100vh" bg={containerBg}>
      <MobileHeader
        title={title}
        onMenuClick={onOpen}
        showNotifications={showNotifications}
        notificationCount={notificationCount}
      />
      
      <MobileSidebar isOpen={isOpen} onClose={onClose}>
        {sidebarContent}
      </MobileSidebar>

      <Container maxW={maxWidth} py={4} px={4}>
        {children}
      </Container>
    </Box>
  );
};

// Mobile Card Component
interface MobileCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  p?: number | string;
  spacing?: number;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  title,
  subtitle,
  actions,
  p = 4,
  spacing = 4,
}) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
      shadow="sm"
    >
      {(title || subtitle || actions) && (
        <Box p={4} borderBottomWidth="1px" borderColor={borderColor}>
          <Flex align="center" justify="space-between">
            <Box>
              {title && (
                <Text fontSize="lg" fontWeight="semibold" mb={1}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text fontSize="sm" color="gray.500">
                  {subtitle}
                </Text>
              )}
            </Box>
            {actions && <Box>{actions}</Box>}
          </Flex>
        </Box>
      )}
      
      <Box p={p}>
        <VStack spacing={spacing} align="stretch">
          {children}
        </VStack>
      </Box>
    </Box>
  );
};

// Mobile List Item
interface MobileListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  avatar?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  actions?: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
}

export const MobileListItem: React.FC<MobileListItemProps> = ({
  title,
  subtitle,
  description,
  avatar,
  icon,
  badge,
  actions,
  onClick,
  isActive,
}) => {
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.500', 'blue.300');

  return (
    <Box
      as="button"
      w="full"
      p={4}
      bg={isActive ? activeBg : 'transparent'}
      _hover={{ bg: hoverBg }}
      onClick={onClick}
      borderRadius="lg"
      textAlign="left"
    >
      <HStack spacing={3} align="start">
        {/* Avatar or Icon */}
        <Box flexShrink={0}>
          {avatar ? (
            <Avatar size="md" src={avatar} name={title} />
          ) : icon ? (
            <Box
              w={10}
              h={10}
              borderRadius="full"
              bg={isActive ? activeColor : 'gray.100'}
              color={isActive ? 'white' : 'gray.600'}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {icon}
            </Box>
          ) : null}
        </Box>

        {/* Content */}
        <VStack flex={1} align="start" spacing={1}>
          <HStack w="full" justify="space-between" align="start">
            <Text
              fontWeight="semibold"
              color={isActive ? activeColor : 'inherit'}
              noOfLines={1}
            >
              {title}
            </Text>
            {badge && (
              <Badge colorScheme="red" borderRadius="full" fontSize="xs">
                {badge}
              </Badge>
            )}
          </HStack>

          {subtitle && (
            <Text fontSize="sm" color="gray.500" noOfLines={1}>
              {subtitle}
            </Text>
          )}

          {description && (
            <Text fontSize="sm" color="gray.600" noOfLines={2}>
              {description}
            </Text>
          )}

          {actions && (
            <Box pt={2} onClick={(e) => e.stopPropagation()}>
              {actions}
            </Box>
          )}
        </VStack>
      </HStack>
    </Box>
  );
};

// Mobile Grid
interface MobileGridProps {
  children: React.ReactNode;
  columns?: number;
  spacing?: number;
}

export const MobileGrid: React.FC<MobileGridProps> = ({
  children,
  columns = 2,
  spacing = 4,
}) => {
  return (
    <Box
      display="grid"
      gridTemplateColumns={`repeat(${columns}, 1fr)`}
      gap={spacing}
    >
      {children}
    </Box>
  );
};

// Mobile Stats Card
interface MobileStatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  colorScheme?: string;
}

export const MobileStatsCard: React.FC<MobileStatsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  colorScheme = 'blue',
}) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'green.500';
      case 'negative': return 'red.500';
      default: return 'gray.500';
    }
  };

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={4}
      shadow="sm"
    >
      <VStack spacing={3} align="start">
        <HStack w="full" justify="space-between">
          <Text fontSize="sm" color="gray.500" fontWeight="medium">
            {title}
          </Text>
          {icon && (
            <Box color={`${colorScheme}.500`} fontSize="lg">
              {icon}
            </Box>
          )}
        </HStack>
        
        <Text fontSize="2xl" fontWeight="bold">
          {value}
        </Text>
        
        {change && (
          <Text fontSize="xs" color={getChangeColor()}>
            {change}
          </Text>
        )}
      </VStack>
    </Box>
  );
};

// Export all mobile components
export {
  MobileNavItem,
  MobileHeader,
  MobileSidebar,
};
