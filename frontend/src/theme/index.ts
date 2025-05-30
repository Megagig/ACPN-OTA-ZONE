import { extendTheme } from '@chakra-ui/react';

// Define custom color palette for the Association of Community Pharmacists
const colors = {
  brand: {
    50: '#e3f3ff',
    100: '#b7dcff',
    200: '#8ac5ff',
    300: '#5caeff',
    400: '#2e97ff',
    500: '#0080ff', // Primary brand color
    600: '#0066cc',
    700: '#004c99',
    800: '#003366',
    900: '#001a33',
  },
  pharmacy: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  accent: {
    50: '#fef7ff',
    100: '#fce7ff',
    200: '#f8d4fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  semantic: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
};

// Define typography
const fonts = {
  heading: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
  body: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
};

// Define component styles
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'md',
    },
    variants: {
      solid: {
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
          transform: 'translateY(-1px)',
          boxShadow: 'lg',
        },
        _active: {
          bg: 'brand.700',
          transform: 'translateY(0)',
        },
      },
      outline: {
        borderColor: 'brand.500',
        color: 'brand.500',
        _hover: {
          bg: 'brand.50',
          borderColor: 'brand.600',
        },
      },
      ghost: {
        color: 'brand.500',
        _hover: {
          bg: 'brand.50',
        },
      },
    },
    defaultProps: {
      variant: 'solid',
      size: 'md',
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'lg',
        boxShadow: 'md',
        bg: 'white',
        borderColor: 'gray.200',
        borderWidth: '1px',
      },
    },
    variants: {
      elevated: {
        container: {
          boxShadow: 'xl',
          borderWidth: '0',
        },
      },
      outline: {
        container: {
          boxShadow: 'none',
          borderWidth: '1px',
        },
      },
    },
    defaultProps: {
      variant: 'elevated',
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: 'full',
      textTransform: 'uppercase',
      fontSize: 'xs',
      fontWeight: 'bold',
      px: 2,
      py: 1,
    },
    variants: {
      solid: {
        bg: 'brand.500',
        color: 'white',
      },
      subtle: {
        bg: 'brand.100',
        color: 'brand.800',
      },
      outline: {
        borderColor: 'brand.500',
        color: 'brand.500',
        borderWidth: '1px',
      },
    },
    defaultProps: {
      variant: 'subtle',
    },
  },
};

// Define global styles
const styles = {
  global: {
    'html, body': {
      backgroundColor: 'gray.50',
      color: 'gray.900',
      lineHeight: 'tall',
    },
    a: {
      color: 'brand.500',
      _hover: {
        textDecoration: 'underline',
      },
    },
  },
};

// Define breakpoints
const breakpoints = {
  sm: '30em',
  md: '48em',
  lg: '62em',
  xl: '80em',
  '2xl': '96em',
};

// Create the theme
const theme = extendTheme({
  colors,
  fonts,
  components,
  styles,
  breakpoints,
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

export default theme;
