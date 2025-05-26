// Enhanced TailwindComponents with proper prop support for Chakra UI migration
import React, { type ReactNode } from 'react';

// Utility function to handle margin/padding props
const getSpacingClasses = (props: any) => {
  let classes = '';
  if (props.mb) classes += ` mb-${props.mb}`;
  if (props.mt) classes += ` mt-${props.mt}`;
  if (props.ml) classes += ` ml-${props.ml}`;
  if (props.mr) classes += ` mr-${props.mr}`;
  if (props.mx) classes += ` mx-${props.mx}`;
  if (props.my) classes += ` my-${props.my}`;
  if (props.p) classes += ` p-${props.p}`;
  if (props.px) classes += ` px-${props.px}`;
  if (props.py) classes += ` py-${props.py}`;
  return classes;
};

// Badge Component
interface BadgeProps {
  children: ReactNode;
  colorScheme?:
    | 'blue'
    | 'green'
    | 'red'
    | 'gray'
    | 'orange'
    | 'purple'
    | 'teal';
  variant?: 'solid' | 'outline' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ml?: number;
  mr?: number;
  mb?: number;
  mt?: number;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  colorScheme = 'gray',
  variant = 'solid',
  size = 'md',
  className = '',
  ...spacingProps
}) => {
  const getColorClasses = () => {
    const baseClasses = {
      blue: {
        solid: 'bg-blue-500 text-white',
        outline: 'border border-blue-500 text-blue-500 bg-transparent',
        subtle: 'bg-blue-100 text-blue-800',
      },
      green: {
        solid: 'bg-green-500 text-white',
        outline: 'border border-green-500 text-green-500 bg-transparent',
        subtle: 'bg-green-100 text-green-800',
      },
      red: {
        solid: 'bg-red-500 text-white',
        outline: 'border border-red-500 text-red-500 bg-transparent',
        subtle: 'bg-red-100 text-red-800',
      },
      gray: {
        solid: 'bg-gray-500 text-white',
        outline: 'border border-gray-500 text-gray-500 bg-transparent',
        subtle: 'bg-gray-100 text-gray-800',
      },
      orange: {
        solid: 'bg-orange-500 text-white',
        outline: 'border border-orange-500 text-orange-500 bg-transparent',
        subtle: 'bg-orange-100 text-orange-800',
      },
      purple: {
        solid: 'bg-purple-500 text-white',
        outline: 'border border-purple-500 text-purple-500 bg-transparent',
        subtle: 'bg-purple-100 text-purple-800',
      },
      teal: {
        solid: 'bg-teal-500 text-white',
        outline: 'border border-teal-500 text-teal-500 bg-transparent',
        subtle: 'bg-teal-100 text-teal-800',
      },
    };
    return baseClasses[colorScheme][variant];
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-4 py-2 text-sm';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${getColorClasses()} ${getSizeClasses()} ${getSpacingClasses(
        spacingProps
      )} ${className}`}
    >
      {children}
    </span>
  );
};

// Button Component
interface ButtonProps {
  children: ReactNode;
  colorScheme?: 'blue' | 'green' | 'red' | 'gray' | 'teal' | 'purple';
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  ref?: React.Ref<HTMLButtonElement>;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      colorScheme = 'blue',
      variant = 'solid',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      leftIcon,
      rightIcon,
      onClick,
      className = '',
      type = 'button',
    },
    ref
  ) => {
    const getColorClasses = () => {
      const baseClasses = {
        blue: {
          solid: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
          outline:
            'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
          ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
        },
        green: {
          solid:
            'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
          outline:
            'border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
          ghost: 'text-green-600 hover:bg-green-50 focus:ring-green-500',
        },
        red: {
          solid: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
          outline:
            'border border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
          ghost: 'text-red-600 hover:bg-red-50 focus:ring-red-500',
        },
        gray: {
          solid: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
          outline:
            'border border-gray-600 text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
          ghost: 'text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
        },
        teal: {
          solid: 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500',
          outline:
            'border border-teal-600 text-teal-600 hover:bg-teal-50 focus:ring-teal-500',
          ghost: 'text-teal-600 hover:bg-teal-50 focus:ring-teal-500',
        },
        purple: {
          solid:
            'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
          outline:
            'border border-purple-600 text-purple-600 hover:bg-purple-50 focus:ring-purple-500',
          ghost: 'text-purple-600 hover:bg-purple-50 focus:ring-purple-500',
        },
      };
      return (
        baseClasses[colorScheme]?.[variant] || baseClasses['blue'][variant]
      );
    };

    const getSizeClasses = () => {
      switch (size) {
        case 'xs':
          return 'px-2 py-1 text-xs';
        case 'sm':
          return 'px-3 py-1.5 text-sm';
        case 'lg':
          return 'px-6 py-3 text-lg';
        case 'xl':
          return 'px-8 py-4 text-xl';
        default:
          return 'px-4 py-2 text-base';
      }
    };

    const disabled = isLoading || isDisabled;

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center font-medium rounded-md
          focus:outline-none focus:ring-2 focus:ring-offset-2
          transition-colors duration-200
          ${getColorClasses()}
          ${getSizeClasses()}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        {isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
        )}
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Text Component
interface TextProps {
  children: ReactNode;
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'gray' | 'red' | 'blue' | 'green' | 'gray.600';
  className?: string;
  mb?: number;
  mt?: number;
  ml?: number;
  mr?: number;
}

export const Text: React.FC<TextProps> = ({
  children,
  fontSize = 'base',
  fontWeight = 'normal',
  color = 'gray',
  className = '',
  ...spacingProps
}) => {
  const getFontSizeClass = () => {
    const sizes = {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
    };
    return sizes[fontSize];
  };

  const getFontWeightClass = () => {
    const weights = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    };
    return weights[fontWeight];
  };

  const getColorClass = () => {
    const colors = {
      gray: 'text-gray-700',
      'gray.600': 'text-gray-600',
      red: 'text-red-600',
      blue: 'text-blue-600',
      green: 'text-green-600',
    };
    return colors[color] || 'text-gray-700';
  };

  return (
    <span
      className={`${getFontSizeClass()} ${getFontWeightClass()} ${getColorClass()} ${getSpacingClasses(
        spacingProps
      )} ${className}`}
    >
      {children}
    </span>
  );
};

// Heading Component
interface HeadingProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  mb?: number;
  mt?: number;
}

export const Heading: React.FC<HeadingProps> = ({
  children,
  as = 'h2',
  size = 'lg',
  className = '',
  ...spacingProps
}) => {
  const getSizeClass = () => {
    const sizes = {
      xs: 'text-sm font-semibold',
      sm: 'text-base font-semibold',
      md: 'text-lg font-semibold',
      lg: 'text-xl font-bold',
      xl: 'text-2xl font-bold',
      '2xl': 'text-3xl font-bold',
      '3xl': 'text-4xl font-bold',
    };
    return sizes[size];
  };

  const Component = as;

  return (
    <Component
      className={`${getSizeClass()} text-gray-900 ${getSpacingClasses(
        spacingProps
      )} ${className}`}
    >
      {children}
    </Component>
  );
};

// Divider Component
interface DividerProps {
  className?: string;
  my?: number;
}

export const Divider: React.FC<DividerProps> = ({
  className = '',
  ...spacingProps
}) => {
  return (
    <hr
      className={`border-t border-gray-200 ${getSpacingClasses(
        spacingProps
      )} ${className}`}
    />
  );
};

// Progress Component
interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'blue' | 'green' | 'red' | 'gray';
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  colorScheme = 'blue',
  className = '',
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-2';
      case 'lg':
        return 'h-6';
      default:
        return 'h-4';
    }
  };

  const getColorClasses = () => {
    switch (colorScheme) {
      case 'green':
        return 'bg-green-500';
      case 'red':
        return 'bg-red-500';
      case 'gray':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div
      className={`w-full bg-gray-200 rounded-full ${getSizeClasses()} ${className}`}
    >
      <div
        className={`${getColorClasses()} ${getSizeClasses()} rounded-full transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// Stat Components
