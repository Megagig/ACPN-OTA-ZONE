import React, { ReactNode } from 'react';

// Badge Component
interface BadgeProps {
  children: ReactNode;
  colorScheme?: 'blue' | 'green' | 'red' | 'gray' | 'orange' | 'purple';
  variant?: 'solid' | 'outline' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  colorScheme = 'gray',
  variant = 'solid',
  size = 'md',
  className = '',
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
      className={`inline-flex items-center font-medium rounded-full ${getColorClasses()} ${getSizeClasses()} ${className}`}
    >
      {children}
    </span>
  );
};

// Button Component
interface ButtonProps {
  children: ReactNode;
  colorScheme?: 'blue' | 'green' | 'red' | 'gray';
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
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
}) => {
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
    };
    return baseClasses[colorScheme][variant];
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const disabled = isLoading || isDisabled;

  return (
    <button
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
};

// Text Component
interface TextProps {
  children: ReactNode;
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'gray' | 'red' | 'blue' | 'green';
  className?: string;
}

export const Text: React.FC<TextProps> = ({
  children,
  fontSize = 'base',
  fontWeight = 'normal',
  color = 'gray',
  className = '',
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
      red: 'text-red-600',
      blue: 'text-blue-600',
      green: 'text-green-600',
    };
    return colors[color];
  };

  return (
    <span
      className={`${getFontSizeClass()} ${getFontWeightClass()} ${getColorClass()} ${className}`}
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
}

export const Heading: React.FC<HeadingProps> = ({
  children,
  as = 'h2',
  size = 'lg',
  className = '',
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
    <Component className={`${getSizeClass()} text-gray-900 ${className}`}>
      {children}
    </Component>
  );
};

// Divider Component
export const Divider: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return <hr className={`border-t border-gray-200 ${className}`} />;
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

// Tab Components
interface TabsProps {
  children: ReactNode;
  index?: number;
  onChange?: (index: number) => void;
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
}

export const VStack: React.FC<VStackProps> = ({
  children,
  spacing = 4,
  align = 'stretch',
  className = '',
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
      className={`flex flex-col ${getAlignClass()} ${getSpacingClass()} ${className}`}
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
}

export const HStack: React.FC<HStackProps> = ({
  children,
  spacing = 4,
  align = 'center',
  className = '',
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

  const getSpacingClass = () => `space-x-${spacing}`;

  return (
    <div
      className={`flex ${getAlignClass()} ${getSpacingClass()} ${className}`}
    >
      {children}
    </div>
  );
};

// Flex Component
interface FlexProps {
  children: ReactNode;
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  className?: string;
}

export const Flex: React.FC<FlexProps> = ({
  children,
  justify = 'start',
  align = 'stretch',
  direction = 'row',
  wrap = 'nowrap',
  className = '',
}) => {
  const getJustifyClass = () => {
    switch (justify) {
      case 'center':
        return 'justify-center';
      case 'end':
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
      className={`flex ${getDirectionClass()} ${getJustifyClass()} ${getAlignClass()} ${getWrapClass()} ${className}`}
    >
      {children}
    </div>
  );
};

// Box Component
interface BoxProps {
  children: ReactNode;
  className?: string;
}

// Box Component
interface BoxProps {
  children: ReactNode;
  className?: string;
  p?: number;
  mb?: number;
  mt?: number;
  textAlign?: 'left' | 'center' | 'right';
}

export const Box: React.FC<BoxProps> = ({
  children,
  className = '',
  p,
  mb,
  mt,
  textAlign,
}) => {
  const paddingClass = p ? `p-${p}` : '';
  const marginBottomClass = mb ? `mb-${mb}` : '';
  const marginTopClass = mt ? `mt-${mt}` : '';
  const textAlignClass = textAlign ? `text-${textAlign}` : '';

  return (
    <div
      className={`${paddingClass} ${marginBottomClass} ${marginTopClass} ${textAlignClass} ${className}`}
    >
      {children}
    </div>
  );
};

// Table Components
interface TableProps {
  children: ReactNode;
  variant?: 'simple' | 'striped';
  className?: string;
}

export const Table: React.FC<TableProps> = ({
  children,
  variant = 'simple',
  className = '',
}) => (
  <table
    className={`min-w-full ${
      variant === 'striped' ? 'table-striped' : ''
    } ${className}`}
  >
    {children}
  </table>
);

interface TheadProps {
  children: ReactNode;
  className?: string;
}

export const Thead: React.FC<TheadProps> = ({ children, className = '' }) => (
  <thead className={`bg-gray-50 ${className}`}>{children}</thead>
);

interface TbodyProps {
  children: ReactNode;
  className?: string;
}

export const Tbody: React.FC<TbodyProps> = ({ children, className = '' }) => (
  <tbody className={`divide-y divide-gray-200 ${className}`}>{children}</tbody>
);

interface TrProps {
  children: ReactNode;
  className?: string;
}

export const Tr: React.FC<TrProps> = ({ children, className = '' }) => (
  <tr className={`hover:bg-gray-50 ${className}`}>{children}</tr>
);

interface ThProps {
  children: ReactNode;
  className?: string;
}

export const Th: React.FC<ThProps> = ({ children, className = '' }) => (
  <th
    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
  >
    {children}
  </th>
);

interface TdProps {
  children: ReactNode;
  className?: string;
}

export const Td: React.FC<TdProps> = ({ children, className = '' }) => (
  <td
    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}
  >
    {children}
  </td>
);

// Input Components
interface InputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChange,
  type = 'text',
  className = '',
  disabled = false,
}) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    disabled={disabled}
    className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
      disabled ? 'bg-gray-100 cursor-not-allowed' : ''
    } ${className}`}
  />
);

// Select Component
interface SelectProps {
  children: ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  disabled?: boolean;
  maxW?: { [key: string]: string };
  leftIcon?: ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  children,
  value,
  onChange,
  className = '',
  disabled = false,
}) => (
  <select
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

// InputGroup Components
interface InputGroupProps {
  children: ReactNode;
  className?: string;
  maxW?: { [key: string]: string };
}

export const InputGroup: React.FC<InputGroupProps> = ({
  children,
  className = '',
}) => <div className={`relative ${className}`}>{children}</div>;

interface InputLeftElementProps {
  children: ReactNode;
  pointerEvents?: string;
  className?: string;
}

export const InputLeftElement: React.FC<InputLeftElementProps> = ({
  children,
  className = '',
}) => (
  <div
    className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${className}`}
  >
    {children}
  </div>
);

