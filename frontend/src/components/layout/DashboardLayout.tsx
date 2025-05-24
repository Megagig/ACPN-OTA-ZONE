import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface DashboardLayoutProps {
  children?: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
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
      { name: 'Pharmacies', path: '/pharmacies', icon: 'building' },
      { name: 'Users', path: '/users', icon: 'users' },
      { name: 'Events', path: '/events', icon: 'calendar' },
      { name: 'Elections', path: '/elections', icon: 'vote-yea' },
      { name: 'Polls', path: '/polls', icon: 'poll' },
      { name: 'Communications', path: '/communications', icon: 'envelope' },
      { name: 'Finances', path: '/finances', icon: 'money-bill' },
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
    } else if (user?.role === 'treasurer') {
      return [
        ...commonItems,
        { name: 'Pharmacies', path: '/pharmacies', icon: 'building' },
        { name: 'Finances', path: '/finances', icon: 'money-bill' },
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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-30 w-64 bg-white border-r transition duration-300 ease-in-out transform md:translate-x-0 md:static md:h-screen`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-center h-16 border-b">
            <h2 className="text-xl font-bold text-indigo-600">ACPN Ota Zone</h2>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 px-4 space-y-1 overflow-y-auto">
            <div className="py-4">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                MAIN
              </p>
              <nav className="mt-2 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      location.pathname === item.path
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <i className={`fas fa-${item.icon} mr-3 text-gray-400`}></i>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* User Profile Section */}
          <div className="p-4 border-t">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                  {user?.firstName ? user.firstName.charAt(0) : 'U'}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user ? `${user.firstName} ${user.lastName}` : 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role || 'Member'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto text-gray-400 hover:text-red-500"
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
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b">
          <button
            onClick={toggleSidebar}
            className="text-gray-500 focus:outline-none md:hidden"
          >
            <i className={`fas fa-${sidebarOpen ? 'times' : 'bars'}`}></i>
          </button>
          <div className="flex items-center ml-auto space-x-4">
            <button className="text-gray-500 hover:text-indigo-600">
              <i className="fas fa-bell"></i>
            </button>
            <button className="text-gray-500 hover:text-indigo-600">
              <i className="fas fa-envelope"></i>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
