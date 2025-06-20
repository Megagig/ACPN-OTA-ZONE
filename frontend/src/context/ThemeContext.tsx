import React, { createContext, useContext, useEffect } from 'react';
import {
  ChakraProvider,
  useColorMode,
  ColorModeScript,
} from '@chakra-ui/react';
import chakraCustomTheme from '../theme/chakra-theme';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Wrapper component that includes ChakraProvider and our custom ThemeContext Provider
function InternalThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorMode, toggleColorMode } = useColorMode();

  // Synchronize Chakra's colorMode with our simplified `theme` state
  const currentTheme = colorMode as Theme;

  // Effect to update documentElement class if still needed for non-Chakra components
  useEffect(() => {
    const root = document.documentElement;
    if (colorMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Persist the theme preference if needed by other parts of the app, though Chakra handles its own.
    localStorage.setItem('app-theme', colorMode);
  }, [colorMode]);

  return (
    <ThemeContext.Provider
      value={{ theme: currentTheme, toggleTheme: toggleColorMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// This is the main ThemeProvider to be used in App.tsx or similar root component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={chakraCustomTheme}>
      {/* ColorModeScript should ideally be in your index.html or root App component for SSR compatibility */}
      {/* and to prevent FOUC. Including it here for completeness if not elsewhere. */}
      <ColorModeScript
        initialColorMode={chakraCustomTheme.config.initialColorMode}
      />
      <InternalThemeProvider>{children}</InternalThemeProvider>
    </ChakraProvider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
