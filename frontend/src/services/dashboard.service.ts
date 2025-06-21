import api from './api';

export interface DashboardOverviewStats {
  totalPharmacies: number;
  activePharmacies: number;
  pendingApprovals: number;
  totalUsers: number;
  totalEvents: number;
  upcomingEvents: number;
  totalDuesCollected: number;
  totalDuesOutstanding: number;
  totalPolls: number;
  activePolls: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type:
    | 'user_registration'
    | 'payment'
    | 'event'
    | 'poll'
    | 'pharmacy_approval';
  title: string;
  description: string | Record<string, any>;
  timestamp: string;
  status?: 'success' | 'pending' | 'warning' | 'error';
}

export interface UserManagementStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  usersByRole: { role: string; count: number }[];
  recentRegistrations: number;
  userActivity: { month: string; count: number }[];
}

export interface SystemSettings {
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  enableRegistration: boolean;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  maintenanceMode: boolean;
  maxFileUploadSize: number;
  allowedFileTypes: string[];
  sessionTimeout: number;
  enableTwoFactorAuth: boolean;
  defaultUserRole: string;
  emailSettings: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpSecure: boolean;
  };
  smsSettings: {
    provider: string;
    apiKey: string;
    senderId: string;
  };
}

class DashboardService {
  /**
   * Get comprehensive dashboard overview statistics
   */
  async getOverviewStats(): Promise<DashboardOverviewStats> {
    try {
      const response = await api.get('/api/dashboard/overview');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      // Return default stats in case of error
      return {
        totalPharmacies: 0,
        activePharmacies: 0,
        pendingApprovals: 0,
        totalUsers: 0,
        totalEvents: 0,
        upcomingEvents: 0,
        totalDuesCollected: 0,
        totalDuesOutstanding: 0,
        totalPolls: 0,
        activePolls: 0,
        recentActivity: [],
      };
    }
  }

  /**
   * Get user management statistics
   */
  async getUserManagementStats(): Promise<UserManagementStats> {
    try {
      const response = await api.get('/api/dashboard/user-management');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user management stats:', error);
      // Return default stats
      return {
        totalUsers: 0,
        activeUsers: 0,
        pendingUsers: 0,
        suspendedUsers: 0,
        usersByRole: [],
        recentRegistrations: 0,
        userActivity: [],
      };
    }
  }

  /**
   * Get recent activity across the system
   */  async getRecentActivity(): Promise<ActivityItem[]> {
    try {
      const response = await api.get('/api/dashboard/overview');
      return response.data?.data?.recentActivity || response.data?.recentActivity || [];
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  /**
   * Get system settings
   */
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const response = await api.get('/api/dashboard/settings');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching system settings:', error);
      // Return default settings
      return {
        siteName: 'ACPN OTA Zone',
        siteDescription:
          'Association of Community Pharmacists of Nigeria - OTA Zone',
        adminEmail: 'admin@acpnota.org',
        enableRegistration: true,
        enableEmailNotifications: true,
        enableSMSNotifications: false,
        maintenanceMode: false,
        maxFileUploadSize: 5242880, // 5MB
        allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
        sessionTimeout: 3600, // 1 hour
        enableTwoFactorAuth: false,
        defaultUserRole: 'member',
        emailSettings: {
          smtpHost: '',
          smtpPort: 587,
          smtpUser: '',
          smtpSecure: true,
        },
        smsSettings: {
          provider: '',
          apiKey: '',
          senderId: '',
        },
      };
    }
  }

  /**
   * Update system settings
   */
  async updateSystemSettings(
    settings: Partial<SystemSettings>
  ): Promise<SystemSettings> {
    try {
      const response = await api.put('/api/dashboard/settings', settings);
      return response.data.data;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  /**
   * Get main dashboard statistics for regular users
   */
  async getMainDashboardStats(): Promise<{
    totalPharmacies: number;
    totalMembers: number;
    upcomingEvents: number;
    activeElections: number;
    totalDuesPaid: number;
  }> {
    try {
      const response = await api.get('/api/dashboard/overview');
      const data = response.data.data;

      return {
        totalPharmacies: data.totalPharmacies || 0,
        totalMembers: data.totalUsers || 0,
        upcomingEvents: data.upcomingEvents || 0,
        activeElections: data.activePolls || 0, // Using activePolls as a proxy for elections
        totalDuesPaid: data.totalDuesCollected || 0,
      };
    } catch (error) {
      console.error('Error fetching main dashboard stats:', error);
      return {
        totalPharmacies: 0,
        totalMembers: 0,
        upcomingEvents: 0,
        activeElections: 0,
        totalDuesPaid: 0,
      };
    }
  }

  /**
   * Export dashboard data as CSV
   */
  async exportDashboardData(
    type: 'overview' | 'users' | 'pharmacies' | 'events'
  ): Promise<void> {
    try {
      const response = await api.get(`/api/dashboard/export/${type}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-dashboard-export-${
        new Date().toISOString().split('T')[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
      throw error;
    }
  }
}

export default new DashboardService();
