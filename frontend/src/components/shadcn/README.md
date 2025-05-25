# Shadcn UI Components for ACPN Ota Zone

This directory contains modern UI components built for the ACPN Ota Zone React application. These components are inspired by the Shadcn UI design system, providing a consistent, accessible, and beautiful user interface.

## Available Components

### Base Components

- **Alert**: Display important messages to users
- **Avatar**: Display user avatars with fallback options
- **Badge**: Show status, counts, or labels
- **Button**: Multi-purpose button component with variants
- **Card**: Container component for grouping related content
- **Checkbox**: Interactive checkbox input
- **Dialog**: Modal dialog for focused interactions
- **Dropdown**: Dropdown menu for navigation or actions
- **Form**: Form components for data entry
- **Input**: Text input field
- **Navigation**: Navigation components (Navbar, Sidebar, etc.)
- **Pagination**: Navigate through paginated content
- **Progress**: Display progress with different variants
- **RadioGroup**: Radio button selection group
- **Select**: Dropdown select component
- **Skeleton**: Loading state placeholders
- **StatCard**: Highlight statistics with trends
- **Table**: Data table with various features
- **Tabs**: Tabbed interface for content organization
- **Textarea**: Multi-line text input
- **Toast**: Notification system
- **Tooltip**: Display additional information on hover

## Usage

Import components directly from the `shadcn` directory:

```tsx
import { Button, Card, Input } from '../components/shadcn';

const MyComponent = () => {
  return (
    <Card>
      <Card.Header>
        <Card.Title>My Card</Card.Title>
        <Card.Description>This is a card description</Card.Description>
      </Card.Header>
      <Card.Content>
        <Input label="Name" placeholder="Enter your name" />
      </Card.Content>
      <Card.Footer>
        <Button>Submit</Button>
      </Card.Footer>
    </Card>
  );
};
```

## Component Structure

Each component follows a consistent pattern:

1. **Props Interface**: Typed props for TypeScript support
2. **Variants**: Most components support multiple visual variants
3. **Composition**: Complex components use composition pattern
4. **Accessibility**: ARIA attributes included for accessibility
5. **Responsive**: Designed to work across device sizes

## Utilities

- **cn.ts**: Utility for merging class names with Tailwind CSS

## Theme Customization

Components use CSS variables for theming. Customize colors, spacing, and other design tokens in the global CSS file.

## Contributing

When adding new components or modifying existing ones:

1. Follow the established patterns
2. Include proper TypeScript interfaces
3. Ensure accessibility standards are met
4. Write clear, concise comments

## Best Practices

- Use the component composition pattern for complex UIs
- Prefer controlled components when state management is needed
- Use variants to maintain design consistency
- Leverage Tailwind CSS utility classes for styling
