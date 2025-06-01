// Export all shadcn/ui components
export * from '../shadcn';

// Export chakra components with aliases to avoid conflicts
export {
  Card as ChakraCard,
  CardBody as ChakraCardBody,
  Avatar as ChakraAvatar,
  Image as ChakraImage,
  Alert as ChakraAlert,
  AlertIcon as ChakraAlertIcon,
  type AlertIconProps as ChakraAlertIconProps,
} from './chakra-components';

// Export pagination component
export { default as Pagination } from './Pagination';

// Export theme toggle
export { default as ThemeToggle } from './ThemeToggle';

// Re-export toast hook from the main toast component
export { useToast } from '../shadcn/toast';
