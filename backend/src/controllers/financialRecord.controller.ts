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

    // Search by description or title
    if (req.query.search) {
      query.$or = [
        { description: { $regex: req.query.search, $options: 'i' } },
        { title: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Parse sort parameter (e.g., '-createdAt' for descending by createdAt)
    let sortBy: any = {};
    if (req.query.sort) {
      const sortParam = req.query.sort as string;
      if (sortParam.startsWith('-')) {
        sortBy = { [sortParam.substring(1)]: -1 };
      } else {
        sortBy = { [sortParam]: 1 };
      }
    } else {
      // Default sort by most recent
      sortBy = { date: -1 };
    }

    const records = await FinancialRecord.find(query)
      .populate({
        path: 'recordedBy',
        select: 'firstName lastName email',
      })
      .skip(startIndex)
      .limit(limit)
      .sort(sortBy);

    // Get total count
    const total = await FinancialRecord.countDocuments(query);

    // Format the records to match frontend expectations
    const formattedRecords = records.map((record) => {
      // Convert recordedBy to string format if it's populated
      let createdBy = '';
      if (record.recordedBy) {
        const user = record.recordedBy as any;
        createdBy =
          user && user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : (user && user.email) || 'Unknown';
      }

      // Map backend model to frontend expected structure
      return {
        _id: record._id,
        title: record.title || record.description,
        description: record.description,
        amount: record.amount,
        type: record.type.toLowerCase(),
        category: record.category.toLowerCase(),
        date: record.date.toISOString(),
        paymentMethod: record.paymentMethod || 'bank_transfer',
        status: record.status || 'pending',
        attachments: record.attachments || [],
        createdBy,
        createdAt: record.createdAt?.toISOString(),
        updatedAt: record.updatedAt?.toISOString(),
      };
    });

    res.status(200).json({
      success: true,
      count: records.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
      },
      data: formattedRecords,
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

    // Format the record to match frontend expectations
    const user = record.recordedBy as any;
    const createdBy =
      user && user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : (user && user.email) || 'Unknown';

    const formattedRecord = {
      _id: record._id,
      title: record.title || record.description,
      description: record.description,
      amount: record.amount,
      type: record.type.toLowerCase(),
      category: record.category.toLowerCase(),
      date: record.date.toISOString(),
      paymentMethod: record.paymentMethod || 'bank_transfer',
      status: record.status || 'pending',
      attachments: record.attachments || [],
      createdBy,
      createdAt: record.createdAt?.toISOString(),
      updatedAt: record.updatedAt?.toISOString(),
    };

    res.status(200).json({
      success: true,
      data: formattedRecord,
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

    // If title is not provided, use description as title
    if (!req.body.title && req.body.description) {
      req.body.title = req.body.description;
    }

    try {
      const record = await FinancialRecord.create(req.body);

      // Format the response to match frontend expectations
      const formattedRecord = {
        _id: record._id,
        title: record.title || record.description,
        description: record.description,
        amount: record.amount,
        type: record.type.toLowerCase(),
        category: record.category.toLowerCase(),
        date: record.date.toISOString(),
        paymentMethod: record.paymentMethod || 'bank_transfer',
        status: record.status || 'pending',
        attachments: record.attachments || [],
        createdBy:
          req.user && req.user.firstName
            ? `${req.user.firstName} ${req.user.lastName || ''}`
            : (req.user && req.user.email) || 'Unknown',
        createdAt: record.createdAt?.toISOString(),
        updatedAt: record.updatedAt?.toISOString(),
      };

      res.status(201).json({
        success: true,
        data: formattedRecord,
      });
    } catch (error) {
      console.error('Error creating financial record:', error);
      return next(
        new ErrorResponse(
          `Failed to create financial record: ${(error as Error).message}`,
          500
        )
      );
    }
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

    // If title is not provided but description is, use description as title
    if (!req.body.title && req.body.description) {
      req.body.title = req.body.description;
    }

    // Update record
    record = await FinancialRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate({
      path: 'recordedBy',
      select: 'firstName lastName email',
    });

    if (!record) {
      return next(
        new ErrorResponse(
          `Financial record not found with id of ${req.params.id} after update`,
          404
        )
      );
    }

    // Format the record to match frontend expectations
    const user = record.recordedBy as any;
    const createdBy =
      user && user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : (user && user.email) || 'Unknown';

    const formattedRecord = {
      _id: record._id,
      title: record.title || record.description,
      description: record.description,
      amount: record.amount,
      type: record.type.toLowerCase(),
      category: record.category.toLowerCase(),
      date: record.date.toISOString(),
      paymentMethod: record.paymentMethod || 'bank_transfer',
      status: record.status || 'pending',
      attachments: record.attachments || [],
      createdBy,
      createdAt: record.createdAt?.toISOString(),
      updatedAt: record.updatedAt?.toISOString(),
    };

    res.status(200).json({
      success: true,
      data: formattedRecord,
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

    // Get period from query
    const period = (req.query.period as string) || 'month';

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (period) {
      case 'week':
        // Last 7 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        endDate = now;
        break;
      case 'month':
        // Current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        // Current quarter
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
        break;
      case 'year':
        // Current year
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

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

    // Get income by category
    const incomeByCategory = await FinancialRecord.aggregate([
      {
        $match: {
          type: RecordType.INCOME,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Get expense by category
    const expenseByCategory = await FinancialRecord.aggregate([
      {
        $match: {
          type: RecordType.EXPENSE,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Convert category data to the format expected by frontend
    const incomeByCategoryMap: Record<string, number> = {};
    incomeByCategory.forEach((item) => {
      incomeByCategoryMap[item._id] = item.total;
    });

    const expenseByCategoryMap: Record<string, number> = {};
    expenseByCategory.forEach((item) => {
      expenseByCategoryMap[item._id] = item.total;
    });

    // Get monthly data for charts
    const monthsForLabels = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    // For "month" period, show daily data for the current month
    // For other periods, show monthly data
    let labels: string[] = [];
    let incomeData: number[] = [];
    let expenseData: number[] = [];

    if (period === 'month') {
      // Daily data for current month
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();
      labels = Array.from({ length: daysInMonth }, (_, i) =>
        (i + 1).toString()
      );

      // Initialize with zeros
      incomeData = new Array(daysInMonth).fill(0);
      expenseData = new Array(daysInMonth).fill(0);

      // Get daily income
      const dailyIncome = await FinancialRecord.aggregate([
        {
          $match: {
            type: RecordType.INCOME,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { day: { $dayOfMonth: '$date' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.day': 1 } },
      ]);

      // Get daily expenses
      const dailyExpenses = await FinancialRecord.aggregate([
        {
          $match: {
            type: RecordType.EXPENSE,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { day: { $dayOfMonth: '$date' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.day': 1 } },
      ]);

      // Fill in the data
      dailyIncome.forEach((item) => {
        const day = item._id.day - 1; // adjust for 0-based array
        if (day >= 0 && day < daysInMonth) {
          incomeData[day] = item.total;
        }
      });

      dailyExpenses.forEach((item) => {
        const day = item._id.day - 1; // adjust for 0-based array
        if (day >= 0 && day < daysInMonth) {
          expenseData[day] = item.total;
        }
      });
    } else {
      // Monthly data
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31);

      // Default to showing the last 6 months
      if (period === 'week') {
        labels = monthsForLabels.slice(0, 6);
        incomeData = new Array(6).fill(0);
        expenseData = new Array(6).fill(0);
      } else {
        labels = monthsForLabels;
        incomeData = new Array(12).fill(0);
        expenseData = new Array(12).fill(0);
      }

      // Get monthly income for the year
      const monthlyIncome = await FinancialRecord.aggregate([
        {
          $match: {
            type: RecordType.INCOME,
            date: { $gte: yearStart, $lte: yearEnd },
          },
        },
        {
          $group: {
            _id: { month: { $month: '$date' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.month': 1 } },
      ]);

      // Get monthly expenses for the year
      const monthlyExpenses = await FinancialRecord.aggregate([
        {
          $match: {
            type: RecordType.EXPENSE,
            date: { $gte: yearStart, $lte: yearEnd },
          },
        },
        {
          $group: {
            _id: { month: { $month: '$date' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.month': 1 } },
      ]);

      // Fill in the data
      monthlyIncome.forEach((item) => {
        const month = item._id.month - 1; // adjust for 0-based array
        if (month >= 0 && month < 12) {
          incomeData[month] = item.total;
        }
      });

      monthlyExpenses.forEach((item) => {
        const month = item._id.month - 1; // adjust for 0-based array
        if (month >= 0 && month < 12) {
          expenseData[month] = item.total;
        }
      });

      // For week period, only show the last 6 months
      if (period === 'week') {
        labels = monthsForLabels.slice(0, 6);
        incomeData = incomeData.slice(0, 6);
        expenseData = expenseData.slice(0, 6);
      }
    }

    // Format the response to match frontend expectations
    const response = {
      totalIncome: totalIncome.length > 0 ? totalIncome[0].total : 0,
      totalExpense: totalExpenses.length > 0 ? totalExpenses[0].total : 0,
      balance:
        (totalIncome.length > 0 ? totalIncome[0].total : 0) -
        (totalExpenses.length > 0 ? totalExpenses[0].total : 0),
      incomeByCategory: incomeByCategoryMap,
      expenseByCategory: expenseByCategoryMap,
      monthlyData: {
        labels,
        income: incomeData,
        expense: expenseData,
      },
    };

    res.status(200).json({
      success: true,
      data: response,
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
