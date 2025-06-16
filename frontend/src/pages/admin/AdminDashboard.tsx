import React, { useState } from 'react';
import PendingApprovals from '../../components/admin/PendingApprovals';
import ApprovedUsers from '../../components/admin/ApprovedUsers';
import AdminEventWidget from '../../components/admin/AdminEventWidget';
import AdminOverview from '../../components/admin/AdminOverview';
import UserManagement from '../../components/admin/UserManagement';
import AdminSettings from '../../components/admin/AdminSettings';
import { useNavigate } from 'react-router-dom';

// Admin dashboard tabs - using string literal union type
type AdminTab =
  | 'overview'
  | 'approvals'
  | 'approved_users'
  | 'events'
  | 'users'
  | 'settings';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const navigate = useNavigate();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview />;
      case 'approvals':
        return <PendingApprovals />;
      case 'approved_users':
        return <ApprovedUsers />;
      case 'events':
        return <AdminEventWidget />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
          Manage and monitor your organization
        </p>
      </div>

      {/* Tab Navigation - Mobile Responsive */}
      <div className="mb-4 sm:mb-6">
        <div className="border-b border-border">
          {/* Mobile Dropdown for Tabs */}
          <div className="block sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as AdminTab)}
              className="w-full px-3 py-2 bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="overview">Overview</option>
              <option value="approvals">Pending Approvals</option>
              <option value="approved_users">Approved Users</option>
              <option value="events">Events</option>
              <option value="users">User Management</option>
              <option value="settings">Settings</option>
            </select>
            <button
              onClick={() => navigate('/admin/dues-management')}
              className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-md"
            >
              Dues Management
            </button>
          </div>

          {/* Desktop Tab Navigation */}
          <nav
            className="hidden sm:flex -mb-px overflow-x-auto"
            aria-label="Tabs"
          >
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              } flex-1 min-w-0 py-3 px-2 text-center border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`${
                activeTab === 'approvals'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              } flex-1 min-w-0 py-3 px-2 text-center border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap`}
            >
              <span className="hidden md:inline">Pending </span>Approvals
            </button>
            <button
              onClick={() => setActiveTab('approved_users')}
              className={`${
                activeTab === 'approved_users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              } flex-1 min-w-0 py-3 px-2 text-center border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap`}
            >
              <span className="hidden md:inline">Approved </span>Users
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`${
                activeTab === 'events'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              } flex-1 min-w-0 py-3 px-2 text-center border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              } flex-1 min-w-0 py-3 px-2 text-center border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap`}
            >
              <span className="hidden lg:inline">User </span>Management
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`${
                activeTab === 'settings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              } flex-1 min-w-0 py-3 px-2 text-center border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap`}
            >
              Settings
            </button>
            <button
              onClick={() => navigate('/admin/dues-management')}
              className="flex-1 min-w-0 py-3 px-2 text-center border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap border-transparent text-blue-600 hover:text-blue-800 hover:border-blue-400"
            >
              Dues Management
            </button>
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-card shadow-md rounded-lg p-3 sm:p-6 text-foreground">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
