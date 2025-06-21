import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  useColorModeValue,
  Portal,
  CloseButton,
  Badge,
  Avatar,
  Divider,
  Button,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Heading,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import {
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaInfoCircle,
  FaBell,
  FaEllipsisV,
  FaEye,
  FaTrash,
  FaCheckDouble,
} from 'react-icons/fa';
import { AnimatePresence } from 'framer-motion';
import { NotificationAnimation } from '../animations/AnimationComponents';

// Notification Types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top' | 'bottom';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  isClosable?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  avatar?: string;
  timestamp?: Date;
  isRead?: boolean;
  category?: string;
  metadata?: Record<string, any>;
}

// Toast Notification Interface
interface ToastNotification extends Omit<Notification, 'id' | 'timestamp' | 'isRead'> {
  position?: NotificationPosition;
  showProgress?: boolean;
}

// Notification Context
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  showToast: (toast: ToastNotification) => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Individual Toast Component
interface ToastProps {
  notification: Notification & { showProgress?: boolean; position?: NotificationPosition };
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {  const [progress, setProgress] = useState(100);
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const getColorScheme = () => {
    switch (notification.type) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'warning': return 'orange';
      case 'info': return 'blue';
      default: return 'blue';
    }
  };

  // Auto-dismiss logic
  React.useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (notification.duration! / 100));
          if (newProgress <= 0) {
            onClose();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [notification.duration, onClose]);

  return (
    <NotificationAnimation isVisible={true}>
      <Box
        bg={bg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        boxShadow="lg"
        overflow="hidden"
        minW="300px"
        maxW="400px"
        mb={4}
      >
        <Alert status={notification.type} variant="left-accent" flexDirection="column" alignItems="stretch">
          <HStack justify="space-between" w="full">
            <HStack spacing={3}>
              <AlertIcon />
              <VStack align="start" spacing={0} flex={1}>
                <AlertTitle fontSize="sm" fontWeight="semibold">
                  {notification.title}
                </AlertTitle>
                {notification.message && (
                  <AlertDescription fontSize="sm">
                    {notification.message}
                  </AlertDescription>
                )}
              </VStack>
            </HStack>
            
            {notification.isClosable && (
              <CloseButton size="sm" onClick={onClose} />
            )}
          </HStack>

          {notification.action && (
            <Box mt={3}>
              <Button
                size="sm"
                colorScheme={getColorScheme()}
                variant="outline"
                onClick={notification.action.onClick}
              >
                {notification.action.label}
              </Button>
            </Box>
          )}
        </Alert>

        {notification.showProgress && notification.duration && (
          <Progress
            value={progress}
            size="xs"
            colorScheme={getColorScheme()}
            bg="transparent"
          />
        )}
      </Box>
    </NotificationAnimation>
  );
};

// Toast Container
interface ToastContainerProps {
  notifications: (Notification & { showProgress?: boolean; position?: NotificationPosition })[];
  position: NotificationPosition;
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  notifications,
  position,
  onRemove,
}) => {
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 9999,
      pointerEvents: 'none' as const,
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, top: 4, right: 4 };
      case 'top-left':
        return { ...baseStyles, top: 4, left: 4 };
      case 'bottom-right':
        return { ...baseStyles, bottom: 4, right: 4 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 4, left: 4 };
      case 'top':
        return { ...baseStyles, top: 4, left: '50%', transform: 'translateX(-50%)' };
      case 'bottom':
        return { ...baseStyles, bottom: 4, left: '50%', transform: 'translateX(-50%)' };
      default:
        return { ...baseStyles, top: 4, right: 4 };
    }
  };

  return (
    <Portal>
      <Box {...getPositionStyles()}>
        <VStack spacing={0} align="stretch" style={{ pointerEvents: 'auto' }}>
          <AnimatePresence>
            {notifications
              .filter(n => !n.position || n.position === position)
              .map(notification => (
                <Toast
                  key={notification.id}
                  notification={notification}
                  onClose={() => onRemove(notification.id)}
                />
              ))
            }
          </AnimatePresence>
        </VStack>
      </Box>
    </Portal>
  );
};

// Notification Bell Component
interface NotificationBellProps {
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'solid';
  colorScheme?: string;
  onClick?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  count = 0,
  size = 'md',
  variant = 'ghost',
  colorScheme = 'blue',
  onClick,
}) => {
  return (
    <Box position="relative">
      <IconButton
        aria-label="Notifications"
        icon={<FaBell />}
        size={size}
        variant={variant}
        colorScheme={colorScheme}
        onClick={onClick}
      />
      {count > 0 && (
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
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </Box>
  );
};

// Notification List Item
interface NotificationListItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

const NotificationListItem: React.FC<NotificationListItemProps> = ({
  notification,
  onMarkAsRead,
  onRemove,
  onClick,
}) => {
  const bg = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const unreadBg = useColorModeValue('blue.50', 'blue.900');

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <FaCheck color="green" />;
      case 'error': return <FaTimes color="red" />;
      case 'warning': return <FaExclamationTriangle color="orange" />;
      case 'info': return <FaInfoCircle color="blue" />;
      default: return <FaInfoCircle color="blue" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Box
      bg={!notification.isRead ? unreadBg : bg}
      _hover={{ bg: hoverBg }}
      p={4}
      borderRadius="md"
      cursor="pointer"
      onClick={() => onClick?.(notification)}
      position="relative"
    >
      <HStack spacing={3} align="start">
        {notification.avatar ? (
          <Avatar size="sm" src={notification.avatar} />
        ) : (
          <Box>{getIcon()}</Box>
        )}

        <VStack flex={1} align="start" spacing={1}>
          <HStack w="full" justify="space-between">
            <Text fontWeight={!notification.isRead ? 'semibold' : 'normal'} fontSize="sm">
              {notification.title}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {notification.timestamp && formatTime(notification.timestamp)}
            </Text>
          </HStack>

          {notification.message && (
            <Text fontSize="xs" color="gray.600" noOfLines={2}>
              {notification.message}
            </Text>
          )}

          {notification.category && (
            <Badge size="sm" colorScheme="gray" variant="subtle">
              {notification.category}
            </Badge>
          )}
        </VStack>

        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FaEllipsisV />}
            variant="ghost"
            size="xs"
            onClick={(e) => e.stopPropagation()}
          />
          <MenuList>
            {!notification.isRead && (
              <MenuItem
                icon={<FaEye />}
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
              >
                Mark as read
              </MenuItem>
            )}
            <MenuItem
              icon={<FaTrash />}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(notification.id);
              }}
              color="red.500"
            >
              Delete
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      {!notification.isRead && (
        <Box
          position="absolute"
          left={2}
          top="50%"
          transform="translateY(-50%)"
          w={2}
          h={2}
          bg="blue.500"
          borderRadius="full"
        />
      )}
    </Box>
  );
};

