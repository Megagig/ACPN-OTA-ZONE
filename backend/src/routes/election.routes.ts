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
router.route('/stats').get(authorize('admin', 'superadmin'), getElectionStats);

router.route('/').post(authorize('admin', 'superadmin'), createElection);

router
  .route('/:id')
  .put(authorize('admin', 'superadmin'), updateElection)
  .delete(authorize('admin', 'superadmin'), deleteElection);

router
  .route('/:id/cancel')
  .put(authorize('admin', 'superadmin'), cancelElection);

router
  .route('/:id/candidates')
  .post(authorize('admin', 'superadmin'), addCandidate);

router
  .route('/:id/candidates/:candidateId')
  .delete(authorize('admin', 'superadmin'), removeCandidate);

export default router;
