import React from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  useColorModeValue,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  useColorMode,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiMenu,
  FiSearch,
  FiBell,
  FiMail,
  FiSettings,
  FiLogOut,
  FiUser,
  FiSun,
  FiMoon,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface ModernHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const ModernHeader: React.FC<ModernHeaderProps> = ({ onMenuClick, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const searchBg = useColorModeValue('gray.50', 'gray.700');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <Box
      as="header"
      position="fixed"
      top={0}
      left={isSidebarOpen ? "280px" : "80px"}
      right={0}
      h="80px"
      bg={bg}
      borderBottom="1px"
      borderColor={borderColor}
      px={6}
      py={4}
      zIndex={999}
      transition="left 0.3s ease"
      boxShadow="sm"
    >
      <Flex align="center" justify="space-between" h="full">
        {/* Left Section */}
        <HStack spacing={4}>
          <IconButton
            aria-label="Toggle menu"
            icon={<FiMenu />}
            variant="ghost"
            size="lg"
            onClick={onMenuClick}
            display={{ base: 'flex', lg: 'none' }}
          />
          
          {/* Search Bar */}
          <InputGroup maxW="400px" display={{ base: 'none', md: 'block' }}>
            <InputLeftElement>
              <FiSearch />
            </InputLeftElement>
            <Input
              placeholder="Search..."
              bg={searchBg}
              border="none"
              borderRadius="xl"
              _focus={{
                bg: useColorModeValue('white', 'gray.600'),
                boxShadow: 'sm',
              }}
            />
          </InputGroup>
        </HStack>

        {/* Right Section */}
        <HStack spacing={4}>
          {/* Theme Toggle */}
          <Tooltip label={colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}>
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
              variant="ghost"
              size="md"
              onClick={toggleColorMode}
            />
          </Tooltip>

          {/* Messages */}
          <Tooltip label="Messages">
            <IconButton
              aria-label="Messages"
              icon={<FiMail />}
              variant="ghost"
              size="md"
              onClick={() => navigate('/messages')}
            />
          </Tooltip>

          {/* Notifications */}
          <Box position="relative">
            <Tooltip label="Notifications">
              <IconButton
                aria-label="Notifications"
                icon={<FiBell />}
                variant="ghost"
                size="md"
                onClick={() => navigate('/notifications')}
              />
            </Tooltip>
            {unreadCount > 0 && (
              <Badge
                position="absolute"
                top="-1"
                right="-1"
                colorScheme="red"
                borderRadius="full"
                fontSize="xs"
                minW="20px"
                h="20px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Box>

          {/* User Menu */}
          <Menu>
            <MenuButton as={Button} variant="ghost" p={1}>
              <HStack spacing={3}>
                <Avatar
                  size="sm"
                  name={user ? `${user.firstName} ${user.lastName}` : 'User'}
                  src={user?.profilePicture}
                />
                <Box textAlign="left" display={{ base: 'none', md: 'block' }}>
                  <Text fontSize="sm" fontWeight="600">
                    {user ? `${user.firstName} ${user.lastName}` : 'User'}
                  </Text>
                  <Text fontSize="xs" color="gray.500" textTransform="capitalize">
                    {user?.role || 'Member'}
                  </Text>
                </Box>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiUser />} onClick={handleProfileClick}>
                My Profile
              </MenuItem>
              <MenuItem icon={<FiSettings />} onClick={() => navigate('/settings')}>
                Settings
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
                Sign Out
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default ModernHeader;
