import React, { useState } from 'react';
import PendingApprovals from '../../components/admin/PendingApprovals';
import ApprovedUsers from '../../components/admin/ApprovedUsers';
import AdminEventWidget from '../../components/admin/AdminEventWidget';
import { useTheme } from '../../context/ThemeContext';

// Admin dashboard tabs - using string literal union type
type AdminTab =
  | 'overview'
  | 'approvals'
  | 'approved_users'
  | 'events'
  | 'users'
  | 'settings';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('approvals');
  const { theme } = useTheme();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'approvals':
        return <PendingApprovals />;
      case 'approved_users':
        return <ApprovedUsers />;
      case 'events':
        return <AdminEventWidget />;
      case 'users':
        return (
          <div className="text-foreground">User Management (Coming Soon)</div>
        );
      case 'settings':
        return (
          <div className="text-foreground">Admin Settings (Coming Soon)</div>
        );
      case 'overview':
      default:
        return (
          <div className="text-foreground">Admin Overview (Coming Soon)</div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground">
        Admin Dashboard
      </h1>

      <div className="mb-6">
        <div className="border-b border-border">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              } w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`${
                activeTab === 'approvals'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              } w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Pending Approvals
            </button>
            <button
              onClick={() => setActiveTab('approved_users')}
              className={`${
                activeTab === 'approved_users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              } w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Approved Users
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`${
                activeTab === 'events'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              } w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              } w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`${
                activeTab === 'settings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              } w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Settings
            </button>
          </nav>
        </div>
      </div>

      <div className="bg-card shadow-md rounded-lg p-6 text-foreground">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
