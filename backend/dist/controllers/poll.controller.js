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
exports.getPollStats = exports.getPollResults = exports.respondToPoll = exports.closePoll = exports.publishPoll = exports.deletePoll = exports.updatePoll = exports.createPoll = exports.getPoll = exports.getAllPolls = void 0;
const poll_model_1 = __importStar(require("../models/poll.model"));
const pollResponse_model_1 = __importDefault(require("../models/pollResponse.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
const mongoose_1 = __importDefault(require("mongoose"));
// @desc    Get all polls
// @route   GET /api/polls
// @access  Private
exports.getAllPolls = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const polls = yield poll_model_1.default.find(query)
        .populate({
        path: 'createdBy',
        select: 'firstName lastName email',
    })
        .skip(startIndex)
        .limit(limit)
        .sort({ startDate: -1 });
    // Get total count
    const total = yield poll_model_1.default.countDocuments(query);
    // For each poll, get response count and check if user has responded
    const pollsWithCounts = yield Promise.all(polls.map((poll) => __awaiter(void 0, void 0, void 0, function* () {
        const responseCount = yield pollResponse_model_1.default.countDocuments({
            pollId: poll._id,
        });
        // Check if the current user has responded
        const userResponse = yield pollResponse_model_1.default.findOne({
            pollId: poll._id,
            userId: req.user._id,
        });
        const pollObj = poll.toObject();
        return Object.assign(Object.assign({}, pollObj), { responseCount, hasResponded: !!userResponse });
    })));
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
}));
// @desc    Get single poll
// @route   GET /api/polls/:id
// @access  Private
exports.getPoll = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const poll = yield poll_model_1.default.findById(req.params.id).populate({
        path: 'createdBy',
        select: 'firstName lastName email',
    });
    if (!poll) {
        return next(new errorResponse_1.default(`Poll not found with id of ${req.params.id}`, 404));
    }
    // Get response count for each option
    const responseCountsByOption = yield pollResponse_model_1.default.aggregate([
        {
            $match: {
                pollId: new mongoose_1.default.Types.ObjectId(poll._id),
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
    const totalResponses = yield pollResponse_model_1.default.countDocuments({
        pollId: poll._id,
    });
    // Check if user has already responded
    const userResponse = yield pollResponse_model_1.default.findOne({
        pollId: poll._id,
        userId: req.user._id,
    });
    const pollObj = poll.toObject();
    // Only show results if poll is closed or user has responded or user is admin
    const showResults = poll.status === poll_model_1.PollStatus.CLOSED ||
        !!userResponse ||
        ['admin', 'superadmin'].includes(req.user.role);
    res.status(200).json({
        success: true,
        data: Object.assign(Object.assign({}, pollObj), { options: showResults ? optionsWithCounts : poll.options, totalResponses, userResponse: userResponse || null, hasResponded: !!userResponse, showResults }),
    });
}));
// @desc    Create new poll
// @route   POST /api/polls
// @access  Private/Admin/Secretary
exports.createPoll = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Only admin and secretary can create polls
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to create polls`, 403));
    }
    // Add user to req.body
    req.body.createdBy = req.user._id;
    // Validate dates
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    if (startDate > endDate) {
        return next(new errorResponse_1.default('End date must be after start date', 400));
    }
    // Ensure there are at least 2 options
    if (!req.body.options || req.body.options.length < 2) {
        return next(new errorResponse_1.default('Poll must have at least 2 options', 400));
    }
    const poll = yield poll_model_1.default.create(req.body);
    res.status(201).json({
        success: true,
        data: poll,
    });
}));
// @desc    Update poll
// @route   PUT /api/polls/:id
// @access  Private/Admin/Secretary
exports.updatePoll = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let poll = yield poll_model_1.default.findById(req.params.id);
    if (!poll) {
        return next(new errorResponse_1.default(`Poll not found with id of ${req.params.id}`, 404));
    }
    // Check if user is admin or secretary
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to update polls`, 403));
    }
    // Only allow updates if poll is draft
    if (poll.status !== poll_model_1.PollStatus.DRAFT) {
        return next(new errorResponse_1.default(`Cannot update a poll that is ${poll.status}`, 400));
    }
    // Validate dates if they are being updated
    if (req.body.startDate && req.body.endDate) {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);
        if (startDate > endDate) {
            return next(new errorResponse_1.default('End date must be after start date', 400));
        }
    }
    // Ensure there are at least 2 options if options are being updated
    if (req.body.options && req.body.options.length < 2) {
        return next(new errorResponse_1.default('Poll must have at least 2 options', 400));
    }
    poll = yield poll_model_1.default.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: poll,
    });
}));
// @desc    Delete poll
// @route   DELETE /api/polls/:id
// @access  Private/Admin/Secretary
exports.deletePoll = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const poll = yield poll_model_1.default.findById(req.params.id);
    if (!poll) {
        return next(new errorResponse_1.default(`Poll not found with id of ${req.params.id}`, 404));
    }
    // Check if user is admin or secretary
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to delete polls`, 403));
    }
    // Only allow deletion if poll is draft
    if (poll.status !== poll_model_1.PollStatus.DRAFT) {
        return next(new errorResponse_1.default(`Cannot delete a poll that is ${poll.status}`, 400));
    }
    // Check if there are responses
    const responseCount = yield pollResponse_model_1.default.countDocuments({
        pollId: poll._id,
    });
    if (responseCount > 0) {
        return next(new errorResponse_1.default(`Cannot delete a poll with responses. Consider closing it instead.`, 400));
    }
    yield poll.deleteOne();
    res.status(200).json({
        success: true,
        data: {},
    });
}));
// @desc    Publish poll (change status from draft to active)
// @route   PUT /api/polls/:id/publish
// @access  Private/Admin/Secretary
exports.publishPoll = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let poll = yield poll_model_1.default.findById(req.params.id);
    if (!poll) {
        return next(new errorResponse_1.default(`Poll not found with id of ${req.params.id}`, 404));
    }
    // Check if user is admin or secretary
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to publish polls`, 403));
    }
    // Only allow publishing if poll is draft
    if (poll.status !== poll_model_1.PollStatus.DRAFT) {
        return next(new errorResponse_1.default(`Cannot publish a poll that is already ${poll.status}`, 400));
    }
    // Set status to active
    poll = yield poll_model_1.default.findByIdAndUpdate(req.params.id, { status: poll_model_1.PollStatus.ACTIVE }, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: poll,
    });
}));
// @desc    Close poll
// @route   PUT /api/polls/:id/close
// @access  Private/Admin/Secretary
exports.closePoll = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let poll = yield poll_model_1.default.findById(req.params.id);
    if (!poll) {
        return next(new errorResponse_1.default(`Poll not found with id of ${req.params.id}`, 404));
    }
    // Check if user is admin or secretary
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to close polls`, 403));
    }
    // Only allow closing if poll is active
    if (poll.status !== poll_model_1.PollStatus.ACTIVE) {
        return next(new errorResponse_1.default(`Cannot close a poll that is ${poll.status}`, 400));
    }
    // Set status to closed
    poll = yield poll_model_1.default.findByIdAndUpdate(req.params.id, { status: poll_model_1.PollStatus.CLOSED }, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: poll,
    });
}));
// @desc    Respond to poll
// @route   POST /api/polls/:id/respond
// @access  Private
exports.respondToPoll = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const poll = yield poll_model_1.default.findById(req.params.id);
    if (!poll) {
        return next(new errorResponse_1.default(`Poll not found with id of ${req.params.id}`, 404));
    }
    // Check if poll is active
    if (poll.status !== poll_model_1.PollStatus.ACTIVE) {
        return next(new errorResponse_1.default(`Cannot respond to a poll that is ${poll.status}`, 400));
    }
    // Check if option is valid
    const optionId = req.body.optionId;
    const option = poll.options.find((opt) => opt._id.toString() === optionId);
    if (!option) {
        return next(new errorResponse_1.default(`Invalid option ID for this poll`, 400));
    }
    // Check if user has already responded
    const existingResponse = yield pollResponse_model_1.default.findOne({
        pollId: poll._id,
        userId: req.user._id,
    });
    if (existingResponse) {
        return next(new errorResponse_1.default(`You have already responded to this poll`, 400));
    }
    // Create response
    const response = yield pollResponse_model_1.default.create({
        pollId: poll._id,
        optionId: optionId,
        userId: req.user._id,
    });
    res.status(201).json({
        success: true,
        data: response,
    });
}));
// @desc    Get poll results
// @route   GET /api/polls/:id/results
// @access  Private/Admin/Secretary
exports.getPollResults = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const poll = yield poll_model_1.default.findById(req.params.id).populate({
        path: 'createdBy',
        select: 'firstName lastName email',
    });
    if (!poll) {
        return next(new errorResponse_1.default(`Poll not found with id of ${req.params.id}`, 404));
    }
    // Only admin and secretary can view poll results anytime
    // Others can only view results of closed polls
    if (poll.status !== poll_model_1.PollStatus.CLOSED &&
        req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`Results are only available when the poll is closed`, 400));
    }
    // Get response count for each option
    const responseCountsByOption = yield pollResponse_model_1.default.aggregate([
        {
            $match: {
                pollId: new mongoose_1.default.Types.ObjectId(poll._id),
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
    const totalResponses = yield pollResponse_model_1.default.countDocuments({
        pollId: poll._id,
    });
    // Add counts and percentages to options
    const optionsWithStats = poll.options.map((option) => {
        const count = optionCountMap.get(option._id.toString()) || 0;
        return {
            _id: option._id,
            text: option.text,
            count,
            percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
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
}));
// @desc    Get poll statistics
// @route   GET /api/polls/stats
// @access  Private/Admin
exports.getPollStats = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Only admin can view poll statistics
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        throw new errorResponse_1.default(`User ${req.user._id} is not authorized to view poll statistics`, 403);
    }
    // Count polls by status
    const pollsByStatus = yield poll_model_1.default.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);
    // Get most active polls (by response count)
    const activePolls = yield poll_model_1.default.find({ status: poll_model_1.PollStatus.ACTIVE })
        .select('_id title startDate endDate')
        .sort({ startDate: -1 });
    const activePollsWithCounts = yield Promise.all(activePolls.map((poll) => __awaiter(void 0, void 0, void 0, function* () {
        const responseCount = yield pollResponse_model_1.default.countDocuments({
            pollId: poll._id,
        });
        return {
            _id: poll._id,
            title: poll.title,
            startDate: poll.startDate,
            endDate: poll.endDate,
            responseCount,
        };
    })));
    // Sort by response count
    activePollsWithCounts.sort((a, b) => b.responseCount - a.responseCount);
    // Get recent polls
    const recentPolls = yield poll_model_1.default.find()
        .select('_id title status startDate endDate')
        .sort({ createdAt: -1 })
        .limit(5);
    // Get response statistics for each poll
    const recentPollsWithStats = yield Promise.all(recentPolls.map((poll) => __awaiter(void 0, void 0, void 0, function* () {
        const responseCount = yield pollResponse_model_1.default.countDocuments({
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
    })));
    res.status(200).json({
        success: true,
        data: {
            pollsByStatus,
            mostActivePolls: activePollsWithCounts.slice(0, 5),
            recentPolls: recentPollsWithStats,
        },
    });
}));
