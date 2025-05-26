"use strict";
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
exports.deleteDueType = exports.updateDueType = exports.createDueType = exports.getDueType = exports.getDueTypes = void 0;
const dueType_model_1 = __importDefault(require("../models/dueType.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
// @desc    Get all due types
// @route   GET /api/due-types
// @access  Private/Admin/Financial Secretary/Treasurer
exports.getDueTypes = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { isActive } = req.query;
    const query = {};
    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }
    const dueTypes = yield dueType_model_1.default.find(query)
        .populate('createdBy', 'firstName lastName email')
        .sort({ name: 1 });
    res.status(200).json({
        success: true,
        count: dueTypes.length,
        data: dueTypes,
    });
}));
// @desc    Get single due type
// @route   GET /api/due-types/:id
// @access  Private/Admin/Financial Secretary/Treasurer
exports.getDueType = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const dueType = yield dueType_model_1.default.findById(req.params.id).populate('createdBy', 'firstName lastName email');
    if (!dueType) {
        return next(new errorResponse_1.default(`Due type not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
        success: true,
        data: dueType,
    });
}));
// @desc    Create new due type
// @route   POST /api/due-types
// @access  Private/Admin/Financial Secretary/Treasurer
exports.createDueType = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    req.body.createdBy = req.user._id;
    const dueType = yield dueType_model_1.default.create(req.body);
    res.status(201).json({
        success: true,
        data: dueType,
    });
}));
// @desc    Update due type
// @route   PUT /api/due-types/:id
// @access  Private/Admin/Financial Secretary/Treasurer
exports.updateDueType = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let dueType = yield dueType_model_1.default.findById(req.params.id);
    if (!dueType) {
        return next(new errorResponse_1.default(`Due type not found with id of ${req.params.id}`, 404));
    }
    dueType = yield dueType_model_1.default.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: dueType,
    });
}));
// @desc    Delete due type (soft delete by setting isActive to false)
// @route   DELETE /api/due-types/:id
// @access  Private/Admin/Superadmin
exports.deleteDueType = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const dueType = yield dueType_model_1.default.findById(req.params.id);
    if (!dueType) {
        return next(new errorResponse_1.default(`Due type not found with id of ${req.params.id}`, 404));
    }
    // Soft delete by setting isActive to false
    yield dueType_model_1.default.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({
        success: true,
        data: {},
    });
}));
