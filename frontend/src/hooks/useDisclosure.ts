import { useState } from 'react';

// Disclosure hook replacement for Chakra UI's useDisclosure
export const useDisclosure = () => {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
  };
};
