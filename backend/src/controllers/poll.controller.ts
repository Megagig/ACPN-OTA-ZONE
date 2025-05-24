import { Request, Response, NextFunction } from 'express';
import Poll, { PollStatus } from '../models/poll.model';
import PollResponse from '../models/pollResponse.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';
import mongoose from 'mongoose';

// @desc    Get all polls
// @route   GET /api/polls
// @access  Private
export const getAllPolls = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Implement pagination, filtering and sorting
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by date range if provided
    if (req.query.startDate) {
      query.startDate = { $gte: new Date(req.query.startDate as string) };
    }

    if (req.query.endDate) {
      query.endDate = { $lte: new Date(req.query.endDate as string) };
    }

    // Search by title or description
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const polls = await Poll.find(query)
      .populate({
        path: 'createdBy',
        select: 'firstName lastName email',
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ startDate: -1 });

    // Get total count
    const total = await Poll.countDocuments(query);

    // For each poll, get response count and check if user has responded
    const pollsWithCounts = await Promise.all(
      polls.map(async (poll) => {
        const responseCount = await PollResponse.countDocuments({
          pollId: poll._id,
        });

        // Check if the current user has responded
        const userResponse = await PollResponse.findOne({
          pollId: poll._id,
          userId: req.user._id,
        });

        const pollObj = poll.toObject();
        return {
          ...pollObj,
          responseCount,
          hasResponded: !!userResponse,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: polls.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
      },
      data: pollsWithCounts,
    });
  }
);

// @desc    Get single poll
// @route   GET /api/polls/:id
// @access  Private
export const getPoll = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const poll = await Poll.findById(req.params.id).populate({
      path: 'createdBy',
      select: 'firstName lastName email',
    });

    if (!poll) {
      return next(
        new ErrorResponse(`Poll not found with id of ${req.params.id}`, 404)
      );
    }

    // Get response count for each option
    const responseCountsByOption = await PollResponse.aggregate([
      {
        $match: {
          pollId: new mongoose.Types.ObjectId(poll._id as unknown as string),
        },
      },
      { $group: { _id: '$optionId', count: { $sum: 1 } } },
    ]);

    // Create a map of option ID to count
    const optionCountMap = new Map();
    responseCountsByOption.forEach((item) => {
      optionCountMap.set(item._id.toString(), item.count);
    });

    // Add counts to options
    const optionsWithCounts = poll.options.map((option) => ({
      _id: option._id,
      text: option.text,
      count: optionCountMap.get(option._id.toString()) || 0,
    }));

    // Get total response count
    const totalResponses = await PollResponse.countDocuments({
      pollId: poll._id,
    });

    // Check if user has already responded
    const userResponse = await PollResponse.findOne({
      pollId: poll._id,
      userId: req.user._id,
    });

    const pollObj = poll.toObject();

    // Only show results if poll is closed or user has responded or user is admin
    const showResults =
      poll.status === PollStatus.CLOSED ||
      !!userResponse ||
      ['admin', 'superadmin'].includes(req.user.role);

    res.status(200).json({
      success: true,
      data: {
        ...pollObj,
        options: showResults ? optionsWithCounts : poll.options,
        totalResponses,
        userResponse: userResponse || null,
        hasResponded: !!userResponse,
        showResults,
      },
    });
  }
);

// @desc    Create new poll
// @route   POST /api/polls
// @access  Private/Admin/Secretary
export const createPoll = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only admin and secretary can create polls
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to create polls`,
          403
        )
      );
    }

    // Add user to req.body
    req.body.createdBy = req.user._id;

    // Validate dates
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    if (startDate > endDate) {
      return next(new ErrorResponse('End date must be after start date', 400));
    }

    // Ensure there are at least 2 options
    if (!req.body.options || req.body.options.length < 2) {
      return next(new ErrorResponse('Poll must have at least 2 options', 400));
    }

    const poll = await Poll.create(req.body);

    res.status(201).json({
      success: true,
      data: poll,
    });
  }
);

// @desc    Update poll
// @route   PUT /api/polls/:id
// @access  Private/Admin/Secretary
export const updatePoll = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let poll = await Poll.findById(req.params.id);

    if (!poll) {
      return next(
        new ErrorResponse(`Poll not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is admin or secretary
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to update polls`,
          403
        )
      );
    }

    // Only allow updates if poll is draft
    if (poll.status !== PollStatus.DRAFT) {
      return next(
        new ErrorResponse(`Cannot update a poll that is ${poll.status}`, 400)
      );
    }

    // Validate dates if they are being updated
    if (req.body.startDate && req.body.endDate) {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);

      if (startDate > endDate) {
        return next(
          new ErrorResponse('End date must be after start date', 400)
        );
      }
    }

    // Ensure there are at least 2 options if options are being updated
    if (req.body.options && req.body.options.length < 2) {
      return next(new ErrorResponse('Poll must have at least 2 options', 400));
    }

    poll = await Poll.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: poll,
    });
  }
);

// @desc    Delete poll
// @route   DELETE /api/polls/:id
// @access  Private/Admin/Secretary
export const deletePoll = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return next(
        new ErrorResponse(`Poll not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is admin or secretary
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to delete polls`,
          403
        )
      );
    }

    // Only allow deletion if poll is draft
    if (poll.status !== PollStatus.DRAFT) {
      return next(
        new ErrorResponse(`Cannot delete a poll that is ${poll.status}`, 400)
      );
    }

    // Check if there are responses
    const responseCount = await PollResponse.countDocuments({
      pollId: poll._id,
    });

    if (responseCount > 0) {
      return next(
        new ErrorResponse(
          `Cannot delete a poll with responses. Consider closing it instead.`,
          400
        )
      );
    }

    await poll.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Publish poll (change status from draft to active)
// @route   PUT /api/polls/:id/publish
// @access  Private/Admin/Secretary
export const publishPoll = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let poll = await Poll.findById(req.params.id);

    if (!poll) {
      return next(
        new ErrorResponse(`Poll not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is admin or secretary
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to publish polls`,
          403
        )
      );
    }

    // Only allow publishing if poll is draft
    if (poll.status !== PollStatus.DRAFT) {
      return next(
        new ErrorResponse(
          `Cannot publish a poll that is already ${poll.status}`,
          400
        )
      );
    }

    // Set status to active
    poll = await Poll.findByIdAndUpdate(
      req.params.id,
      { status: PollStatus.ACTIVE },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: poll,
    });
  }
);

// @desc    Close poll
// @route   PUT /api/polls/:id/close
// @access  Private/Admin/Secretary
export const closePoll = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let poll = await Poll.findById(req.params.id);

    if (!poll) {
      return next(
        new ErrorResponse(`Poll not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is admin or secretary
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to close polls`,
          403
        )
      );
    }

    // Only allow closing if poll is active
    if (poll.status !== PollStatus.ACTIVE) {
      return next(
        new ErrorResponse(`Cannot close a poll that is ${poll.status}`, 400)
      );
    }

    // Set status to closed
    poll = await Poll.findByIdAndUpdate(
      req.params.id,
      { status: PollStatus.CLOSED },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: poll,
    });
  }
);

// @desc    Respond to poll
// @route   POST /api/polls/:id/respond
// @access  Private
export const respondToPoll = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return next(
        new ErrorResponse(`Poll not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if poll is active
    if (poll.status !== PollStatus.ACTIVE) {
      return next(
        new ErrorResponse(
          `Cannot respond to a poll that is ${poll.status}`,
          400
        )
      );
    }

    // Check if option is valid
    const optionId = req.body.optionId;
    const option = poll.options.find((opt) => opt._id.toString() === optionId);

    if (!option) {
      return next(new ErrorResponse(`Invalid option ID for this poll`, 400));
    }

    // Check if user has already responded
    const existingResponse = await PollResponse.findOne({
      pollId: poll._id,
      userId: req.user._id,
    });

    if (existingResponse) {
      return next(
        new ErrorResponse(`You have already responded to this poll`, 400)
      );
    }

    // Create response
    const response = await PollResponse.create({
      pollId: poll._id,
      optionId: optionId,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: response,
    });
  }
);

