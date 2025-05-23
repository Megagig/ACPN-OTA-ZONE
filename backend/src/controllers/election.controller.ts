import { Request, Response, NextFunction } from 'express';
import Election, { ElectionStatus } from '../models/election.model';
import Candidate from '../models/candidate.model';
import Vote from '../models/vote.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all elections
// @route   GET /api/elections
// @access  Private
export const getAllElections = asyncHandler(
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

    const elections = await Election.find(query)
      .populate({
        path: 'candidates',
        select: 'position userId',
        options: { limit: 0 }, // Just need the count
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ startDate: -1 });

    // Get total count
    const total = await Election.countDocuments(query);

    // For each election, count the candidates and votes
    const electionsWithCounts = await Promise.all(
      elections.map(async (election) => {
        const candidateCount = await Candidate.countDocuments({
          electionId: election._id,
        });

        const voteCount = await Vote.countDocuments({
          electionId: election._id,
        });

        const electionObj = election.toObject();
        return {
          ...electionObj,
          candidateCount,
          voteCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: elections.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
      },
      data: electionsWithCounts,
    });
  }
);

// @desc    Get single election
// @route   GET /api/elections/:id
// @access  Private
export const getElection = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return next(
        new ErrorResponse(`Election not found with id of ${req.params.id}`, 404)
      );
    }

    // Get candidates grouped by position
    const candidates = await Candidate.find({ electionId: election._id })
      .populate({
        path: 'userId',
        select: 'firstName lastName email phone',
      })
      .sort({ position: 1 });

    // Group candidates by position
    const candidatesByPosition: { [key: string]: any[] } = {};
    candidates.forEach((candidate) => {
      if (!candidatesByPosition[candidate.position]) {
        candidatesByPosition[candidate.position] = [];
      }
      candidatesByPosition[candidate.position].push(candidate);
    });

    // Check if user has already voted
    const userVotes = await Vote.find({
      electionId: election._id,
      voterId: req.user._id,
    }).select('candidateId');

    // Create a map of candidate IDs that the user has voted for
    const userVoteMap = new Map();
    userVotes.forEach((vote) => {
      userVoteMap.set(vote.candidateId.toString(), true);
    });

    // Check if user is a candidate
    const isCandidate = await Candidate.findOne({
      electionId: election._id,
      userId: req.user._id,
    });

    const electionObj = election.toObject();

    res.status(200).json({
      success: true,
      data: {
        ...electionObj,
        candidatesByPosition,
        isUserCandidate: !!isCandidate,
        userVoteMap: Object.fromEntries(userVoteMap),
      },
    });
  }
);

