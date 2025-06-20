import * as React from "react";

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Popover: React.FC<PopoverProps> = ({ open, onOpenChange, children }) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = open !== undefined ? open : internalOpen;

  const handleOpenChange = (value: boolean) => {
    setInternalOpen(value);
    onOpenChange?.(value);
  };

  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    if (child.type === PopoverTrigger) {
      return React.cloneElement(child as React.ReactElement<PopoverTriggerProps>, {
        onClick: () => handleOpenChange(!isOpen),
      });
    }
    if (child.type === PopoverContent && isOpen) {
      return child;
    }
    return child;
  });
};

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}
const PopoverTrigger: React.FC<PopoverTriggerProps> = ({ children, ...props }) => (
  <button type="button" {...props}>
    {children}
  </button>
);

interface PopoverContentProps {
  className?: string;
  children: React.ReactNode;
}
const PopoverContent: React.FC<PopoverContentProps> = ({ className = "", children }) => (
  <div
    className={`absolute z-50 mt-2 w-auto rounded-md border bg-white p-4 shadow-md ${className}`}
    style={{ minWidth: 200 }}
  >
    {children}
  </div>
);

export { Popover, PopoverTrigger, PopoverContent }; 