// IconButton Component
interface IconButtonProps {
  'aria-label': string;
  icon: ReactNode;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'blue' | 'green' | 'red' | 'gray';
  onClick?: () => void;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  'aria-label': ariaLabel,
  icon,
  variant = 'solid',
  size = 'md',
  colorScheme = 'gray',
  onClick,
  className = '',
}) => {
  const sizeClasses = {
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
      className={`inline-flex items-center justify-center rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${sizeClasses[size]} ${variantClasses[variant][colorScheme]} ${className}`}
    >
      {icon}
    </button>
  );
};

// Menu Components
interface MenuProps {
  children: ReactNode;
  className?: string;
}

export const Menu: React.FC<MenuProps> = ({ children, className = '' }) => (
  <div className={`relative inline-block text-left ${className}`}>
    {children}
  </div>
);

interface MenuButtonProps {
  children: ReactNode;
  as?: React.ElementType;
  className?: string;
  'aria-label'?: string;
  icon?: ReactNode;
  variant?: string;
  size?: string;
}

export const MenuButton: React.FC<MenuButtonProps> = ({
  children,
  as: Component = 'button',
  className = '',
  ...props
}) => (
  <Component
    className={`inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}
    {...props}
  >
    {children}
  </Component>
);

interface MenuListProps {
  children: ReactNode;
  className?: string;
}

export const MenuList: React.FC<MenuListProps> = ({
  children,
  className = '',
}) => (
  <div
    className={`origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 ${className}`}
  >
    <div className="py-1">{children}</div>
  </div>
);

interface MenuItemProps {
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  color?: string;
  className?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  children,
  icon,
  onClick,
  color,
  className = '',
}) => (
  <button
    onClick={onClick}
    className={`${
      color === 'red.500' ? 'text-red-500' : 'text-gray-700'
    } group flex items-center px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 w-full text-left ${className}`}
  >
    {icon && <span className="mr-3">{icon}</span>}
    {children}
  </button>
);

// AlertDialog Components
interface AlertDialogProps {
  isOpen: boolean;
  leastDestructiveRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
  children: ReactNode;
  className?: string;
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
}

export const FormControl: React.FC<FormControlProps> = ({
  children,
  isInvalid = false,
  className = '',
}) => (
  <div className={`${isInvalid ? 'text-red-600' : ''} ${className}`}>
    {children}
  </div>
);

interface FormLabelProps {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: 'xs' | 'sm' | 'base' | 'lg';
}

export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  htmlFor,
  className = '',
  textAlign = 'left',
  fontSize = 'sm',
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

  return (
    <label
      htmlFor={htmlFor}
      className={`block font-medium text-gray-700 mb-1 ${getTextAlignClass()} ${getFontSizeClass()} ${className}`}
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
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  placeholder,
  value,
  onChange,
  className = '',
  disabled = false,
  rows = 3,
  maxLength,
}) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
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
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  className = '',
  disabled = false,
  children,
}) => (
  <label className={`inline-flex items-center ${className}`}>
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`block h-6 w-10 rounded-full ${
          checked ? 'bg-blue-500' : 'bg-gray-300'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      />
      <div
        className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition ${
          checked ? 'transform translate-x-4' : ''
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
}

export const Collapse: React.FC<CollapseProps> = ({
  children,
  in: isOpen,
  className = '',
}) => (
  <div
    className={`transition-all duration-300 overflow-hidden ${
      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
    } ${className}`}
  >
    {children}
  </div>
);