// @desc    Create new election
// @route   POST /api/elections
// @access  Private/Admin
export const createElection = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only admin can create elections
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to create elections`,
          403
        )
      );
    }

    // Validate dates
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    if (startDate > endDate) {
      return next(new ErrorResponse('End date must be after start date', 400));
    }

    const election = await Election.create(req.body);

    res.status(201).json({
      success: true,
      data: election,
    });
  }
);

// @desc    Update election
// @route   PUT /api/elections/:id
// @access  Private/Admin
export const updateElection = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let election = await Election.findById(req.params.id);

    if (!election) {
      return next(
        new ErrorResponse(`Election not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to update elections`,
          403
        )
      );
    }

    // Only allow updates if election is upcoming
    if (election.status !== ElectionStatus.UPCOMING) {
      return next(
        new ErrorResponse(
          `Cannot update an election that is ${election.status}`,
          400
        )
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

    election = await Election.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: election,
    });
  }
);

// @desc    Delete election
// @route   DELETE /api/elections/:id
// @access  Private/Admin
export const deleteElection = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return next(
        new ErrorResponse(`Election not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to delete elections`,
          403
        )
      );
    }

    // Only allow deletion if election is upcoming and has no candidates
    if (election.status !== ElectionStatus.UPCOMING) {
      return next(
        new ErrorResponse(
          `Cannot delete an election that is ${election.status}`,
          400
        )
      );
    }

    // Check if there are candidates
    const candidateCount = await Candidate.countDocuments({
      electionId: election._id,
    });

    if (candidateCount > 0) {
      return next(
        new ErrorResponse(
          `Cannot delete an election with registered candidates. Consider cancelling it instead.`,
          400
        )
      );
    }

    await election.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Cancel election
// @route   PUT /api/elections/:id/cancel
// @access  Private/Admin
export const cancelElection = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let election = await Election.findById(req.params.id);

    if (!election) {
      return next(
        new ErrorResponse(`Election not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to cancel elections`,
          403
        )
      );
    }

    // Cannot cancel a completed election
    if (election.status === ElectionStatus.COMPLETED) {
      return next(new ErrorResponse(`Cannot cancel a completed election`, 400));
    }

    // Set status to cancelled
    election = await Election.findByIdAndUpdate(
      req.params.id,
      { status: ElectionStatus.CANCELLED },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: election,
    });
  }
);

// @desc    Add candidate to election
// @route   POST /api/elections/:id/candidates
// @access  Private/Admin
export const addCandidate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return next(
        new ErrorResponse(`Election not found with id of ${req.params.id}`, 404)
      );
    }

    // Only admin can add candidates initially
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to add candidates`,
          403
        )
      );
    }

    // Cannot add candidates to elections that are not upcoming
    if (election.status !== ElectionStatus.UPCOMING) {
      return next(
        new ErrorResponse(
          `Cannot add candidates to an election that is ${election.status}`,
          400
        )
      );
    }

    // Check if user exists
    // This will be done by the MongoDB foreign key constraint

    // Check if candidate already exists for this position
    const existingCandidate = await Candidate.findOne({
      electionId: election._id,
      userId: req.body.userId,
      position: req.body.position,
    });

    if (existingCandidate) {
      return next(
        new ErrorResponse(
          `This user is already a candidate for this position in this election`,
          400
        )
      );
    }

    // Add electionId to request body
    req.body.electionId = election._id;

    const candidate = await Candidate.create(req.body);

    res.status(201).json({
      success: true,
      data: candidate,
    });
  }
);

// @desc    Get candidates for election
// @route   GET /api/elections/:id/candidates
// @access  Private
export const getCandidates = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return next(
        new ErrorResponse(`Election not found with id of ${req.params.id}`, 404)
      );
    }

    const candidates = await Candidate.find({ electionId: election._id })
      .populate({
        path: 'userId',
        select: 'firstName lastName email',
      })
      .sort({ position: 1 });

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  }
);

// @desc    Remove candidate from election
// @route   DELETE /api/elections/:id/candidates/:candidateId
// @access  Private/Admin
export const removeCandidate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return next(
        new ErrorResponse(`Election not found with id of ${req.params.id}`, 404)
      );
    }

    // Only admin can remove candidates
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to remove candidates`,
          403
        )
      );
    }

    // Cannot remove candidates from elections that are not upcoming
    if (election.status !== ElectionStatus.UPCOMING) {
      return next(
        new ErrorResponse(
          `Cannot remove candidates from an election that is ${election.status}`,
          400
        )
      );
    }

    const candidate = await Candidate.findOne({
      _id: req.params.candidateId,
      electionId: election._id,
    });

    if (!candidate) {
      return next(
        new ErrorResponse(
          `Candidate not found with id ${req.params.candidateId} for this election`,
          404
        )
      );
    }

    await candidate.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Cast vote in election
// @route   POST /api/elections/:id/vote
// @access  Private
export const castVote = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return next(
        new ErrorResponse(`Election not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if election is ongoing
    if (election.status !== ElectionStatus.ONGOING) {
      return next(
        new ErrorResponse(
          `Cannot vote in an election that is ${election.status}`,
          400
        )
      );
    }

    // Verify candidate exists for this election
    const candidate = await Candidate.findOne({
      _id: req.body.candidateId,
      electionId: election._id,
    });

    if (!candidate) {
      return next(
        new ErrorResponse(
          `Candidate not found with id ${req.body.candidateId} for this election`,
          404
        )
      );
    }

    // Check if user has already voted for this position in this election
    const existingVote = await Vote.findOne({
      electionId: election._id,
      voterId: req.user._id,
      candidateId: {
        $in: await Candidate.find({
          position: candidate.position,
          electionId: election._id,
        }).distinct('_id'),
      },
    });

    if (existingVote) {
      return next(
        new ErrorResponse(
          `You have already voted for a candidate for the position of ${candidate.position} in this election`,
          400
        )
      );
    }

    // Create vote
    const vote = await Vote.create({
      electionId: election._id,
      candidateId: candidate._id,
      voterId: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: vote,
    });
  }
);