interface StatProps {
  children: ReactNode;
  className?: string;
}

export const Stat: React.FC<StatProps> = ({ children, className = '' }) => (
  <div className={`text-center ${className}`}>{children}</div>
);

interface StatLabelProps {
  children: ReactNode;
  className?: string;
}

export const StatLabel: React.FC<StatLabelProps> = ({
  children,
  className = '',
}) => (
  <div className={`text-sm font-medium text-gray-600 ${className}`}>
    {children}
  </div>
);

interface StatNumberProps {
  children: ReactNode;
  className?: string;
}

export const StatNumber: React.FC<StatNumberProps> = ({
  children,
  className = '',
}) => (
  <div className={`text-2xl font-bold text-gray-900 ${className}`}>
    {children}
  </div>
);

interface StatHelpTextProps {
  children: ReactNode;
  className?: string;
}

export const StatHelpText: React.FC<StatHelpTextProps> = ({
  children,
  className = '',
}) => <div className={`text-xs text-gray-500 ${className}`}>{children}</div>;

// Tab Components (simplified for this project)
interface TabsProps {
  children: ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ children, className = '' }) => (
  <div className={`w-full ${className}`}>{children}</div>
);

interface TabListProps {
  children: ReactNode;
  className?: string;
}

export const TabList: React.FC<TabListProps> = ({
  children,
  className = '',
}) => (
  <div className={`flex border-b border-gray-200 ${className}`} role="tablist">
    {children}
  </div>
);

