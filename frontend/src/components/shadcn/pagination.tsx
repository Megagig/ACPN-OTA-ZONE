import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Total number of pages */
  totalPages: number;
  /** Current page (1-indexed) */
  currentPage: number;
  /** Function to handle page change */
  onPageChange: (page: number) => void;
  /** Number of page buttons to show (excluding prev/next buttons) */
  siblingCount?: number;
}

const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      className,
      totalPages,
      currentPage,
      onPageChange,
      siblingCount = 1,
      ...props
    },
    ref
  ) => {
    // Generate page numbers to display
    const getPageNumbers = () => {
      const totalPageNumbers = siblingCount * 2 + 3; // siblings + current + first + last

      // If pages are less than total buttons, show all
      if (totalPages <= totalPageNumbers) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }

      // Calculate left and right sibling index
      const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
      const rightSiblingIndex = Math.min(
        currentPage + siblingCount,
        totalPages
      );

      // Should show dots
      const shouldShowLeftDots = leftSiblingIndex > 2;
      const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

      if (!shouldShowLeftDots && shouldShowRightDots) {
        // Show more pages on the left
        const leftItemCount = 1 + 2 * siblingCount;
        const leftRange = Array.from(
          { length: leftItemCount },
          (_, i) => i + 1
        );
        return [...leftRange, '...', totalPages];
      } else if (shouldShowLeftDots && !shouldShowRightDots) {
        // Show more pages on the right
        const rightItemCount = 1 + 2 * siblingCount;
        const rightRange = Array.from(
          { length: rightItemCount },
          (_, i) => totalPages - rightItemCount + i + 1
        );
        return [1, '...', ...rightRange];
      } else if (shouldShowLeftDots && shouldShowRightDots) {
        // Show dots on both sides
        const middleRange = Array.from(
          { length: rightSiblingIndex - leftSiblingIndex + 1 },
          (_, i) => leftSiblingIndex + i
        );
        return [1, '...', ...middleRange, '...', totalPages];
      }
    };

    const pages = getPageNumbers();

    // Go to previous page
    const handlePrevious = () => {
      if (currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    };

    // Go to next page
    const handleNext = () => {
      if (currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    };

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center space-x-1', className)}
        {...props}
      >
        <PaginationButton
          onClick={handlePrevious}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </PaginationButton>

        {pages?.map((page, i) => {
          if (page === '...') {
            return <PaginationEllipsis key={`ellipsis-${i}`} />;
          }

          return (
            <PaginationButton
              key={`page-${page}`}
              active={page === currentPage}
              onClick={() => onPageChange(page as number)}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </PaginationButton>
          );
        })}

        <PaginationButton
          onClick={handleNext}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </PaginationButton>
      </div>
    );
  }
);
Pagination.displayName = 'Pagination';

interface PaginationButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

const PaginationButton = React.forwardRef<
  HTMLButtonElement,
  PaginationButtonProps
>(({ className, active, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'flex items-center justify-center h-8 w-8 rounded-md text-sm transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
        active
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'text-foreground hover:bg-muted',
        props.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
PaginationButton.displayName = 'PaginationButton';

const PaginationEllipsis = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'flex items-center justify-center h-8 w-8 text-muted-foreground',
        className
      )}
      {...props}
    >
      &#8230;
    </span>
  );
});
PaginationEllipsis.displayName = 'PaginationEllipsis';

export { Pagination, PaginationButton, PaginationEllipsis };
