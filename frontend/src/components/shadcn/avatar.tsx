import * as React from 'react';
import { cn } from '../../lib/utils/cn';

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    src?: string;
    alt?: string;
    fallback?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }
>(({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-12 w-12';
      case 'xl':
        return 'h-16 w-16';
      default:
        return 'h-10 w-10';
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        getSizeClasses(),
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
          {fallback || (
            <span className="text-muted-foreground font-medium">
              {alt ? alt.charAt(0).toUpperCase() : 'U'}
            </span>
          )}
        </div>
      )}
    </div>
  );
});
Avatar.displayName = 'Avatar';

export { Avatar };