interface TabProps {
  children: ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Tab: React.FC<TabProps> = ({
  children,
  isSelected = false,
  onClick,
  className = '',
}) => (
  <button
    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors duration-200 ${
      isSelected
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    } ${className}`}
    onClick={onClick}
    role="tab"
    aria-selected={isSelected}
  >
    {children}
  </button>
);

interface TabPanelsProps {
  children: ReactNode;
  className?: string;
}

export const TabPanels: React.FC<TabPanelsProps> = ({
  children,
  className = '',
}) => <div className={`mt-4 ${className}`}>{children}</div>;

interface TabPanelProps {
  children: ReactNode;
  isSelected?: boolean;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  children,
  isSelected = true,
  className = '',
}) => (
  <div
    className={`${isSelected ? 'block' : 'hidden'} ${className}`}
    role="tabpanel"
  >
    {children}
  </div>
);

// Grid Components
interface SimpleGridProps {
  children: ReactNode;
  columns?: number | { base?: number; md?: number; lg?: number };
  spacing?: number;
  className?: string;
}

export const SimpleGrid: React.FC<SimpleGridProps> = ({
  children,
  columns = 1,
  spacing = 4,
  className = '',
}) => {
  const getGridClasses = () => {
    if (typeof columns === 'number') {
      return `grid-cols-${columns}`;
    }

    let classes = '';
    if (columns.base) classes += `grid-cols-${columns.base}`;
    if (columns.md) classes += ` md:grid-cols-${columns.md}`;
    if (columns.lg) classes += ` lg:grid-cols-${columns.lg}`;
    return classes;
  };

  const getSpacingClass = () => `gap-${spacing}`;

  return (
    <div
      className={`grid ${getGridClasses()} ${getSpacingClass()} ${className}`}
    >
      {children}
    </div>
  );
};

// Stack Components
interface VStackProps {
  children: ReactNode;
  spacing?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
  mt?: number;
}

export const VStack: React.FC<VStackProps> = ({
  children,
  spacing = 4,
  align = 'stretch',
  className = '',
  ...spacingProps
}) => {
  const getAlignClass = () => {
    switch (align) {
      case 'start':
        return 'items-start';
      case 'center':
        return 'items-center';
      case 'end':
        return 'items-end';
      default:
        return 'items-stretch';
    }
  };

  const getSpacingClass = () => `space-y-${spacing}`;

  return (
    <div
      className={`flex flex-col ${getAlignClass()} ${getSpacingClass()} ${getSpacingClasses(
        spacingProps
      )} ${className}`}
    >
      {children}
    </div>
  );
};

interface HStackProps {
  children: ReactNode;
  spacing?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
  justify?: string;
}

export const HStack: React.FC<HStackProps> = ({
  children,
  spacing = 4,
  align = 'center',
  className = '',
  justify,
}) => {
  const getAlignClass = () => {
    switch (align) {
      case 'start':
        return 'items-start';
      case 'center':
        return 'items-center';
      case 'end':
        return 'items-end';
      default:
        return 'items-stretch';
    }
  };

  const getJustifyClass = () => {
    if (!justify) return '';
    switch (justify) {
      case 'center':
        return 'justify-center';
      case 'space-between':
        return 'justify-between';
      case 'space-around':
        return 'justify-around';
      case 'flex-end':
        return 'justify-end';
      default:
        return '';
    }
  };

  const getSpacingClass = () => `space-x-${spacing}`;

  return (
    <div
      className={`flex ${getAlignClass()} ${getJustifyClass()} ${getSpacingClass()} ${className}`}
    >
      {children}
    </div>
  );
};

// Flex Component
interface FlexProps {
  children: ReactNode;
  justify?:
    | 'start'
    | 'center'
    | 'end'
    | 'between'
    | 'around'
    | 'evenly'
    | 'flex-end';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  className?: string;
  mb?: number;
  mt?: number;
}

export const Flex: React.FC<FlexProps> = ({
  children,
  justify = 'start',
  align = 'stretch',
  direction = 'row',
  wrap = 'nowrap',
  className = '',
  ...spacingProps
}) => {
  const getJustifyClass = () => {
    switch (justify) {
      case 'center':
        return 'justify-center';
      case 'end':
      case 'flex-end':
        return 'justify-end';
      case 'between':
        return 'justify-between';
      case 'around':
        return 'justify-around';
      case 'evenly':
        return 'justify-evenly';
      default:
        return 'justify-start';
    }
  };

  const getAlignClass = () => {
    switch (align) {
      case 'start':
        return 'items-start';
      case 'center':
        return 'items-center';
      case 'end':
        return 'items-end';
      case 'baseline':
        return 'items-baseline';
      default:
        return 'items-stretch';
    }
  };

  const getDirectionClass = () => {
    switch (direction) {
      case 'column':
        return 'flex-col';
      case 'row-reverse':
        return 'flex-row-reverse';
      case 'column-reverse':
        return 'flex-col-reverse';
      default:
        return 'flex-row';
    }
  };

  const getWrapClass = () => {
    switch (wrap) {
      case 'wrap':
        return 'flex-wrap';
      case 'wrap-reverse':
        return 'flex-wrap-reverse';
      default:
        return 'flex-nowrap';
    }
  };

  return (
    <div
      className={`flex ${getDirectionClass()} ${getJustifyClass()} ${getAlignClass()} ${getWrapClass()} ${getSpacingClasses(
        spacingProps
      )} ${className}`}
    >
      {children}
    </div>
  );
};

// Box Component
interface BoxProps {
  children: ReactNode;
  className?: string;
  p?: number;
  mb?: number;
  mt?: number;
  ml?: number;
  mr?: number;
  textAlign?: 'left' | 'center' | 'right';
}

export const Box: React.FC<BoxProps> = ({
  children,
  className = '',
  textAlign,
  ...spacingProps
}) => {
  const textAlignClass = textAlign ? `text-${textAlign}` : '';

  return (
    <div
      className={`${textAlignClass} ${getSpacingClasses(
        spacingProps
      )} ${className}`}
    >
      {children}
    </div>
  );
};

// Input Components
interface InputProps {
  placeholder?: string;
  value?: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
  disabled?: boolean;
  mr?: number;
}

export const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  name,
  onChange,
  onBlur,
  type = 'text',
  className = '',
  disabled = false,
  ...spacingProps
}) => (
  <input
    name={name}
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onBlur={onBlur}
    disabled={disabled}
    className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
      disabled ? 'bg-gray-100 cursor-not-allowed' : ''
    } ${getSpacingClasses(spacingProps)} ${className}`}
  />
);

