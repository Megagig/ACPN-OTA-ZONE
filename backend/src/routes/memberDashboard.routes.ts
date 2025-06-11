import express from 'express';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.middleware';
import User from '../models/user.model';
import Pharmacy from '../models/pharmacy.model';
import Event from '../models/event.model';
import Payment, { IPayment } from '../models/payment.model';
import Due from '../models/due.model';
import asyncHandler from '../middleware/async.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';

// Define a custom interface to extend the Express Request type
interface AuthenticatedRequest extends Request {
  user?: {
    _id: mongoose.Types.ObjectId | string;
    role?: string;
    [key: string]: any;
  };
}

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get member dashboard overview stats
router.get(
  '/overview',
  cacheMiddleware('member-dashboard', { ttl: 300 }), // Cache for 5 minutes
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get the current user
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Find the pharmacy associated with this user
      const pharmacy = await Pharmacy.findOne({
        userId:
          typeof userId === 'string'
            ? new mongoose.Types.ObjectId(userId)
            : userId,
      });
      const pharmacyId = pharmacy?._id;

      // Get current date and 30 days ago for upcoming events and recent activity
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get dues data for the user/pharmacy
      let financialSummary = {
        totalDue: 0,
        totalPaid: 0,
        remainingBalance: 0,
      };

      let attendanceSummary = {
        attended: 0,
        missed: 0,
      };

      // Define the type for activity items
      interface ActivityItem {
        id: string;
        type: string;
        title: string;
        description: string;
        timestamp: Date;
        status?: string;
      }

      let recentActivity: ActivityItem[] = [];

      if (pharmacyId) {
        try {
          // Get financial data
          const [dues, payments] = await Promise.all([
            Due.find({ pharmacyId }),
            Payment.find({ pharmacyId }),
          ]);

          // Calculate financial summary
          const totalDue = dues.reduce((sum, due) => sum + due.amount, 0);
          const totalPaid = payments
            .filter((payment) => payment.approvalStatus === 'approved')
            .reduce((sum, payment) => sum + payment.amount, 0);

          financialSummary = {
            totalDue,
            totalPaid,
            remainingBalance: totalDue - totalPaid,
          };

          // Get recent activity
          const recentPayments = await Payment.find({ pharmacyId })
            .sort({ createdAt: -1 })
            .limit(5);

          recentActivity = recentPayments.map((payment) => {
            // Cast the document to ensure _id is properly typed
            const typedPayment = payment as unknown as {
              _id: mongoose.Types.ObjectId;
              amount: number;
              approvalStatus: string;
              createdAt: Date;
            };

            return {
              id: typedPayment._id.toString(),
              type: 'payment',
              title: 'Payment Submitted',
              description: `Payment of ₦${typedPayment.amount} submitted`,
              timestamp: typedPayment.createdAt,
              status:
                typedPayment.approvalStatus === 'approved'
                  ? 'success'
                  : typedPayment.approvalStatus === 'rejected'
                    ? 'error'
                    : 'pending',
            };
          });
        } catch (dbError) {
          console.error('Error querying pharmacy data:', dbError);
          // If there's an error, we'll continue with default values
        }
      }

      // Get upcoming events
      let upcomingEvents = 0;
      try {
        upcomingEvents = await Event.find({
          startDate: { $gte: now },
          status: 'published',
        }).countDocuments();
      } catch (eventError) {
        console.error('Error fetching upcoming events:', eventError);
        // If there's an error, we'll continue with default value of 0
      }

      return res.status(200).json({
        success: true,
        data: {
          userFinancialSummary: financialSummary,
          userAttendanceSummary: attendanceSummary,
          upcomingEvents,
          recentActivity,
        },
      });
    } catch (error) {
      console.error('Error fetching member dashboard stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching dashboard stats',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.stack
              : null
            : undefined,
      });
    }
  })
);

// Get member's payments
router.get(
  '/payments',
  cacheMiddleware('member-payments', { ttl: 180 }), // Cache for 3 minutes
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Get pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Find the pharmacy associated with this user
      const pharmacy = await Pharmacy.findOne({
        userId:
          typeof userId === 'string'
            ? new mongoose.Types.ObjectId(userId)
            : userId,
      });

      if (!pharmacy) {
        return res.status(200).json({
          success: true,
          data: {
            payments: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          },
        });
      }

      const pharmacyId = pharmacy._id;

      try {
        // Get the total count for pagination
        const total = await Payment.countDocuments({ pharmacyId });

        // Get the payments
        const payments = await Payment.find({ pharmacyId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('dueId', 'title description amount dueDate');

        return res.status(200).json({
          success: true,
          data: {
            payments,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        });
      } catch (dbError) {
        console.error('Error querying payments data:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Error retrieving payment data',
          error:
            dbError instanceof Error
              ? dbError.message
              : 'Unknown database error',
        });
      }
    } catch (error) {
      console.error('Error fetching member payments:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching payments',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.stack
              : null
            : undefined,
      });
    }
  })
);

export default router;
