import React from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardHome from '../../pages/dashboard/DashboardHome';
import ModernMemberDashboard from './ModernMemberDashboard';

/**
 * A component that conditionally renders the appropriate dashboard based on the user's role
 * Admin, superadmin, secretary, treasurer, and financial_secretary see the admin dashboard
 * Regular members see the member dashboard
 */
const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();

  // Array of roles that should see the admin dashboard
  const adminRoles = [
    'admin',
    'superadmin',
    'secretary',
    'treasurer',
    'financial_secretary',
  ];

  // Check if user has an admin role
  const isAdminRole = user?.role && adminRoles.includes(user.role);
  // Render the appropriate dashboard based on role
  return isAdminRole ? <DashboardHome /> : <ModernMemberDashboard />;
};

export default RoleBasedDashboard;