// Notification Panel
interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  placement?: 'left' | 'right';
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  placement = 'right',
}) => {
  const { notifications, markAsRead, removeNotification, markAllAsRead, clearNotifications, unreadCount } = useNotifications();

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  return (
    <Drawer isOpen={isOpen} placement={placement} onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          <Flex align="center" justify="space-between">
            <Heading size="md">Notifications</Heading>
            {unreadCount > 0 && (
              <Badge colorScheme="red" borderRadius="full">
                {unreadCount}
              </Badge>
            )}
          </Flex>
        </DrawerHeader>

        <DrawerBody>
          <VStack spacing={4} align="stretch">
            {/* Actions */}
            {notifications.length > 0 && (
              <HStack spacing={2}>
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<FaCheckDouble />}
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<FaTrash />}
                  onClick={clearNotifications}
                  colorScheme="red"
                >
                  Clear all
                </Button>
              </HStack>
            )}

            {/* Notifications */}
            {notifications.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">No notifications</Text>
              </Box>
            ) : (
              <VStack spacing={4} align="stretch">
                {/* Unread Notifications */}
                {unreadNotifications.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>
                      Unread ({unreadNotifications.length})
                    </Text>
                    <VStack spacing={2} align="stretch">
                      {unreadNotifications.map(notification => (
                        <NotificationListItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={markAsRead}
                          onRemove={removeNotification}
                        />
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Read Notifications */}
                {readNotifications.length > 0 && (
                  <Box>
                    {unreadNotifications.length > 0 && <Divider my={4} />}
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>
                      Read ({readNotifications.length})
                    </Text>
                    <VStack spacing={2} align="stretch">
                      {readNotifications.map(notification => (
                        <NotificationListItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={markAsRead}
                          onRemove={removeNotification}
                        />
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
          </VStack>
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

// Notification Provider Component
interface NotificationProviderProps {
  children: React.ReactNode;
  defaultPosition?: NotificationPosition;
  maxNotifications?: number;
}

export const ModernNotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  defaultPosition = 'top-right',
  maxNotifications = 5,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toastNotifications, setToastNotifications] = useState<(Notification & { showProgress?: boolean; position?: NotificationPosition })[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      isRead: false,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, maxNotifications);
    });

    return id;
  }, [maxNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const showToast = useCallback((toast: ToastNotification) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const toastNotification = {
      ...toast,
      id,
      timestamp: new Date(),
      isRead: false,
      position: toast.position || defaultPosition,
    };

    setToastNotifications(prev => [...prev, toastNotification]);

    // Auto-remove if duration is set
    if (toast.duration !== 0) {
      setTimeout(() => {
        setToastNotifications(prev => prev.filter(n => n.id !== id));
      }, toast.duration || 5000);
    }
  }, [defaultPosition]);

  const removeToast = useCallback((id: string) => {
    setToastNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    markAsRead,
    markAllAsRead,
    showToast,
    unreadCount,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Containers for different positions */}
      {(['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top', 'bottom'] as NotificationPosition[]).map(position => (
        <ToastContainer
          key={position}
          notifications={toastNotifications}
          position={position}
          onRemove={removeToast}
        />
      ))}
    </NotificationContext.Provider>
  );
};

// Notification Hook with convenient methods
export const useModernNotifications = () => {
  const context = useNotifications();
  
  return {
    ...context,
    
    // Convenience methods
    success: (title: string, message?: string, options?: Partial<Notification>) => {
      return context.addNotification({ type: 'success', title, message, ...options });
    },
    
    error: (title: string, message?: string, options?: Partial<Notification>) => {
      return context.addNotification({ type: 'error', title, message, ...options });
    },
    
    warning: (title: string, message?: string, options?: Partial<Notification>) => {
      return context.addNotification({ type: 'warning', title, message, ...options });
    },
    
    info: (title: string, message?: string, options?: Partial<Notification>) => {
      return context.addNotification({ type: 'info', title, message, ...options });
    },
    
    // Toast methods
    toast: {
      success: (title: string, message?: string, options?: Partial<ToastNotification>) => {
        context.showToast({ type: 'success', title, message, ...options });
      },
      
      error: (title: string, message?: string, options?: Partial<ToastNotification>) => {
        context.showToast({ type: 'error', title, message, ...options });
      },
      
      warning: (title: string, message?: string, options?: Partial<ToastNotification>) => {
        context.showToast({ type: 'warning', title, message, ...options });
      },
      
      info: (title: string, message?: string, options?: Partial<ToastNotification>) => {
        context.showToast({ type: 'info', title, message, ...options });
      },
    },
  };
};
