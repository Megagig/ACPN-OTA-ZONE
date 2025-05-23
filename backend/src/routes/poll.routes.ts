import express from 'express';
import {
  getAllPolls,
  getPoll,
  createPoll,
  updatePoll,
  deletePoll,
  publishPoll,
  closePoll,
  respondToPoll,
  getPollResults,
  getPollStats,
} from '../controllers/poll.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Protect all routes
router.use(protect);

// Public routes (still protected but available to all logged-in users)
router.route('/').get(getAllPolls);
router.route('/:id').get(getPoll);
router.route('/:id/respond').post(respondToPoll);

// Admin/Secretary routes
router.route('/stats').get(authorize('admin', 'superadmin'), getPollStats);

router
  .route('/')
  .post(authorize('admin', 'superadmin', 'secretary'), createPoll);

router
  .route('/:id')
  .put(authorize('admin', 'superadmin', 'secretary'), updatePoll)
  .delete(authorize('admin', 'superadmin', 'secretary'), deletePoll);

router
  .route('/:id/publish')
  .put(authorize('admin', 'superadmin', 'secretary'), publishPoll);

router
  .route('/:id/close')
  .put(authorize('admin', 'superadmin', 'secretary'), closePoll);

router
  .route('/:id/results')
  .get(authorize('admin', 'superadmin', 'secretary'), getPollResults);

export default router;
