import { Request, Response, NextFunction } from 'express';
import FinancialRecord, {
  RecordType,
  CategoryType,
} from '../models/financialRecord.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all financial records
// @route   GET /api/financial-records
// @access  Private/Admin/Treasurer
export const getAllFinancialRecords = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only admin and treasurer can view all financial records
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to view financial records`,
          403
        )
      );
    }

    // Implement pagination, filtering and sorting
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Filter by record type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by category if provided
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string),
      };
    }

    // Search by description
    if (req.query.search) {
      query.description = { $regex: req.query.search, $options: 'i' };
    }

    const records = await FinancialRecord.find(query)
      .populate({
        path: 'recordedBy',
        select: 'firstName lastName email',
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ date: -1 });

    // Get total count
    const total = await FinancialRecord.countDocuments(query);

    res.status(200).json({
      success: true,
      count: records.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
      },
      data: records,
    });
  }
);

// @desc    Get single financial record
// @route   GET /api/financial-records/:id
// @access  Private/Admin/Treasurer
export const getFinancialRecord = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only admin and treasurer can view financial records
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to view financial records`,
          403
        )
      );
    }

    const record = await FinancialRecord.findById(req.params.id).populate({
      path: 'recordedBy',
      select: 'firstName lastName email',
    });

    if (!record) {
      return next(
        new ErrorResponse(
          `Financial record not found with id of ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  }
);

// @desc    Create new financial record
// @route   POST /api/financial-records
// @access  Private/Admin/Treasurer
export const createFinancialRecord = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only admin and treasurer can create financial records
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to create financial records`,
          403
        )
      );
    }

    // Validate amount is positive
    if (req.body.amount <= 0) {
      return next(new ErrorResponse(`Amount must be greater than 0`, 400));
    }

    // Add recorded by
    req.body.recordedBy = req.user._id;

    const record = await FinancialRecord.create(req.body);

    res.status(201).json({
      success: true,
      data: record,
    });
  }
);

// @desc    Update financial record
// @route   PUT /api/financial-records/:id
// @access  Private/Admin/Treasurer
export const updateFinancialRecord = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only admin and treasurer can update financial records
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to update financial records`,
          403
        )
      );
    }

    let record = await FinancialRecord.findById(req.params.id);

    if (!record) {
      return next(
        new ErrorResponse(
          `Financial record not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Validate amount is positive if being updated
    if (req.body.amount && req.body.amount <= 0) {
      return next(new ErrorResponse(`Amount must be greater than 0`, 400));
    }

    record = await FinancialRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: record,
    });
  }
);

// @desc    Delete financial record
// @route   DELETE /api/financial-records/:id
// @access  Private/Admin/Treasurer
export const deleteFinancialRecord = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only admin and treasurer can delete financial records
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to delete financial records`,
          403
        )
      );
    }

    const record = await FinancialRecord.findById(req.params.id);

    if (!record) {
      return next(
        new ErrorResponse(
          `Financial record not found with id of ${req.params.id}`,
          404
        )
      );
    }

    await record.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Get financial summary
// @route   GET /api/financial-records/summary
// @access  Private/Admin/Treasurer
export const getFinancialSummary = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only admin and treasurer can view financial summary
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to view financial summary`,
          403
        )
      );
    }

    // Get date range from query (default to current year)
    const currentYear = new Date().getFullYear();
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(`${currentYear}-01-01`);

    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date(`${currentYear}-12-31`);

    // Get total income
    const totalIncome = await FinancialRecord.aggregate([
      {
        $match: {
          type: RecordType.INCOME,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Get total expenses
    const totalExpenses = await FinancialRecord.aggregate([
      {
        $match: {
          type: RecordType.EXPENSE,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Get breakdown by category
    const categoryBreakdown = await FinancialRecord.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.type': 1, '_id.category': 1 } },
    ]);

    // Format the category breakdown for easier consumption
    const formattedCategoryBreakdown = categoryBreakdown.map((item) => ({
      type: item._id.type,
      category: item._id.category,
      total: item.total,
      count: item.count,
    }));

    // Get monthly breakdown
    const monthlyBreakdown = await FinancialRecord.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            type: '$type',
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.type': 1 } },
    ]);

    // Format the monthly breakdown for easier consumption
    const formattedMonthlyBreakdown = monthlyBreakdown.map((item) => ({
      type: item._id.type,
      year: item._id.year,
      month: item._id.month,
      total: item.total,
    }));

    // Recent transactions
    const recentTransactions = await FinancialRecord.find()
      .sort({ date: -1 })
      .limit(5)
      .populate({
        path: 'recordedBy',
        select: 'firstName lastName',
      });

    res.status(200).json({
      success: true,
      data: {
        totalIncome: totalIncome.length > 0 ? totalIncome[0].total : 0,
        totalExpenses: totalExpenses.length > 0 ? totalExpenses[0].total : 0,
        balance:
          (totalIncome.length > 0 ? totalIncome[0].total : 0) -
          (totalExpenses.length > 0 ? totalExpenses[0].total : 0),
        categoryBreakdown: formattedCategoryBreakdown,
        monthlyBreakdown: formattedMonthlyBreakdown,
        recentTransactions,
        dateRange: {
          startDate,
          endDate,
        },
      },
    });
  }
);

// @desc    Get financial reports
// @route   GET /api/financial-records/reports
// @access  Private/Admin/Treasurer
export const getFinancialReports = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only admin and treasurer can view financial reports
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to view financial reports`,
          403
        )
      );
    }

    // Get report type from query
    const reportType = req.query.reportType || 'yearly';

    let report;

    if (reportType === 'yearly') {
      // Get year from query (default to current year)
      const year =
        parseInt(req.query.year as string) || new Date().getFullYear();

      report = await getYearlyReport(year);
    } else if (reportType === 'monthly') {
      // Get year and month from query (default to current month)
      const year =
        parseInt(req.query.year as string) || new Date().getFullYear();
      const month =
        parseInt(req.query.month as string) || new Date().getMonth() + 1;

      report = await getMonthlyReport(year, month);
    } else if (reportType === 'custom') {
      // Get custom date range
      if (!req.query.startDate || !req.query.endDate) {
        return next(
          new ErrorResponse(
            `Start date and end date are required for custom reports`,
            400
          )
        );
      }

      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      report = await getCustomReport(startDate, endDate);
    } else {
      return next(
        new ErrorResponse(
          `Invalid report type. Must be one of: yearly, monthly, custom`,
          400
        )
      );
    }

    res.status(200).json({
      success: true,
      data: report,
    });
  }
);

// Helper function for yearly report
const getYearlyReport = async (year: number) => {
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31`);

  // Get monthly breakdown
  const monthlyBreakdown = await FinancialRecord.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          type: '$type',
          month: { $month: '$date' },
        },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.month': 1, '_id.type': 1 } },
  ]);

  // Format the monthly breakdown
  const formattedMonthly = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const incomeRecord = monthlyBreakdown.find(
      (record) =>
        record._id.type === RecordType.INCOME && record._id.month === month
    );

    const expenseRecord = monthlyBreakdown.find(
      (record) =>
        record._id.type === RecordType.EXPENSE && record._id.month === month
    );

    const income = incomeRecord ? incomeRecord.total : 0;
    const expenses = expenseRecord ? expenseRecord.total : 0;

    return {
      month,
      income,
      expenses,
      balance: income - expenses,
    };
  });

  // Get category breakdown
  const categoryBreakdown = await FinancialRecord.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { type: '$type', category: '$category' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.type': 1, '_id.category': 1 } },
  ]);

  // Get yearly totals
  const yearlyTotals = await FinancialRecord.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const totalIncome =
    yearlyTotals.find((record) => record._id === RecordType.INCOME)?.total || 0;
  const totalExpenses =
    yearlyTotals.find((record) => record._id === RecordType.EXPENSE)?.total ||
    0;

  return {
    reportType: 'yearly',
    year,
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    monthlyBreakdown: formattedMonthly,
    categoryBreakdown: categoryBreakdown.map((item) => ({
      type: item._id.type,
      category: item._id.category,
      total: item.total,
      count: item.count,
    })),
  };
};

