import * as React from 'react';
import { cn } from '../../lib/utils/cn';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  variant?: 'default' | 'striped' | 'bordered';
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div className="w-full overflow-auto">
        <table
          ref={ref}
          className={cn(
            'w-full caption-bottom text-sm',
            variant === 'bordered' && 'border border-border',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('bg-muted', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement> & { striped?: boolean }
>(({ className, striped, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      '[&_tr:last-child]:border-0',
      striped && '[&_tr:nth-child(even)]:bg-muted/50',
      className
    )}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('bg-muted font-medium', className)}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    isSelected?: boolean;
    isClickable?: boolean;
  }
>(({ className, isSelected, isClickable, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-border transition-colors',
      isSelected && 'bg-muted',
      isClickable && 'cursor-pointer hover:bg-muted/50',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
      'first:rounded-tl-md last:rounded-tr-md',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('p-4 align-middle', className)} {...props} />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