// Select Component
interface SelectProps {
  children: ReactNode;
  value?: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  children,
  value,
  name,
  onChange,
  className = '',
  disabled = false,
}) => (
  <select
    name={name}
    value={value}
    onChange={onChange}
    disabled={disabled}
    className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
      disabled ? 'bg-gray-100 cursor-not-allowed' : ''
    } ${className}`}
  >
    {children}
  </select>
);

// IconButton Component
interface IconButtonProps {
  'aria-label': string;
  icon: ReactNode;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  colorScheme?: 'blue' | 'green' | 'red' | 'gray';
  onClick?: () => void;
  className?: string;
  isDisabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  'aria-label': ariaLabel,
  icon,
  variant = 'solid',
  size = 'md',
  colorScheme = 'gray',
  onClick,
  className = '',
  isDisabled = false,
}) => {
  const sizeClasses = {
    xs: 'p-1 text-xs',
    sm: 'p-1 text-sm',
    md: 'p-2 text-base',
    lg: 'p-3 text-lg',
  };

  const variantClasses = {
    solid: {
      blue: 'bg-blue-500 text-white hover:bg-blue-600',
      green: 'bg-green-500 text-white hover:bg-green-600',
      red: 'bg-red-500 text-white hover:bg-red-600',
      gray: 'bg-gray-500 text-white hover:bg-gray-600',
    },
    outline: {
      blue: 'border border-blue-500 text-blue-500 hover:bg-blue-50',
      green: 'border border-green-500 text-green-500 hover:bg-green-50',
      red: 'border border-red-500 text-red-500 hover:bg-red-50',
      gray: 'border border-gray-500 text-gray-500 hover:bg-gray-50',
    },
    ghost: {
      blue: 'text-blue-500 hover:bg-blue-50',
      green: 'text-green-500 hover:bg-green-50',
      red: 'text-red-500 hover:bg-red-50',
      gray: 'text-gray-500 hover:bg-gray-50',
    },
  };

  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${sizeClasses[size]} ${
        variantClasses[variant][colorScheme]
      } ${className}`}
    >
      {icon}
    </button>
  );
};

