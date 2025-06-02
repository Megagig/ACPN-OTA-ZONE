import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/user.model';
import Pharmacy from '../models/pharmacy.model';
import Event from '../models/event.model';
import Poll from '../models/poll.model';
import Payment from '../models/payment.model';
import AuditTrail from '../models/auditTrail.model';
import asyncHandler from '../middleware/async.middleware';

interface DashboardOverviewStats {
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

interface ActivityItem {
  id: string;
  type:
    | 'user_registration'
    | 'payment'
    | 'event'
    | 'poll'
    | 'pharmacy_approval';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'pending' | 'warning' | 'error';
}

interface UserManagementStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  usersByRole: { role: string; count: number }[];
  recentRegistrations: number;
  userActivity: { month: string; count: number }[];
}

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  enableRegistration: boolean;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  maintenanceMode: boolean;
  maxFileUploadSize: number;
  allowedFileTypes: string[];
  autoApprovalEnabled: boolean;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

/**
 * @desc    Get dashboard overview statistics
 * @route   GET /api/dashboard/overview
 * @access  Private (Admin, SuperAdmin, Secretary)
 */
export const getOverviewStats = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Get current date and 30 days ago for recent activity
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Run all queries in parallel for better performance
      const [
        totalPharmacies,
        activePharmacies,
        pendingApprovals,
        totalUsers,
        totalEvents,
        upcomingEvents,
        totalDuesCollected,
        totalPolls,
        activePolls,
        recentAuditTrails,
      ] = await Promise.all([
        Pharmacy.countDocuments(),
        Pharmacy.countDocuments({ isActive: true }),
        User.countDocuments({ status: 'pending' }),
        User.countDocuments(),
        Event.countDocuments(),
        Event.countDocuments({
          startDate: { $gte: now },
          status: { $in: ['upcoming', 'active'] },
        }),
        Payment.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Poll.countDocuments(),
        Poll.countDocuments({
          endDate: { $gte: now },
          isActive: true,
        }),
        AuditTrail.find({
          createdAt: { $gte: thirtyDaysAgo },
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('userId', 'firstName lastName')
          .lean(),
      ]);

      // Calculate total dues collected
      const duesCollected =
        totalDuesCollected.length > 0 ? totalDuesCollected[0].total : 0;

      // Calculate outstanding dues (simplified - would need more complex logic based on your business rules)
      const totalExpectedDues = totalUsers * 15000; // Assuming ₦15,000 per user per year
      const totalDuesOutstanding = Math.max(
        0,
        totalExpectedDues - duesCollected
      );

      // Format recent activity
      const recentActivity: ActivityItem[] = recentAuditTrails.map(
        (audit: any) => {
          let title = '';
          let description = '';
          let status: 'success' | 'pending' | 'warning' | 'error' = 'success';
          let type: ActivityItem['type'] = 'user_registration';

          switch (audit.action) {
            case 'create':
              if (audit.model === 'User') {
                title = 'New member registration';
                description = `${audit.userId?.firstName || 'User'} ${audit.userId?.lastName || ''} registered as a new member`;
                type = 'user_registration';
                status = 'success';
              } else if (audit.model === 'Event') {
                title = 'New event created';
                description = 'A new event has been scheduled';
                type = 'event';
                status = 'success';
              } else if (audit.model === 'Poll') {
                title = 'New poll created';
                description = 'A new poll has been created';
                type = 'poll';
                status = 'success';
              }
              break;
            case 'update':
              if (audit.model === 'Payment') {
                title = 'Payment processed';
                description = 'A payment has been successfully processed';
                type = 'payment';
                status = 'success';
              } else if (audit.model === 'Pharmacy') {
                title = 'Pharmacy updated';
                description = 'Pharmacy information has been updated';
                type = 'pharmacy_approval';
                status = 'success';
              }
              break;
            case 'approval':
              title = 'Pharmacy approved';
              description = 'A pharmacy has been approved for registration';
              type = 'pharmacy_approval';
              status = 'success';
              break;
            default:
              title = 'System activity';
              description = audit.details || 'System activity recorded';
              type = 'user_registration';
              status = 'success';
          }

          return {
            id: audit._id.toString(),
            type,
            title,
            description,
            timestamp: audit.createdAt.toISOString(),
            status,
          };
        }
      );

      const stats: DashboardOverviewStats = {
        totalPharmacies,
        activePharmacies,
        pendingApprovals,
        totalUsers,
        totalEvents,
        upcomingEvents,
        totalDuesCollected: duesCollected,
        totalDuesOutstanding,
        totalPolls,
        activePolls,
        recentActivity,
      };

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching dashboard overview stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard overview statistics',
      });
    }
  }
);

