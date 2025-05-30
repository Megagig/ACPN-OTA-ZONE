// This file provides proper re-exports of Chakra UI components
// to fix typescript errors related to missing components

import {
  Card as ChakraCard,
  CardBody as ChakraCardBody,
  Avatar as ChakraAvatar,
  Image as ChakraImage,
  Alert as ChakraAlert,
  AlertIcon as ChakraAlertIcon,
  type AlertIconProps as ChakraAlertIconProps,
} from '@chakra-ui/react';

// Re-export with proper types
export const Card = ChakraCard;
export const CardBody = ChakraCardBody;
export const Avatar = ChakraAvatar;
export const Image = ChakraImage;
export const Alert = ChakraAlert;

// Export AlertIcon with status prop support
export interface AlertIconProps extends ChakraAlertIconProps {
  status?: 'error' | 'success' | 'warning' | 'info';
}

export const AlertIcon: React.FC<AlertIconProps> = (props) => {
  return <ChakraAlertIcon {...props} />;
};
