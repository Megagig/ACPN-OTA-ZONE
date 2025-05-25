import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The width of the skeleton */
  width?: string | number;
  /** The height of the skeleton */
  height?: string | number;
  /** The border radius of the skeleton */
  borderRadius?: string;
  /** Whether to show a pulsing animation */
  animate?: boolean;
  /** Visual variant of the skeleton */
  variant?: 'default' | 'circular' | 'rectangular' | 'text';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      width,
      height,
      borderRadius,
      animate = true,
      variant = 'default',
      style,
      ...props
    },
    ref
  ) => {
    // Build style object
    const skeletonStyle: React.CSSProperties = {
      ...style,
    };

    if (width !== undefined) {
      skeletonStyle.width = typeof width === 'number' ? `${width}px` : width;
    }

    if (height !== undefined) {
      skeletonStyle.height =
        typeof height === 'number' ? `${height}px` : height;
    }

    if (borderRadius !== undefined) {
      skeletonStyle.borderRadius = borderRadius;
    }

    // Determine border radius based on variant
    let variantClassName = '';

    switch (variant) {
      case 'circular':
        variantClassName = 'rounded-full';
        break;
      case 'rectangular':
        variantClassName = 'rounded-none';
        break;
      case 'text':
        variantClassName = 'rounded h-4 w-2/3';
        if (!height) {
          skeletonStyle.height = '1rem';
        }
        break;
      case 'default':
      default:
        variantClassName = 'rounded-md';
        break;
    }

    return (
      <div
        ref={ref}
        className={cn(
          'bg-gray-200',
          animate && 'animate-pulse',
          variantClassName,
          className
        )}
        style={skeletonStyle}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

// Common skeleton components for specific use cases
export interface SkeletonTextProps extends Omit<SkeletonProps, 'variant'> {
  /** Number of lines to render */
  lines?: number;
  /** Width for each line (if array, will use one for each line) */
  lineWidths?: Array<string | number> | string | number;
  /** Gap between lines */
  gap?: string | number;
}

const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  (
    {
      className,
      lines = 3,
      lineWidths = ['100%', '80%', '60%'],
      gap = '0.5rem',
      ...props
    },
    ref
  ) => {
    // Normalize lineWidths to an array
    let widths: Array<string | number> = [];

    if (Array.isArray(lineWidths)) {
      widths = lineWidths;
    } else {
      widths = Array(lines).fill(lineWidths);
    }

    // Pad widths array if needed
    while (widths.length < lines) {
      widths.push(widths[widths.length - 1] || '100%');
    }

    // Convert gap to style
    const gapStyle = {
      marginBottom: typeof gap === 'number' ? `${gap}px` : gap,
    };

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton
            key={i}
            variant="text"
            width={widths[i]}
            className={i < lines - 1 ? 'mb-2' : ''}
            style={i < lines - 1 ? gapStyle : undefined}
          />
        ))}
      </div>
    );
  }
);
SkeletonText.displayName = 'SkeletonText';

export interface SkeletonAvatarProps extends Omit<SkeletonProps, 'variant'> {
  /** Size of the avatar */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SkeletonAvatar = React.forwardRef<HTMLDivElement, SkeletonAvatarProps>(
  ({ className, size = 'md', ...props }, ref) => {
    // Size-based dimensions
    const dimensions = {
      sm: 24,
      md: 40,
      lg: 56,
      xl: 96,
    };

    const dimension = dimensions[size];

    return (
      <Skeleton
        ref={ref}
        variant="circular"
        width={dimension}
        height={dimension}
        className={className}
        {...props}
      />
    );
  }
);
SkeletonAvatar.displayName = 'SkeletonAvatar';

export interface SkeletonCardProps extends Omit<SkeletonProps, 'variant'> {
  /** Show header in the card */
  header?: boolean;
  /** Show footer in the card */
  footer?: boolean;
}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  (
    {
      className,
      width = '100%',
      height = 200,
      header = true,
      footer = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-gray-200 overflow-hidden',
          className
        )}
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
        {...props}
      >
        {header && (
          <Skeleton height={50} variant="rectangular" className="w-full" />
        )}
        <Skeleton height={height} variant="rectangular" className="w-full" />
        {footer && (
          <Skeleton height={50} variant="rectangular" className="w-full" />
        )}
      </div>
    );
  }
);
SkeletonCard.displayName = 'SkeletonCard';

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard };
