import * as React from 'react';
import { cn } from '../../lib/utils/cn';

// NavBar Component
interface NavBarProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  children?: React.ReactNode;
  variant?: 'default' | 'transparent' | 'colored';
  sticky?: boolean;
  fixed?: boolean;
}

const NavBar = React.forwardRef<HTMLElement, NavBarProps>(
  (
    {
      className,
      logo,
      children,
      variant = 'default',
      sticky = false,
      fixed = false,
      ...props
    },
    ref
  ) => {
    return (
      <nav
        ref={ref}
        className={cn(
          'px-4 py-2 w-full flex items-center justify-between',
          variant === 'default' && 'bg-white border-b border-gray-200',
          variant === 'transparent' && 'bg-transparent',
          variant === 'colored' && 'bg-primary-600 text-white',
          sticky && 'sticky top-0 z-30',
          fixed && 'fixed top-0 left-0 right-0 z-30',
          className
        )}
        {...props}
      >
        {logo && <div className="flex-shrink-0 flex items-center">{logo}</div>}
        <div className="flex-grow">{children}</div>
      </nav>
    );
  }
);
NavBar.displayName = 'NavBar';

// NavMenu Component
interface NavMenuProps extends React.HTMLAttributes<HTMLUListElement> {
  orientation?: 'horizontal' | 'vertical';
}

const NavMenu = React.forwardRef<HTMLUListElement, NavMenuProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => {
    return (
      <ul
        ref={ref}
        className={cn(
          'flex gap-2',
          orientation === 'horizontal' && 'flex-row items-center',
          orientation === 'vertical' && 'flex-col items-start',
          className
        )}
        {...props}
      />
    );
  }
);
NavMenu.displayName = 'NavMenu';

// NavItem Component
interface NavItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  active?: boolean;
}

const NavItem = React.forwardRef<HTMLLIElement, NavItemProps>(
  ({ className, active, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn('relative', active && 'font-medium', className)}
        {...props}
      />
    );
  }
);
NavItem.displayName = 'NavItem';

// NavLink Component
interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  variant?: 'default' | 'button' | 'minimal';
}

const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, active, variant = 'default', ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          'block py-2 px-3 text-sm rounded-md transition-colors',
          // Default variant
          variant === 'default' && 'hover:bg-gray-100',
          variant === 'default' &&
            active &&
            'bg-gray-100 font-medium text-primary-600',
          // Button variant
          variant === 'button' && 'border hover:border-gray-300',
          variant === 'button' &&
            active &&
            'bg-primary-600 text-white border-primary-600 hover:border-primary-700 hover:bg-primary-700',
          // Minimal variant
          variant === 'minimal' && 'px-2 hover:text-primary-600',
          variant === 'minimal' && active && 'text-primary-600 font-medium',
          className
        )}
        {...props}
      />
    );
  }
);
NavLink.displayName = 'NavLink';

// Sidebar Component
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
  width?: string;
  collapsedWidth?: string;
  onToggle?: () => void;
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      className,
      collapsed = false,
      width = '240px',
      collapsedWidth = '64px',
      onToggle,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'h-screen flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
          collapsed ? `w-[${collapsedWidth}]` : `w-[${width}]`,
          className
        )}
        {...props}
      >
        {/* Toggle button */}
        {onToggle && (
          <button
            className="self-end p-2 m-2 rounded-full hover:bg-gray-100"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${
                collapsed ? 'rotate-180' : ''
              }`}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <div className="flex-1 overflow-y-auto">{props.children}</div>
      </div>
    );
  }
);
Sidebar.displayName = 'Sidebar';

// SidebarSection Component
interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  collapsed?: boolean;
}

const SidebarSection = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, title, collapsed = false, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('py-2', className)} {...props}>
        {title && !collapsed && (
          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </h3>
        )}
        <div className="mt-1">{props.children}</div>
      </div>
    );
  }
);
SidebarSection.displayName = 'SidebarSection';

// SidebarItem Component
interface SidebarItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  icon?: React.ReactNode;
  active?: boolean;
  collapsed?: boolean;
}

const SidebarItem = React.forwardRef<HTMLLIElement, SidebarItemProps>(
  ({ className, icon, active, collapsed = false, children, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn(
          'relative flex items-center px-3 py-2 mx-2 rounded-md text-sm cursor-pointer transition-colors',
          active
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-foreground/70 hover:bg-accent hover:text-foreground',
          className
        )}
        {...props}
      >
        {icon && (
          <span className={cn('flex-shrink-0', !collapsed && 'mr-3')}>
            {icon}
          </span>
        )}
        {!collapsed && children}
      </li>
    );
  }
);
SidebarItem.displayName = 'SidebarItem';

// Breadcrumbs Component
interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  separator?: React.ReactNode;
}

const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ className, separator = '/', ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn('flex', className)}
        aria-label="Breadcrumb"
        {...props}
      >
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          {React.Children.map(props.children, (child, index) => {
            if (index === 0) return child;

            return (
              <>
                <li className="flex items-center">
                  <span className="mx-2 text-gray-400">{separator}</span>
                </li>
                {child}
              </>
            );
          })}
        </ol>
      </nav>
    );
  }
);
Breadcrumbs.displayName = 'Breadcrumbs';

// BreadcrumbItem Component
interface BreadcrumbItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  href?: string;
  active?: boolean;
}

const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, href, active, children, ...props }, ref) => {
    const content = href ? (
      <a
        href={href}
        className={cn(
          'text-sm',
          active
            ? 'font-medium text-gray-900'
            : 'text-gray-600 hover:text-gray-900'
        )}
      >
        {children}
      </a>
    ) : (
      <span className="text-sm font-medium text-gray-900">{children}</span>
    );

    return (
      <li
        ref={ref}
        className={cn('inline-flex items-center', className)}
        aria-current={active ? 'page' : undefined}
        {...props}
      >
        {content}
      </li>
    );
  }
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

export {
  NavBar,
  NavMenu,
  NavItem,
  NavLink,
  Sidebar,
  SidebarSection,
  SidebarItem,
  Breadcrumbs,
  BreadcrumbItem,
};
