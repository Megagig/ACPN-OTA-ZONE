// Fix dues with incorrect payment status
import { Request, Response } from 'express';
import Due, { PaymentStatus } from '../models/due.model';
import asyncHandler from '../middleware/async.middleware';

// @desc    Fix dues with incorrect payment status
// @route   POST /api/dues/fix-payment-status
// @access  Private/Admin
export const fixDuePaymentStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Find all dues with positive amount paid but not marked as fully paid
    const dues = await Due.find({
      $expr: {
        $and: [
          { $gt: ['$amountPaid', 0] }, // amountPaid > 0
          { $lte: ['$balance', 0] }, // balance <= 0
          { $ne: ['$paymentStatus', PaymentStatus.PAID] }, // paymentStatus is not 'paid'
        ],
      },
    });

    console.log(`Found ${dues.length} dues with incorrect payment status`);

    // Update each due with correct payment status
    let updatedCount = 0;
    for (const due of dues) {
      // Double check balance calculation
      const balance = due.totalAmount - due.amountPaid;

      if (balance <= 0 && due.paymentStatus !== PaymentStatus.PAID) {
        due.paymentStatus = PaymentStatus.PAID;
        due.balance = 0; // Ensure balance is exactly 0
        await due.save();
        updatedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Fixed payment status for ${updatedCount} dues`,
      data: {
        examined: dues.length,
        updated: updatedCount,
      },
    });
  }
);
