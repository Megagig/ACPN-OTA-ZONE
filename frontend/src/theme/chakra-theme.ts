import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Professional color palette
const colors = {
  brand: {
    50: '#e6f3ff',
    100: '#b3d9ff', 
    200: '#80bfff',
    300: '#4da6ff',
    400: '#1a8cff',
    500: '#0066cc', // Primary brand color
    600: '#0052a3',
    700: '#003d7a',
    800: '#002952',
    900: '#001429',
  },
  accent: {
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
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
};

const fonts = {
  heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: '600',
      borderRadius: 'lg',
      _focus: {
        boxShadow: 'outline',
      },
    },
    sizes: {
      sm: {
        fontSize: 'sm',
        px: 4,
        py: 2,
      },
      md: {
        fontSize: 'md',
        px: 6,
        py: 3,
      },
      lg: {
        fontSize: 'lg',
        px: 8,
        py: 4,
      },
    },
    variants: {
      solid: {
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
          _disabled: {
            bg: 'brand.500',
          },
        },
        _active: {
          bg: 'brand.700',
        },
      },
      outline: {
        border: '2px solid',
        borderColor: 'brand.500',
        color: 'brand.500',
        _hover: {
          bg: 'brand.50',
          _disabled: {
            bg: 'transparent',
          },
        },
        _dark: {
          _hover: {
            bg: 'brand.900',
          },
        },
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'xl',
        boxShadow: 'sm',
        border: '1px solid',
        borderColor: 'gray.200',
        _dark: {
          borderColor: 'gray.700',
          bg: 'gray.800',
        },
      },
    },
  },
  Input: {
    variants: {
      outline: {
        field: {
          borderRadius: 'lg',
          border: '2px solid',
          borderColor: 'gray.200',
          _hover: {
            borderColor: 'gray.300',
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
          _dark: {
            borderColor: 'gray.600',
            _hover: {
              borderColor: 'gray.500',
            },
          },
        },
      },
    },
  },
  Select: {
    variants: {
      outline: {
        field: {
          borderRadius: 'lg',
          border: '2px solid',
          borderColor: 'gray.200',
          _hover: {
            borderColor: 'gray.300',
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
          _dark: {
            borderColor: 'gray.600',
            _hover: {
              borderColor: 'gray.500',
            },
          },
        },
      },
    },
  },
  Table: {
    variants: {
      simple: {
        th: {
          borderColor: 'gray.200',
          color: 'gray.600',
          fontSize: 'sm',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 'wide',
          _dark: {
            borderColor: 'gray.600',
            color: 'gray.400',
          },
        },
        td: {
          borderColor: 'gray.200',
          _dark: {
            borderColor: 'gray.600',
          },
        },
      },
    },
  },
  Modal: {
    baseStyle: {
      dialog: {
        borderRadius: 'xl',
        boxShadow: 'xl',
      },
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: 'full',
      fontWeight: '600',
      fontSize: 'xs',
      px: 3,
      py: 1,
    },
  },
};

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

const styles = {
  global: (props: any) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
      color: props.colorMode === 'dark' ? 'white' : 'gray.800',
    },
  }),
};

const shadows = {
  outline: '0 0 0 3px rgba(66, 153, 225, 0.6)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

const theme = extendTheme({
  colors,
  fonts,
  components,
  config,
  styles,
  shadows,
  space: {
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },
  radii: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
});

export default theme;
