import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { IconButton, useColorModeValue, Tooltip } from '@chakra-ui/react';
import { FaSun, FaMoon } from 'react-icons/fa';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'md' }) => {
  const { theme, toggleTheme } = useTheme();
  const bg = useColorModeValue('gray.100', 'gray.700');
  const hoverBg = useColorModeValue('gray.200', 'gray.600');
  const iconColor = useColorModeValue('yellow.500', 'yellow.300');

  return (
    <Tooltip 
      label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      placement="bottom"
    >
      <IconButton
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        icon={theme === 'dark' ? <FaSun /> : <FaMoon />}
        onClick={toggleTheme}
        variant="ghost"
        size={size}
        color={iconColor}
        bg={bg}
        _hover={{ bg: hoverBg }}
        borderRadius="md"
        className={className}
      />
    </Tooltip>
  );
};

export default ThemeToggle;
