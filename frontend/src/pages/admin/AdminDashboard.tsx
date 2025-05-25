import React, { useState } from 'react';
import PendingApprovals from '../../components/admin/PendingApprovals';
import ApprovedUsers from '../../components/admin/ApprovedUsers';

// Admin dashboard tabs - using string literal union type
type AdminTab =
  | 'overview'
  | 'approvals'
  | 'approved_users'
  | 'users'
  | 'settings';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('approvals');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'approvals':
        return <PendingApprovals />;
      case 'approved_users':
        return <ApprovedUsers />;
      case 'users':
        return <div>User Management (Coming Soon)</div>;
      case 'settings':
        return <div>Admin Settings (Coming Soon)</div>;
      case 'overview':
      default:
        return <div>Admin Overview (Coming Soon)</div>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`${
                activeTab === 'approvals'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Pending Approvals
            </button>
            <button
              onClick={() => setActiveTab('approved_users')}
              className={`${
                activeTab === 'approved_users'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Approved Users
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`${
                activeTab === 'settings'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Settings
            </button>
          </nav>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
