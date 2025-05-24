import React, { useState } from 'react';
import PendingApprovals from '../../components/admin/PendingApprovals';

// Admin dashboard tabs
enum AdminTab {
  OVERVIEW = 'overview',
  APPROVALS = 'approvals',
  USERS = 'users',
  SETTINGS = 'settings',
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>(AdminTab.APPROVALS);

  const renderTabContent = () => {
    switch (activeTab) {
      case AdminTab.APPROVALS:
        return <PendingApprovals />;
      case AdminTab.USERS:
        return <div>User Management (Coming Soon)</div>;
      case AdminTab.SETTINGS:
        return <div>Admin Settings (Coming Soon)</div>;
      case AdminTab.OVERVIEW:
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
              onClick={() => setActiveTab(AdminTab.OVERVIEW)}
              className={`${
                activeTab === AdminTab.OVERVIEW
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab(AdminTab.APPROVALS)}
              className={`${
                activeTab === AdminTab.APPROVALS
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Pending Approvals
            </button>
            <button
              onClick={() => setActiveTab(AdminTab.USERS)}
              className={`${
                activeTab === AdminTab.USERS
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab(AdminTab.SETTINGS)}
              className={`${
                activeTab === AdminTab.SETTINGS
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm`}
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