// Helper function for monthly report
const getMonthlyReport = async (year: number, month: number) => {
  const startDate = new Date(`${year}-${month.toString().padStart(2, '0')}-01`);

  // Create end date (last day of the month)
  const endDate = new Date(year, month, 0);

  // Get daily breakdown
  const dailyBreakdown = await FinancialRecord.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          type: '$type',
          day: { $dayOfMonth: '$date' },
        },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.day': 1, '_id.type': 1 } },
  ]);

  // Format the daily breakdown
  const daysInMonth = new Date(year, month, 0).getDate();
  const formattedDaily = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const incomeRecord = dailyBreakdown.find(
      (record) =>
        record._id.type === RecordType.INCOME && record._id.day === day
    );

    const expenseRecord = dailyBreakdown.find(
      (record) =>
        record._id.type === RecordType.EXPENSE && record._id.day === day
    );

    const income = incomeRecord ? incomeRecord.total : 0;
    const expenses = expenseRecord ? expenseRecord.total : 0;

    return {
      day,
      income,
      expenses,
      balance: income - expenses,
    };
  });

  // Get category breakdown
  const categoryBreakdown = await FinancialRecord.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { type: '$type', category: '$category' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.type': 1, '_id.category': 1 } },
  ]);

  // Get monthly totals
  const monthlyTotals = await FinancialRecord.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const totalIncome =
    monthlyTotals.find((record) => record._id === RecordType.INCOME)?.total ||
    0;
  const totalExpenses =
    monthlyTotals.find((record) => record._id === RecordType.EXPENSE)?.total ||
    0;

  // Get all transactions for the month
  const transactions = await FinancialRecord.find({
    date: { $gte: startDate, $lte: endDate },
  })
    .populate({
      path: 'recordedBy',
      select: 'firstName lastName',
    })
    .sort({ date: -1 });

  return {
    reportType: 'monthly',
    year,
    month,
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    dailyBreakdown: formattedDaily,
    categoryBreakdown: categoryBreakdown.map((item) => ({
      type: item._id.type,
      category: item._id.category,
      total: item.total,
      count: item.count,
    })),
    transactions,
  };
};

// Helper function for custom report
const getCustomReport = async (startDate: Date, endDate: Date) => {
  // Get category breakdown
  const categoryBreakdown = await FinancialRecord.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { type: '$type', category: '$category' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.type': 1, '_id.category': 1 } },
  ]);

  // Get totals
  const totals = await FinancialRecord.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const totalIncome =
    totals.find((record) => record._id === RecordType.INCOME)?.total || 0;
  const totalExpenses =
    totals.find((record) => record._id === RecordType.EXPENSE)?.total || 0;

  // Get all transactions for the period
  const transactions = await FinancialRecord.find({
    date: { $gte: startDate, $lte: endDate },
  })
    .populate({
      path: 'recordedBy',
      select: 'firstName lastName',
    })
    .sort({ date: -1 });

  return {
    reportType: 'custom',
    dateRange: {
      startDate,
      endDate,
    },
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    categoryBreakdown: categoryBreakdown.map((item) => ({
      type: item._id.type,
      category: item._id.category,
      total: item.total,
      count: item.count,
    })),
    transactions,
  };
};
