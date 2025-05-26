"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElectionStats = exports.getElectionResults = exports.castVote = exports.removeCandidate = exports.getCandidates = exports.addCandidate = exports.cancelElection = exports.deleteElection = exports.updateElection = exports.createElection = exports.getElection = exports.getAllElections = void 0;
const election_model_1 = __importStar(require("../models/election.model"));
const candidate_model_1 = __importDefault(require("../models/candidate.model"));
const vote_model_1 = __importDefault(require("../models/vote.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
// @desc    Get all elections
// @route   GET /api/elections
// @access  Private
exports.getAllElections = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Implement pagination, filtering and sorting
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // Build query
    const query = {};
    // Filter by status if provided
    if (req.query.status) {
        query.status = req.query.status;
    }
    // Filter by date range if provided
    if (req.query.startDate) {
        query.startDate = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
        query.endDate = { $lte: new Date(req.query.endDate) };
    }
    // Search by title or description
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }
    const elections = yield election_model_1.default.find(query)
        .populate({
        path: 'candidates',
        select: 'position userId',
        options: { limit: 0 }, // Just need the count
    })
        .skip(startIndex)
        .limit(limit)
        .sort({ startDate: -1 });
    // Get total count
    const total = yield election_model_1.default.countDocuments(query);
    // For each election, count the candidates and votes
    const electionsWithCounts = yield Promise.all(elections.map((election) => __awaiter(void 0, void 0, void 0, function* () {
        const candidateCount = yield candidate_model_1.default.countDocuments({
            electionId: election._id,
        });
        const voteCount = yield vote_model_1.default.countDocuments({
            electionId: election._id,
        });
        const electionObj = election.toObject();
        return Object.assign(Object.assign({}, electionObj), { candidateCount,
            voteCount });
    })));
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
}));
// @desc    Get single election
// @route   GET /api/elections/:id
// @access  Private
exports.getElection = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const election = yield election_model_1.default.findById(req.params.id);
    if (!election) {
        return next(new errorResponse_1.default(`Election not found with id of ${req.params.id}`, 404));
    }
    // Get candidates grouped by position
    const candidates = yield candidate_model_1.default.find({ electionId: election._id })
        .populate({
        path: 'userId',
        select: 'firstName lastName email phone',
    })
        .sort({ position: 1 });
    // Group candidates by position
    const candidatesByPosition = {};
    candidates.forEach((candidate) => {
        if (!candidatesByPosition[candidate.position]) {
            candidatesByPosition[candidate.position] = [];
        }
        candidatesByPosition[candidate.position].push(candidate);
    });
    // Check if user has already voted
    const userVotes = yield vote_model_1.default.find({
        electionId: election._id,
        voterId: req.user._id,
    }).select('candidateId');
    // Create a map of candidate IDs that the user has voted for
    const userVoteMap = new Map();
    userVotes.forEach((vote) => {
        userVoteMap.set(vote.candidateId.toString(), true);
    });
    // Check if user is a candidate
    const isCandidate = yield candidate_model_1.default.findOne({
        electionId: election._id,
        userId: req.user._id,
    });
    const electionObj = election.toObject();
    res.status(200).json({
        success: true,
        data: Object.assign(Object.assign({}, electionObj), { candidatesByPosition, isUserCandidate: !!isCandidate, userVoteMap: Object.fromEntries(userVoteMap) }),
    });
}));
// @desc    Create new election
// @route   POST /api/elections
// @access  Private/Admin
exports.createElection = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Only admin can create elections
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to create elections`, 403));
    }
    // Validate dates
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    if (startDate > endDate) {
        return next(new errorResponse_1.default('End date must be after start date', 400));
    }
    const election = yield election_model_1.default.create(req.body);
    res.status(201).json({
        success: true,
        data: election,
    });
}));
// @desc    Update election
// @route   PUT /api/elections/:id
// @access  Private/Admin
exports.updateElection = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let election = yield election_model_1.default.findById(req.params.id);
    if (!election) {
        return next(new errorResponse_1.default(`Election not found with id of ${req.params.id}`, 404));
    }
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to update elections`, 403));
    }
    // Only allow updates if election is upcoming
    if (election.status !== election_model_1.ElectionStatus.UPCOMING) {
        return next(new errorResponse_1.default(`Cannot update an election that is ${election.status}`, 400));
    }
    // Validate dates if they are being updated
    if (req.body.startDate && req.body.endDate) {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);
        if (startDate > endDate) {
            return next(new errorResponse_1.default('End date must be after start date', 400));
        }
    }
    election = yield election_model_1.default.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: election,
    });
}));
// @desc    Delete election
// @route   DELETE /api/elections/:id
// @access  Private/Admin
exports.deleteElection = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const election = yield election_model_1.default.findById(req.params.id);
    if (!election) {
        return next(new errorResponse_1.default(`Election not found with id of ${req.params.id}`, 404));
    }
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to delete elections`, 403));
    }
    // Only allow deletion if election is upcoming and has no candidates
    if (election.status !== election_model_1.ElectionStatus.UPCOMING) {
        return next(new errorResponse_1.default(`Cannot delete an election that is ${election.status}`, 400));
    }
    // Check if there are candidates
    const candidateCount = yield candidate_model_1.default.countDocuments({
        electionId: election._id,
    });
    if (candidateCount > 0) {
        return next(new errorResponse_1.default(`Cannot delete an election with registered candidates. Consider cancelling it instead.`, 400));
    }
    yield election.deleteOne();
    res.status(200).json({
        success: true,
        data: {},
    });
}));
// @desc    Cancel election
// @route   PUT /api/elections/:id/cancel
// @access  Private/Admin
exports.cancelElection = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let election = yield election_model_1.default.findById(req.params.id);
    if (!election) {
        return next(new errorResponse_1.default(`Election not found with id of ${req.params.id}`, 404));
    }
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to cancel elections`, 403));
    }
    // Cannot cancel a completed election
    if (election.status === election_model_1.ElectionStatus.COMPLETED) {
        return next(new errorResponse_1.default(`Cannot cancel a completed election`, 400));
    }
    // Set status to cancelled
    election = yield election_model_1.default.findByIdAndUpdate(req.params.id, { status: election_model_1.ElectionStatus.CANCELLED }, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: election,
    });
}));
// @desc    Add candidate to election
// @route   POST /api/elections/:id/candidates
// @access  Private/Admin
exports.addCandidate = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const election = yield election_model_1.default.findById(req.params.id);
    if (!election) {
        return next(new errorResponse_1.default(`Election not found with id of ${req.params.id}`, 404));
    }
    // Only admin can add candidates initially
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to add candidates`, 403));
    }
    // Cannot add candidates to elections that are not upcoming
    if (election.status !== election_model_1.ElectionStatus.UPCOMING) {
        return next(new errorResponse_1.default(`Cannot add candidates to an election that is ${election.status}`, 400));
    }
    // Check if user exists
    // This will be done by the MongoDB foreign key constraint
    // Check if candidate already exists for this position
    const existingCandidate = yield candidate_model_1.default.findOne({
        electionId: election._id,
        userId: req.body.userId,
        position: req.body.position,
    });
    if (existingCandidate) {
        return next(new errorResponse_1.default(`This user is already a candidate for this position in this election`, 400));
    }
    // Add electionId to request body
    req.body.electionId = election._id;
    const candidate = yield candidate_model_1.default.create(req.body);
    res.status(201).json({
        success: true,
        data: candidate,
    });
}));
// @desc    Get candidates for election
// @route   GET /api/elections/:id/candidates
// @access  Private
exports.getCandidates = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const election = yield election_model_1.default.findById(req.params.id);
    if (!election) {
        return next(new errorResponse_1.default(`Election not found with id of ${req.params.id}`, 404));
    }
    const candidates = yield candidate_model_1.default.find({ electionId: election._id })
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
}));
// @desc    Remove candidate from election
// @route   DELETE /api/elections/:id/candidates/:candidateId
// @access  Private/Admin
exports.removeCandidate = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const election = yield election_model_1.default.findById(req.params.id);
    if (!election) {
        return next(new errorResponse_1.default(`Election not found with id of ${req.params.id}`, 404));
    }
    // Only admin can remove candidates
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to remove candidates`, 403));
    }
    // Cannot remove candidates from elections that are not upcoming
    if (election.status !== election_model_1.ElectionStatus.UPCOMING) {
        return next(new errorResponse_1.default(`Cannot remove candidates from an election that is ${election.status}`, 400));
    }
    const candidate = yield candidate_model_1.default.findOne({
        _id: req.params.candidateId,
        electionId: election._id,
    });
    if (!candidate) {
        return next(new errorResponse_1.default(`Candidate not found with id ${req.params.candidateId} for this election`, 404));
    }
    yield candidate.deleteOne();
    res.status(200).json({
        success: true,
        data: {},
    });
}));
// @desc    Cast vote in election
// @route   POST /api/elections/:id/vote
// @access  Private
exports.castVote = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const election = yield election_model_1.default.findById(req.params.id);
    if (!election) {
        return next(new errorResponse_1.default(`Election not found with id of ${req.params.id}`, 404));
    }
    // Check if election is ongoing
    if (election.status !== election_model_1.ElectionStatus.ONGOING) {
        return next(new errorResponse_1.default(`Cannot vote in an election that is ${election.status}`, 400));
    }
    // Verify candidate exists for this election
    const candidate = yield candidate_model_1.default.findOne({
        _id: req.body.candidateId,
        electionId: election._id,
    });
    if (!candidate) {
        return next(new errorResponse_1.default(`Candidate not found with id ${req.body.candidateId} for this election`, 404));
    }
    // Check if user has already voted for this position in this election
    const existingVote = yield vote_model_1.default.findOne({
        electionId: election._id,
        voterId: req.user._id,
        candidateId: {
            $in: yield candidate_model_1.default.find({
                position: candidate.position,
                electionId: election._id,
            }).distinct('_id'),
        },
    });
    if (existingVote) {
        return next(new errorResponse_1.default(`You have already voted for a candidate for the position of ${candidate.position} in this election`, 400));
    }
    // Create vote
    const vote = yield vote_model_1.default.create({
        electionId: election._id,
        candidateId: candidate._id,
        voterId: req.user._id,
    });
    res.status(201).json({
        success: true,
        data: vote,
    });
}));
// @desc    Get election results
// @route   GET /api/elections/:id/results
// @access  Private
exports.getElectionResults = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const election = yield election_model_1.default.findById(req.params.id);
    if (!election) {
        return next(new errorResponse_1.default(`Election not found with id of ${req.params.id}`, 404));
    }
    // Only show results for completed or cancelled elections
    // Admin can see results anytime
    if (election.status !== election_model_1.ElectionStatus.COMPLETED &&
        election.status !== election_model_1.ElectionStatus.CANCELLED &&
        req.user.role !== 'admin' &&
        req.user.role !== 'superadmin') {
        return next(new errorResponse_1.default(`Results are only available when the election is completed`, 400));
    }
    // Get candidates grouped by position
    const candidates = yield candidate_model_1.default.find({ electionId: election._id })
        .populate({
        path: 'userId',
        select: 'firstName lastName',
    })
        .sort({ position: 1 });
    // Group candidates by position
    const positionMap = {};
    candidates.forEach((candidate) => {
        if (!positionMap[candidate.position]) {
            positionMap[candidate.position] = [];
        }
        positionMap[candidate.position].push(candidate);
    });
    // Get vote counts for each candidate
    const results = {};
    for (const position in positionMap) {
        results[position] = yield Promise.all(positionMap[position].map((candidate) => __awaiter(void 0, void 0, void 0, function* () {
            const voteCount = yield vote_model_1.default.countDocuments({
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
        })));
        // Sort candidates by vote count (descending)
        results[position].sort((a, b) => b.voteCount - a.voteCount);
    }
    // Get total vote count
    const totalVotes = yield vote_model_1.default.countDocuments({
        electionId: election._id,
    });
    // Get number of unique voters
    const uniqueVoters = yield vote_model_1.default.distinct('voterId', {
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
}));
// @desc    Get election statistics
// @route   GET /api/elections/stats
// @access  Private/Admin
exports.getElectionStats = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Only admin can view election statistics
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        throw new errorResponse_1.default(`User ${req.user._id} is not authorized to view election statistics`, 403);
    }
    // Count elections by status
    const electionsByStatus = yield election_model_1.default.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);
    // Get all elections
    const elections = yield election_model_1.default.find()
        .select('_id title startDate endDate status')
        .sort({ startDate: -1 });
    // For each election, get candidate and voter counts
    const electionStats = yield Promise.all(elections.map((election) => __awaiter(void 0, void 0, void 0, function* () {
        const candidateCount = yield candidate_model_1.default.countDocuments({
            electionId: election._id,
        });
        const voteCount = yield vote_model_1.default.countDocuments({
            electionId: election._id,
        });
        const uniqueVoters = yield vote_model_1.default.distinct('voterId', {
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
    })));
    // Get upcoming elections
    const upcomingElections = electionStats
        .filter((e) => e.status === election_model_1.ElectionStatus.UPCOMING)
        .slice(0, 5);
    res.status(200).json({
        success: true,
        data: {
            electionsByStatus,
            recentElections: electionStats.slice(0, 5),
            upcomingElections,
        },
    });
}));
