# ACPN Ota Zone Theme System

This document describes the theme system implementation for the ACPN Ota Zone application.

## Overview

The application now supports light and dark mode themes across all components and interfaces. The theme system:

1. Uses Tailwind CSS for styling with CSS variables for theming
2. Persists user theme preferences in local storage
3. Automatically detects and applies system preferences when available
4. Provides a consistent theme-switching experience across all pages

## Implementation Details

### Theme Context

The theme system is implemented using React Context API in `src/context/ThemeContext.tsx`. This provides:

- `theme` - Current theme state ('light' or 'dark')
- `toggleTheme` - Function to switch between themes

### CSS Variables

Theme colors are defined as CSS variables in `src/index.css`, with separate values for light and dark modes.

### Components

- `ThemeToggle` - A reusable component for toggling between light and dark modes
- Theme-aware styling in layout components using Tailwind's dark mode classes

## How to Use

### In Components

```tsx
import { useTheme } from '../context/ThemeContext';

const MyComponent = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};
```

### Styling Components

Use Tailwind's theme-aware classes that leverage CSS variables:

```tsx
// Instead of hardcoded colors
<div className="bg-white text-gray-900">...</div>

// Use theme variables
<div className="bg-background text-foreground">...</div>
```

### Color Variables

| Variable            | Purpose                 |
| ------------------- | ----------------------- |
| `--background`      | Page background         |
| `--foreground`      | Text color              |
| `--card`            | Card/section background |
| `--card-foreground` | Text on cards           |
| `--primary`         | Primary accent color    |
| `--secondary`       | Secondary accent color  |
| `--muted`           | Subdued elements        |
| `--accent`          | Highlight elements      |
| `--destructive`     | Error/warning elements  |

## Responsive Navigation

The application features improved responsive navigation:

1. Sidebar collapses on mobile and is accessed via a toggle button
2. Overlay backdrop when mobile sidebar is open
3. Smooth transitions between states
4. Theme-aware styling for all navigation elements

## Best Practices

1. Always use theme variables for colors instead of hardcoded values
2. Test both light and dark modes when developing new features
3. Ensure sufficient contrast in both themes
4. Use the ThemeToggle component for consistency

## Future Improvements

- Add more theme options beyond light/dark
- Implement per-component theme overrides
- Improve animations during theme transitions
