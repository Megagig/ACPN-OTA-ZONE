// Custom hook to properly type Chakra UI's useToast
import {
  useToast as useChakraToast,
  type UseToastOptions,
} from '@chakra-ui/react';

interface Toast {
  toast: (options: UseToastOptions) => void;
}

export const useToast = (): Toast => {
  const chakraToast = useChakraToast();

  return {
    toast: chakraToast,
  };
};
