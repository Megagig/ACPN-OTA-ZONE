import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground border-transparent',
        secondary: 'bg-secondary text-secondary-foreground border-transparent',
        destructive:
          'bg-destructive text-destructive-foreground border-transparent',
        outline: 'text-foreground border-border',
        success: 'bg-green-500 text-white border-transparent',
        warning: 'bg-yellow-400 text-white border-transparent',
        info: 'bg-blue-500 text-white border-transparent',
        gray: 'bg-gray-200 text-gray-800 border-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