// AlertDialog Components
interface AlertDialogProps {
  isOpen: boolean;
  leastDestructiveRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  size?: string;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${className}`}>
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        {children}
      </div>
    </div>
  );
};

interface AlertDialogOverlayProps {
  children: ReactNode;
  className?: string;
}

export const AlertDialogOverlay: React.FC<AlertDialogOverlayProps> = ({
  children,
  className = '',
}) => (
  <div
    className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${className}`}
  >
    {children}
  </div>
);

interface AlertDialogContentProps {
  children: ReactNode;
  className?: string;
}

export const AlertDialogContent: React.FC<AlertDialogContentProps> = ({
  children,
  className = '',
}) => <div className={`${className}`}>{children}</div>;

interface AlertDialogHeaderProps {
  children: ReactNode;
  fontSize?: string;
  fontWeight?: string;
  className?: string;
}

export const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = ({
  children,
  className = '',
}) => (
  <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${className}`}>
    <h3 className="text-lg font-bold leading-6 text-gray-900">{children}</h3>
  </div>
);

interface AlertDialogBodyProps {
  children: ReactNode;
  className?: string;
}

export const AlertDialogBody: React.FC<AlertDialogBodyProps> = ({
  children,
  className = '',
}) => (
  <div className={`px-4 pb-4 sm:px-6 sm:pb-4 ${className}`}>
    <div className="text-sm text-gray-500">{children}</div>
  </div>
);

interface AlertDialogFooterProps {
  children: ReactNode;
  className?: string;
}

export const AlertDialogFooter: React.FC<AlertDialogFooterProps> = ({
  children,
  className = '',
}) => (
  <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${className}`}>
    {children}
  </div>
);

// Form Components
interface FormControlProps {
  children: ReactNode;
  isInvalid?: boolean;
  className?: string;
  display?: string;
  alignItems?: string;
}

export const FormControl: React.FC<FormControlProps> = ({
  children,
  isInvalid = false,
  className = '',
  display,
  alignItems,
}) => {
  const displayClass = display === 'flex' ? 'flex' : '';
  const alignItemsClass = alignItems === 'center' ? 'items-center' : '';

  return (
    <div
      className={`${
        isInvalid ? 'text-red-600' : ''
      } ${displayClass} ${alignItemsClass} ${className}`}
    >
      {children}
    </div>
  );
};

interface FormLabelProps {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: 'xs' | 'sm' | 'base' | 'lg';
  mb?: string | number;
}

