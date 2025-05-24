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
import { UserRole } from '../models/user.model';

const router = express.Router();

// Protect all routes
router.use(protect);

// Public routes (still protected but available to all logged-in users)
router.route('/').get(getAllPolls);
router.route('/:id').get(getPoll);
router.route('/:id/respond').post(respondToPoll);

// Admin/Secretary routes
router
  .route('/stats')
  .get(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), getPollStats);

router
  .route('/')
  .post(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    createPoll
  );

router
  .route('/:id')
  .put(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    updatePoll
  )
  .delete(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    deletePoll
  );

router
  .route('/:id/publish')
  .put(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    publishPoll
  );

router
  .route('/:id/close')
  .put(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    closePoll
  );

router
  .route('/:id/results')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    getPollResults
  );

export default router;