// @desc    Get poll results
// @route   GET /api/polls/:id/results
// @access  Private/Admin/Secretary
export const getPollResults = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const poll = await Poll.findById(req.params.id).populate({
      path: 'createdBy',
      select: 'firstName lastName email',
    });

    if (!poll) {
      return next(
        new ErrorResponse(`Poll not found with id of ${req.params.id}`, 404)
      );
    }

    // Only admin and secretary can view poll results anytime
    // Others can only view results of closed polls
    if (
      poll.status !== PollStatus.CLOSED &&
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `Results are only available when the poll is closed`,
          400
        )
      );
    }

    // Get response count for each option
    const responseCountsByOption = await PollResponse.aggregate([
      {
        $match: {
          pollId: new mongoose.Types.ObjectId(poll._id as unknown as string),
        },
      },
      { $group: { _id: '$optionId', count: { $sum: 1 } } },
    ]);

    // Create a map of option ID to count
    const optionCountMap = new Map();
    responseCountsByOption.forEach((item) => {
      optionCountMap.set(item._id.toString(), item.count);
    });

    // Get total response count
    const totalResponses = await PollResponse.countDocuments({
      pollId: poll._id,
    });

    // Add counts and percentages to options
    const optionsWithStats = poll.options.map((option) => {
      const count = optionCountMap.get(option._id.toString()) || 0;
      return {
        _id: option._id,
        text: option.text,
        count,
        percentage:
          totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
      };
    });

    // Sort options by count (descending)
    optionsWithStats.sort((a, b) => b.count - a.count);

    res.status(200).json({
      success: true,
      data: {
        poll,
        options: optionsWithStats,
        totalResponses,
        responseRate: totalResponses,
      },
    });
  }
);

// @desc    Get poll statistics
// @route   GET /api/polls/stats
// @access  Private/Admin
export const getPollStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Only admin can view poll statistics
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      throw new ErrorResponse(
        `User ${req.user._id} is not authorized to view poll statistics`,
        403
      );
    }

    // Count polls by status
    const pollsByStatus = await Poll.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Get most active polls (by response count)
    const activePolls = await Poll.find({ status: PollStatus.ACTIVE })
      .select('_id title startDate endDate')
      .sort({ startDate: -1 });

    const activePollsWithCounts = await Promise.all(
      activePolls.map(async (poll) => {
        const responseCount = await PollResponse.countDocuments({
          pollId: poll._id,
        });

        return {
          _id: poll._id,
          title: poll.title,
          startDate: poll.startDate,
          endDate: poll.endDate,
          responseCount,
        };
      })
    );

    // Sort by response count
    activePollsWithCounts.sort((a, b) => b.responseCount - a.responseCount);

    // Get recent polls
    const recentPolls = await Poll.find()
      .select('_id title status startDate endDate')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get response statistics for each poll
    const recentPollsWithStats = await Promise.all(
      recentPolls.map(async (poll) => {
        const responseCount = await PollResponse.countDocuments({
          pollId: poll._id,
        });

        return {
          _id: poll._id,
          title: poll.title,
          status: poll.status,
          startDate: poll.startDate,
          endDate: poll.endDate,
          responseCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        pollsByStatus,
        mostActivePolls: activePollsWithCounts.slice(0, 5),
        recentPolls: recentPollsWithStats,
      },
    });
  }
);
