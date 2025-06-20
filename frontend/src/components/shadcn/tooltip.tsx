import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export interface TooltipProps {
  /** The content to display in the tooltip */
  content: React.ReactNode;
  /** The element that triggers the tooltip */
  children: React.ReactElement;
  /** Placement of the tooltip */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay before showing tooltip (ms) */
  delayShow?: number;
  /** Delay before hiding tooltip (ms) */
  delayHide?: number;
  /** Whether to show an arrow pointing to the trigger */
  arrow?: boolean;
  /** Max width of the tooltip */
  maxWidth?: number | string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delayShow = 300,
  delayHide = 100,
  arrow = true,
  maxWidth = 200,
}) => {
  const [visible, setVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement | null>(null);
  const showTimeoutRef = React.useRef<number | null>(null);
  const hideTimeoutRef = React.useRef<number | null>(null);

  // Position the tooltip based on placement
  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - 8 + scrollTop;
        left =
          triggerRect.left +
          triggerRect.width / 2 -
          tooltipRect.width / 2 +
          scrollLeft;
        break;
      case 'bottom':
        top = triggerRect.bottom + 8 + scrollTop;
        left =
          triggerRect.left +
          triggerRect.width / 2 -
          tooltipRect.width / 2 +
          scrollLeft;
        break;
      case 'left':
        top =
          triggerRect.top +
          triggerRect.height / 2 -
          tooltipRect.height / 2 +
          scrollTop;
        left = triggerRect.left - tooltipRect.width - 8 + scrollLeft;
        break;
      case 'right':
        top =
          triggerRect.top +
          triggerRect.height / 2 -
          tooltipRect.height / 2 +
          scrollTop;
        left = triggerRect.right + 8 + scrollLeft;
        break;
    }

    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position if needed
    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > viewportWidth - 10) {
      left = viewportWidth - tooltipRect.width - 10;
    }

    // Adjust vertical position if needed
    if (top < 10) {
      top = 10;
    } else if (top + tooltipRect.height > viewportHeight + scrollTop - 10) {
      top = viewportHeight + scrollTop - tooltipRect.height - 10;
    }

    setPosition({ top, left });
  }, [placement]);

  // Show tooltip after delay
  const handleShowTooltip = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    showTimeoutRef.current = setTimeout(() => {
      setVisible(true);
      // Update position after tooltip is visible
      setTimeout(() => updatePosition(), 0);
    }, delayShow);
  };

  // Hide tooltip after delay
  const handleHideTooltip = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, delayHide);
  };

  // Clean up timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Add resize and scroll event listeners
  React.useEffect(() => {
    if (visible) {
      const handleUpdate = () => {
        updatePosition();
      };

      window.addEventListener('resize', handleUpdate);
      window.addEventListener('scroll', handleUpdate);

      return () => {
        window.removeEventListener('resize', handleUpdate);
        window.removeEventListener('scroll', handleUpdate);
      };
    }
  }, [visible, updatePosition]);

  // Add event handlers to trigger element
  const childrenWithProps = React.cloneElement(children, {
    ref: (node: HTMLElement) => {
      triggerRef.current = node;

      // Handle case where child has its own ref
      const childRef = (
        children as React.ReactElement & { ref?: React.Ref<HTMLElement> }
      ).ref;
      if (typeof childRef === 'function') {
        childRef(node);
      } else if (childRef !== null && childRef !== undefined) {
        (childRef as React.MutableRefObject<HTMLElement>).current = node;
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      handleShowTooltip();

      // Call original handler if it exists
      if (children.props.onMouseEnter) {
        children.props.onMouseEnter(e);
      }
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleHideTooltip();

      // Call original handler if it exists
      if (children.props.onMouseLeave) {
        children.props.onMouseLeave(e);
      }
    },
    onFocus: (e: React.FocusEvent) => {
      handleShowTooltip();

      // Call original handler if it exists
      if (children.props.onFocus) {
        children.props.onFocus(e);
      }
    },
    onBlur: (e: React.FocusEvent) => {
      handleHideTooltip();

      // Call original handler if it exists
      if (children.props.onBlur) {
        children.props.onBlur(e);
      }
    },
  });

  // Get arrow position class
  const getArrowClass = () => {
    switch (placement) {
      case 'top':
        return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent';
      case 'bottom':
        return 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent';
      case 'left':
        return 'right-0 top-1/2 translate-x-full -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent';
      case 'right':
        return 'left-0 top-1/2 -translate-x-full -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent';
    }
  };

  return (
    <>
      {childrenWithProps}

      {visible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-md"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          }}
          onMouseEnter={handleShowTooltip}
          onMouseLeave={handleHideTooltip}
          role="tooltip"
        >
          {content}

          {arrow && (
            <div
              className={cn(
                'absolute w-0 h-0',
                'border-4 border-solid border-gray-900',
                getArrowClass()
              )}
            />
          )}
        </div>
      )}
    </>
  );
};

// Simple tooltip with just content string
export interface SimpleTooltipProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** The tooltip text */
  tip: string;
  /** Placement of the tooltip */
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
  children,
  tip,
  placement = 'top',
  className,
  ...props
}) => {
  return (
    <Tooltip content={tip} placement={placement}>
      <span className={cn('inline-block', className)} {...props}>
        {children}
      </span>
    </Tooltip>
  );
};