export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  htmlFor,
  className = '',
  textAlign = 'left',
  fontSize = 'sm',
  mb,
}) => {
  const getTextAlignClass = () => {
    switch (textAlign) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'xs':
        return 'text-xs';
      case 'sm':
        return 'text-sm';
      case 'base':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-sm';
    }
  };

  const getMbClass = () => {
    if (mb === '0' || mb === 0) return 'mb-0';
    if (typeof mb === 'number') return `mb-${mb}`;
    return 'mb-1';
  };

  return (
    <label
      htmlFor={htmlFor}
      className={`block font-medium text-gray-700 ${getMbClass()} ${getTextAlignClass()} ${getFontSizeClass()} ${className}`}
    >
      {children}
    </label>
  );
};

interface FormErrorMessageProps {
  children: ReactNode;
  className?: string;
}

export const FormErrorMessage: React.FC<FormErrorMessageProps> = ({
  children,
  className = '',
}) => (
  <div className={`text-red-500 text-sm mt-1 ${className}`}>{children}</div>
);

interface TextareaProps {
  placeholder?: string;
  value?: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  className?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  placeholder,
  value,
  name,
  onChange,
  onBlur,
  className = '',
  disabled = false,
  rows = 3,
  maxLength,
}) => (
  <textarea
    name={name}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onBlur={onBlur}
    disabled={disabled}
    rows={rows}
    maxLength={maxLength}
    className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
      disabled ? 'bg-gray-100 cursor-not-allowed' : ''
    } ${className}`}
  />
);

interface CheckboxProps {
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  className = '',
  disabled = false,
  children,
}) => (
  <label className={`inline-flex items-center ${className}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
    />
    {children && <span className="ml-2 text-sm text-gray-700">{children}</span>}
  </label>
);

interface SwitchProps {
  isChecked?: boolean;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
}

export const Switch: React.FC<SwitchProps> = ({
  isChecked,
  name,
  onChange,
  className = '',
  disabled = false,
  children,
}) => (
  <label className={`inline-flex items-center ${className}`}>
    <div className="relative">
      <input
        name={name}
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`block h-6 w-10 rounded-full ${
          isChecked ? 'bg-blue-500' : 'bg-gray-300'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      />
      <div
        className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition ${
          isChecked ? 'transform translate-x-4' : ''
        }`}
      />
    </div>
    {children && <span className="ml-2 text-sm text-gray-700">{children}</span>}
  </label>
);

interface RadioGroupProps {
  children: ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  children,
  value,
  onChange,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`} role="radiogroup">
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          // @ts-ignore
          checked: child.props.value === value,
          // @ts-ignore
          onChange: () => onChange?.(child.props.value),
        });
      }
      return child;
    })}
  </div>
);

interface RadioProps {
  children: ReactNode;
  value: string;
  checked?: boolean;
  onChange?: () => void;
  className?: string;
  disabled?: boolean;
  w?: string;
}

export const Radio: React.FC<RadioProps> = ({
  children,
  value,
  checked,
  onChange,
  className = '',
  disabled = false,
  w,
}) => (
  <label
    className={`inline-flex items-center ${
      w === '100%' ? 'w-full' : ''
    } ${className}`}
  >
    <input
      type="radio"
      value={value}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
    />
    <span className="ml-2 text-sm text-gray-700">{children}</span>
  </label>
);

interface TooltipProps {
  children: ReactNode;
  label: string;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  label,
  className = '',
}) => (
  <div className={`relative inline-block ${className}`} title={label}>
    {children}
  </div>
);

interface CollapseProps {
  children: ReactNode;
  in: boolean;
  className?: string;
  animateOpacity?: boolean;
}

export const Collapse: React.FC<CollapseProps> = ({
  children,
  in: isOpen,
  className = '',
  animateOpacity = true,
}) => (
  <div
    className={`transition-all duration-300 overflow-hidden ${
      isOpen ? 'max-h-96' : 'max-h-0'
    } ${
      animateOpacity ? (isOpen ? 'opacity-100' : 'opacity-0') : ''
    } ${className}`}
  >
    {children}
  </div>
);

// Card Body Component with additional props
interface CardBodyProps {
  children: ReactNode;
  className?: string;
  textAlign?: string;
  py?: number;
}

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
  textAlign,
  ...spacingProps
}) => {
  const textAlignClass = textAlign ? `text-${textAlign}` : '';

  return (
    <div
      className={`p-6 ${textAlignClass} ${getSpacingClasses(
        spacingProps
      )} ${className}`}
    >
      {children}
    </div>
  );
};

// Avatar Component
interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = '',
  src,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      className={`rounded-full flex items-center justify-center overflow-hidden bg-gray-300 text-gray-700 ${sizeClasses[size]} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};

