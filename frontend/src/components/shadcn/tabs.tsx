import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue, value, onValueChange, ...props }, ref) => {
    const [selectedValue, setSelectedValue] = React.useState(
      value || defaultValue
    );

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value);
      }
    }, [value]);

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (value === undefined) {
          setSelectedValue(newValue);
        }
        onValueChange?.(newValue);
      },
      [onValueChange, value]
    );

    // Listen for tab change events
    React.useEffect(() => {
      const handleTabChange = (event: CustomEvent) => {
        handleValueChange(event.detail.value);
      };

      const element = ref as React.MutableRefObject<HTMLDivElement>;
      if (element?.current) {
        element.current.addEventListener(
          'tabchange',
          handleTabChange as EventListener
        );
        return () => {
          element.current?.removeEventListener(
            'tabchange',
            handleTabChange as EventListener
          );
        };
      }
    }, [handleValueChange, ref]);

    return (
      <div
        ref={ref}
        className={cn('space-y-4', className)}
        {...props}
        data-selected-value={selectedValue}
        data-state={value !== undefined ? 'controlled' : 'uncontrolled'}
      />
    );
  }
);
Tabs.displayName = 'Tabs';

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'pills' | 'underline';
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          variant === 'default' && 'bg-gray-100 p-1 rounded-lg',
          variant === 'pills' && 'space-x-2',
          variant === 'underline' && 'border-b border-gray-200',
          className
        )}
        role="tablist"
        {...props}
      />
    );
  }
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  variant?: 'default' | 'pills' | 'underline';
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, variant = 'default', ...props }, ref) => {
    const tabsEl = React.useRef<HTMLElement | null>(null);
    const [isSelected, setIsSelected] = React.useState(false);

    // Find closest parent tabs element
    React.useLayoutEffect(() => {
      if (typeof ref === 'function' || !ref?.current) return;

      let el: HTMLElement | null = ref.current;
      while (el && !el.hasAttribute('data-selected-value')) {
        el = el.parentElement;
      }
      tabsEl.current = el;
    }, [ref]);

    // Check if this tab is selected
    React.useLayoutEffect(() => {
      if (tabsEl.current) {
        const selectedValue = tabsEl.current.getAttribute(
          'data-selected-value'
        );
        setIsSelected(selectedValue === value);
      }
    }, [value]);

    // Handle tab click
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      props.onClick?.(e);

      if (tabsEl.current) {
        // Trigger a custom event that the parent Tabs component can listen to
        const event = new CustomEvent('tabchange', {
          detail: { value },
          bubbles: true,
        });
        tabsEl.current.dispatchEvent(event);
      }
    };

    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        aria-selected={isSelected}
        data-state={isSelected ? 'active' : 'inactive'}
        data-value={value}
        className={cn(
          'focus:outline-none transition-all',
          // Default variant
          variant === 'default' && 'px-3 py-1.5 text-sm font-medium',
          variant === 'default' && isSelected
            ? 'bg-card text-foreground shadow rounded-md border border-border'
            : 'text-muted-foreground hover:text-foreground',
          // Pills variant
          variant === 'pills' && 'px-4 py-2 text-sm font-medium rounded-full',
          variant === 'pills' && isSelected
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
          // Underline variant
          variant === 'underline' &&
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
          variant === 'underline' && isSelected
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
          className
        )}
        onClick={handleClick}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const tabsEl = React.useRef<HTMLElement | null>(null);
    const [isSelected, setIsSelected] = React.useState(false);

    // Find closest parent tabs element
    React.useLayoutEffect(() => {
      if (typeof ref === 'function' || !ref?.current) return;

      let el: HTMLElement | null = ref.current;
      while (el && !el.hasAttribute('data-selected-value')) {
        el = el.parentElement;
      }
      tabsEl.current = el;
    }, [ref]);

    // Check if this content should be shown
    React.useLayoutEffect(() => {
      if (tabsEl.current) {
        const selectedValue = tabsEl.current.getAttribute(
          'data-selected-value'
        );
        setIsSelected(selectedValue === value);
      }

      // Listen for changes in the parent's data-selected-value
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === 'attributes' &&
            mutation.attributeName === 'data-selected-value' &&
            tabsEl.current
          ) {
            const selectedValue = tabsEl.current.getAttribute(
              'data-selected-value'
            );
            setIsSelected(selectedValue === value);
          }
        });
      });

      if (tabsEl.current) {
        observer.observe(tabsEl.current, { attributes: true });
      }

      return () => {
        observer.disconnect();
      };
    }, [value]);

    if (!isSelected) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        data-state={isSelected ? 'active' : 'inactive'}
        data-value={value}
        className={cn('mt-2', className)}
        {...props}
      />
    );
  }
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