/**
 * @desc    Get user management statistics
 * @route   GET /api/dashboard/user-management
 * @access  Private (Admin, SuperAdmin)
 */
export const getUserManagementStats = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const [
        totalUsers,
        activeUsers,
        pendingUsers,
        suspendedUsers,
        usersByRole,
        recentRegistrations,
        userActivity,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: 'active' }),
        User.countDocuments({ status: 'pending' }),
        User.countDocuments({ status: 'suspended' }),
        User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } },
          { $project: { role: '$_id', count: 1, _id: 0 } },
        ]),
        User.countDocuments({
          createdAt: { $gte: lastMonth },
        }),
        User.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(now.getFullYear() - 1, 0, 1) },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              month: {
                $concat: [
                  { $toString: '$_id.year' },
                  '-',
                  { $toString: '$_id.month' },
                ],
              },
              count: 1,
              _id: 0,
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]),
      ]);

      const stats: UserManagementStats = {
        totalUsers,
        activeUsers,
        pendingUsers,
        suspendedUsers,
        usersByRole,
        recentRegistrations,
        userActivity,
      };

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching user management stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user management statistics',
      });
    }
  }
);

/**
 * @desc    Get system settings
 * @route   GET /api/dashboard/settings
 * @access  Private (Admin, SuperAdmin)
 */
export const getSystemSettings = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // In a real application, these would come from a settings model or configuration
      // For now, we'll return default/mock settings
      const settings: SystemSettings = {
        siteName: 'ACPN Ota Zone',
        siteDescription:
          'Association of Community Pharmacists of Nigeria - Ota Zone',
        adminEmail: 'admin@acpn-ota.org',
        enableRegistration: true,
        enableEmailNotifications: true,
        enableSMSNotifications: false,
        maintenanceMode: false,
        maxFileUploadSize: 5, // MB
        allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
        autoApprovalEnabled: false,
        sessionTimeout: 30, // minutes
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
        },
      };

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error('Error fetching system settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system settings',
      });
    }
  }
);

/**
 * @desc    Update system settings
 * @route   PUT /api/dashboard/settings
 * @access  Private (SuperAdmin only)
 */
export const updateSystemSettings = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const updates = req.body;

      // In a real application, you would validate and save these to a settings model
      // For now, we'll just return success

      res.status(200).json({
        success: true,
        message: 'System settings updated successfully',
        data: updates,
      });
    } catch (error) {
      console.error('Error updating system settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update system settings',
      });
    }
  }
);

/**
 * @desc    Export dashboard data
 * @route   GET /api/dashboard/export/:type
 * @access  Private (Admin, SuperAdmin)
 */
export const exportDashboardData = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { type } = req.params;

      let data;
      let filename;

      switch (type) {
        case 'users':
          data = await User.find({}, { password: 0, __v: 0 }).lean();
          filename = `users-export-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'pharmacies':
          data = await Pharmacy.find({}, { __v: 0 }).lean();
          filename = `pharmacies-export-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'events':
          data = await Event.find({}, { __v: 0 }).lean();
          filename = `events-export-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'payments':
          data = await Payment.find({}, { __v: 0 }).lean();
          filename = `payments-export-${new Date().toISOString().split('T')[0]}.json`;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid export type',
          });
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );
      res.status(200).json({
        success: true,
        data,
        exportedAt: new Date().toISOString(),
        type,
      });
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export data',
      });
    }
  }
);
