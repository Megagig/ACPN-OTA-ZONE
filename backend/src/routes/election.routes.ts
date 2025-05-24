import express from 'express';
import {
  getAllElections,
  getElection,
  createElection,
  updateElection,
  deleteElection,
  cancelElection,
  addCandidate,
  getCandidates,
  removeCandidate,
  castVote,
  getElectionResults,
  getElectionStats,
} from '../controllers/election.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Protect all routes
router.use(protect);

// Public routes (still protected but available to all logged-in users)
router.route('/').get(getAllElections);
router.route('/:id').get(getElection);
router.route('/:id/candidates').get(getCandidates);
router.route('/:id/results').get(getElectionResults);
router.route('/:id/vote').post(castVote);

// Admin routes
router
  .route('/stats')
  .get(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), getElectionStats);

router
  .route('/')
  .post(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), createElection);

router
  .route('/:id')
  .put(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), updateElection)
  .delete(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), deleteElection);

router
  .route('/:id/cancel')
  .put(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), cancelElection);

router
  .route('/:id/candidates')
  .post(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), addCandidate);

router
  .route('/:id/candidates/:candidateId')
  .delete(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), removeCandidate);

export default router;
