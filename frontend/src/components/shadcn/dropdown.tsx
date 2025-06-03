import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export interface DropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Context to manage dropdown state
const DropdownContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  contentRef: React.RefObject<HTMLDivElement>;
}>({
  open: false,
  setOpen: () => {},
  triggerRef: React.createRef(),
  contentRef: React.createRef(),
});

const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({ className, open: controlledOpen, onOpenChange, ...props }, ref) => {
    // State for uncontrolled usage
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);

    // Determine if we're in controlled or uncontrolled mode
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;

    const setOpen = React.useCallback(
      (value: boolean) => {
        if (!isControlled) {
          setUncontrolledOpen(value);
        }
        if (onOpenChange) {
          onOpenChange(value);
        }
      },
      [isControlled, onOpenChange]
    );

    // Handle click outside to close dropdown
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          open &&
          contentRef.current &&
          triggerRef.current &&
          !contentRef.current.contains(event.target as Node) &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [open, setOpen]);

    return (
      <DropdownContext.Provider
        value={{ open, setOpen, triggerRef, contentRef }}
      >
        <div
          className={cn('relative inline-block text-left', className)}
          ref={ref}
          {...props}
        >
          {props.children}
        </div>
      </DropdownContext.Provider>
    );
  }
);
Dropdown.displayName = 'Dropdown';

const DropdownTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, forwardedRef) => {
  const { setOpen, open, triggerRef } = React.useContext(DropdownContext);

  // Combine refs
  React.useImperativeHandle(forwardedRef, () => triggerRef.current!);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick(e);
    setOpen(!open);
  };

  return (
    <button
      ref={triggerRef}
      className={cn('inline-flex items-center justify-center', className)}
      onClick={handleClick}
      aria-expanded={open}
      {...props}
    />
  );
});
DropdownTrigger.displayName = 'DropdownTrigger';

const DropdownContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'center' | 'end' }
>(({ className, align = 'center', ...props }, forwardedRef) => {
  const { open, contentRef } = React.useContext(DropdownContext);

  // Combine refs
  React.useImperativeHandle(forwardedRef, () => contentRef.current!);

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute z-50 mt-2 min-w-[12rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-md animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-1',
        alignmentClasses[align],
        className
      )}
      {...props}
    />
  );
});
DropdownContent.displayName = 'DropdownContent';

const DropdownItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    disabled?: boolean;
    closeOnClick?: boolean;
  }
>(({ className, disabled, onClick, closeOnClick = true, ...props }, ref) => {
  const { setOpen } = React.useContext(DropdownContext);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) onClick(e);
    if (closeOnClick) setOpen(false);
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={handleClick}
      {...props}
    />
  );
});
DropdownItem.displayName = 'DropdownItem';

const DropdownSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-gray-200', className)}
    {...props}
  />
));
DropdownSeparator.displayName = 'DropdownSeparator';

export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
};