// Stack Component
interface StackProps {
  children: ReactNode;
  spacing?: number;
  align?: 'stretch' | 'center' | 'flex-start' | 'flex-end' | 'baseline';
  justify?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  direction?: 'column' | 'row';
  className?: string;
  ml?: number;
  mr?: number;
  mb?: number;
  mt?: number;
}

export const Stack: React.FC<StackProps> = ({
  children,
  spacing = 4,
  align = 'stretch',
  justify = 'flex-start',
  direction = 'column',
  className = '',
  ...spacingProps
}) => {
  const alignClasses = {
    stretch: 'items-stretch',
    center: 'items-center',
    'flex-start': 'items-start',
    'flex-end': 'items-end',
    baseline: 'items-baseline',
  };

  const justifyClasses = {
    'flex-start': 'justify-start',
    'flex-end': 'justify-end',
    center: 'justify-center',
    'space-between': 'justify-between',
    'space-around': 'justify-around',
    'space-evenly': 'justify-evenly',
  };

  const directionClasses = {
    column: 'flex-col',
    row: 'flex-row',
  };

  const spacingClass =
    direction === 'column' ? `space-y-${spacing}` : `space-x-${spacing}`;

  const spacingStyles = getSpacingClasses(spacingProps);

  return (
    <div
      className={`flex ${directionClasses[direction]} ${alignClasses[align]} ${justifyClasses[justify]} ${spacingClass} ${className} ${spacingStyles}`}
    >
      {children}
    </div>
  );
};

// Icon Component
interface IconProps {
  as: React.ElementType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({
  as: Component,
  size = 'md',
  color,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const colorClass = color ? `text-${color}` : '';

  return (
    <Component className={`${sizeClasses[size]} ${colorClass} ${className}`} />
  );
};

// AlertIcon Component
interface AlertIconProps {
  status?: 'info' | 'warning' | 'success' | 'error';
  className?: string;
}

export const AlertIcon: React.FC<AlertIconProps> = ({
  status = 'info',
  className = '',
}) => {
  const statusClasses = {
    info: 'text-blue-500',
    warning: 'text-yellow-500',
    success: 'text-green-500',
    error: 'text-red-500',
  };

  return (
    <svg
      className={`w-5 h-5 mr-3 ${statusClasses[status]} ${className}`}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      {status === 'info' && (
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z"
          clipRule="evenodd"
        />
      )}
      {status === 'warning' && (
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      )}
      {status === 'success' && (
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      )}
      {status === 'error' && (
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      )}
    </svg>
  );
};

// Image Component
interface ImageProps {
  src?: string;
  alt?: string;
  boxSize?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  borderRadius?: string | 'full';
  mr?: number;
  ml?: number;
  mt?: number;
  mb?: number;
  className?: string;
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt = '',
  boxSize,
  objectFit = 'cover',
  borderRadius,
  mr,
  ml,
  mt,
  mb,
  className = '',
}) => {
  let classes = className;

  // Handle sizing
  if (boxSize) {
    classes += ` w-[${boxSize}] h-[${boxSize}]`;
  }

  // Handle object fit
  switch (objectFit) {
    case 'cover':
      classes += ' object-cover';
      break;
    case 'contain':
      classes += ' object-contain';
      break;
    case 'fill':
      classes += ' object-fill';
      break;
    case 'none':
      classes += ' object-none';
      break;
    case 'scale-down':
      classes += ' object-scale-down';
      break;
  }

  // Handle border radius
  if (borderRadius === 'full') {
    classes += ' rounded-full';
  } else if (borderRadius) {
    classes += ` rounded-[${borderRadius}]`;
  }

  // Handle margins
  if (mr) classes += ` mr-${mr}`;
  if (ml) classes += ` ml-${ml}`;
  if (mt) classes += ` mt-${mt}`;
  if (mb) classes += ` mb-${mb}`;

  return <img src={src} alt={alt} className={classes} />;
};