// @desc    Get election results
// @route   GET /api/elections/:id/results
// @access  Private
export const getElectionResults = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return next(
        new ErrorResponse(`Election not found with id of ${req.params.id}`, 404)
      );
    }

    // Only show results for completed or cancelled elections
    // Admin can see results anytime
    if (
      election.status !== ElectionStatus.COMPLETED &&
      election.status !== ElectionStatus.CANCELLED &&
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin'
    ) {
      return next(
        new ErrorResponse(
          `Results are only available when the election is completed`,
          400
        )
      );
    }

    // Get candidates grouped by position
    const candidates = await Candidate.find({ electionId: election._id })
      .populate({
        path: 'userId',
        select: 'firstName lastName',
      })
      .sort({ position: 1 });

    // Group candidates by position
    const positionMap: { [key: string]: any[] } = {};
    candidates.forEach((candidate) => {
      if (!positionMap[candidate.position]) {
        positionMap[candidate.position] = [];
      }
      positionMap[candidate.position].push(candidate);
    });

    // Get vote counts for each candidate
    const results: { [key: string]: any[] } = {};

    for (const position in positionMap) {
      results[position] = await Promise.all(
        positionMap[position].map(async (candidate) => {
          const voteCount = await Vote.countDocuments({
            candidateId: candidate._id,
          });

          return {
            candidate: {
              _id: candidate._id,
              name: `${candidate.userId.firstName} ${candidate.userId.lastName}`,
              position: candidate.position,
              manifesto: candidate.manifesto,
              photoUrl: candidate.photoUrl,
            },
            voteCount,
          };
        })
      );

      // Sort candidates by vote count (descending)
      results[position].sort((a, b) => b.voteCount - a.voteCount);
    }

    // Get total vote count
    const totalVotes = await Vote.countDocuments({
      electionId: election._id,
    });

    // Get number of unique voters
    const uniqueVoters = await Vote.distinct('voterId', {
      electionId: election._id,
    });

    res.status(200).json({
      success: true,
      data: {
        election,
        results,
        stats: {
          totalVotes,
          uniqueVoters: uniqueVoters.length,
          totalPositions: Object.keys(positionMap).length,
          totalCandidates: candidates.length,
        },
      },
    });
  }
);

// @desc    Get election statistics
// @route   GET /api/elections/stats
// @access  Private/Admin
export const getElectionStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Only admin can view election statistics
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      throw new ErrorResponse(
        `User ${req.user._id} is not authorized to view election statistics`,
        403
      );
    }

    // Count elections by status
    const electionsByStatus = await Election.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Get all elections
    const elections = await Election.find()
      .select('_id title startDate endDate status')
      .sort({ startDate: -1 });

    // For each election, get candidate and voter counts
    const electionStats = await Promise.all(
      elections.map(async (election) => {
        const candidateCount = await Candidate.countDocuments({
          electionId: election._id,
        });

        const voteCount = await Vote.countDocuments({
          electionId: election._id,
        });

        const uniqueVoters = await Vote.distinct('voterId', {
          electionId: election._id,
        });

        return {
          _id: election._id,
          title: election.title,
          startDate: election.startDate,
          endDate: election.endDate,
          status: election.status,
          candidateCount,
          voteCount,
          uniqueVoterCount: uniqueVoters.length,
        };
      })
    );

    // Get upcoming elections
    const upcomingElections = electionStats
      .filter((e) => e.status === ElectionStatus.UPCOMING)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        electionsByStatus,
        recentElections: electionStats.slice(0, 5),
        upcomingElections,
      },
    });
  }
);
