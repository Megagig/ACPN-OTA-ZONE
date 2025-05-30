import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../ui/ThemeToggle';

interface DashboardLayoutProps {
  children?: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define navigation items based on user role
  const getNavItems = () => {
    const commonItems = [
      { name: 'Dashboard', path: '/dashboard', icon: 'home' },
      { name: 'My Profile', path: '/profile', icon: 'user' },
    ];

    const adminItems = [
      {
        name: 'Admin Dashboard',
        path: '/admin/dashboard',
        icon: 'tachometer-alt',
      },
      { name: 'Pharmacies', path: '/admin/pharmacies', icon: 'building' },
      { name: 'Users', path: '/users', icon: 'users' },
      { name: 'Events', path: '/events', icon: 'calendar' },
      { name: 'Elections', path: '/elections', icon: 'vote-yea' },
      { name: 'Polls', path: '/polls', icon: 'poll' },
      { name: 'Communications', path: '/communications', icon: 'envelope' },
      { name: 'Finances', path: '/finances', icon: 'money-bill' },
      {
        name: 'Financial Management',
        path: '/dashboard/financial-management',
        icon: 'chart-line',
      },
      { name: 'Documents', path: '/documents', icon: 'file-alt' },
      { name: 'Settings', path: '/settings', icon: 'cog' },
    ];

    const memberItems = [
      { name: 'My Pharmacy', path: '/my-pharmacy', icon: 'building' },
      { name: 'My Documents', path: '/my-documents', icon: 'file-alt' },
      { name: 'Dues & Payments', path: '/payments', icon: 'money-bill' },
      { name: 'Events', path: '/events', icon: 'calendar' },
      { name: 'Elections', path: '/elections', icon: 'vote-yea' },
      { name: 'Messages', path: '/messages', icon: 'envelope' },
    ];

    if (['admin', 'superadmin'].includes(user?.role)) {
      return [...commonItems, ...adminItems];
    } else if (['treasurer', 'financial_secretary'].includes(user?.role)) {
      return [
        ...commonItems,
        { name: 'Pharmacies', path: '/pharmacies', icon: 'building' },
        { name: 'Finances', path: '/finances', icon: 'money-bill' },
        {
          name: 'Financial Management',
          path: '/dashboard/financial-management',
          icon: 'chart-line',
        },
        { name: 'Dues', path: '/dues', icon: 'receipt' },
        { name: 'Donations', path: '/donations', icon: 'gift' },
      ];
    } else if (user?.role === 'secretary') {
      return [
        ...commonItems,
        { name: 'Pharmacies', path: '/pharmacies', icon: 'building' },
        { name: 'Events', path: '/events', icon: 'calendar' },
        { name: 'Communications', path: '/communications', icon: 'envelope' },
        { name: 'Documents', path: '/documents', icon: 'file-alt' },
      ];
    } else {
      return [...commonItems, ...memberItems];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border transition duration-300 ease-in-out transform md:translate-x-0 md:static md:h-screen`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-center h-16 border-b border-border">
            <h2 className="text-xl font-bold text-primary">ACPN Ota Zone</h2>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 px-4 space-y-1 overflow-y-auto">
            <div className="py-4">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                MAIN
              </p>
              <nav className="mt-2 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <i
                      className={`fas fa-${item.icon} mr-3 text-muted-foreground`}
                    ></i>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Utilities Section */}
            {['admin', 'superadmin'].includes(user?.role) && (
              <div className="py-4">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  UTILITIES
                </p>
                <nav className="mt-2 space-y-1">
                  <Link
                    to="/test-api"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      location.pathname === '/test-api'
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <i className="fas fa-network-wired mr-3 text-muted-foreground"></i>
                    API Connection Test
                  </Link>
                  <Link
                    to="/component-preview"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      location.pathname === '/component-preview'
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <i className="fas fa-palette mr-3 text-muted-foreground"></i>
                    Component Preview
                  </Link>
                </nav>
              </div>
            )}
          </div>

          {/* User Profile Section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  {user?.firstName ? user.firstName.charAt(0) : 'U'}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-foreground">
                  {user ? `${user.firstName} ${user.lastName}` : 'User'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role || 'Member'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto text-muted-foreground hover:text-destructive"
                title="Logout"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation */}
        <header className="flex items-center justify-between h-16 px-6 bg-card border-b border-border">
          <button
            onClick={toggleSidebar}
            className="text-foreground/70 focus:outline-none md:hidden"
          >
            <i className={`fas fa-${sidebarOpen ? 'times' : 'bars'}`}></i>
          </button>
          <div className="flex items-center ml-auto space-x-4">
            <button className="text-foreground/70 hover:text-primary">
              <i className="fas fa-bell"></i>
            </button>
            <button className="text-foreground/70 hover:text-primary">
              <i className="fas fa-envelope"></i>
            </button>
            {/* Theme Toggle Button */}
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
