"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const election_controller_1 = require("../controllers/election.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// Protect all routes
router.use(auth_middleware_1.protect);
// Public routes (still protected but available to all logged-in users)
router.route('/').get(election_controller_1.getAllElections);
router.route('/:id').get(election_controller_1.getElection);
router.route('/:id/candidates').get(election_controller_1.getCandidates);
router.route('/:id/results').get(election_controller_1.getElectionResults);
router.route('/:id/vote').post(election_controller_1.castVote);
// Admin routes
router
    .route('/stats')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), election_controller_1.getElectionStats);
router
    .route('/')
    .post((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), election_controller_1.createElection);
router
    .route('/:id')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), election_controller_1.updateElection)
    .delete((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), election_controller_1.deleteElection);
router
    .route('/:id/cancel')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), election_controller_1.cancelElection);
router
    .route('/:id/candidates')
    .post((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), election_controller_1.addCandidate);
router
    .route('/:id/candidates/:candidateId')
    .delete((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), election_controller_1.removeCandidate);
exports.default = router;
