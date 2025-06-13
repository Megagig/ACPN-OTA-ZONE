import express from 'express';
import {
  createThread,
  getUserThreads as getThreads,
  getThread,
  sendMessage,
  markMessageAsRead,
  markThreadAsRead,
  addParticipants as addParticipant,
  leaveThread as removeParticipant,
  updateParticipantRole,
  updateNotificationSettings,
  searchUsers,
  deleteMessage,
  deleteThread,
} from '../controllers/message.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Protect all routes
router.use(protect);

// Thread routes
router.post('/threads', createThread);
router.get('/threads', getThreads);
router.get('/threads/:threadId', getThread);
router.delete('/threads/:threadId', deleteThread);

// Message routes
router.post('/threads/:threadId/messages', sendMessage);
router.patch('/messages/:messageId/read', markMessageAsRead);
router.patch('/threads/:threadId/read', markThreadAsRead);
router.delete('/messages/:messageId', deleteMessage);

// Participant routes
router.post('/threads/:threadId/participants', addParticipant);
router.delete('/threads/:threadId/participants/:userId', removeParticipant);
router.patch(
  '/threads/:threadId/participants/:userId/role',
  updateParticipantRole
);
router.patch(
  '/threads/:threadId/participants/:userId/notifications',
  updateNotificationSettings
);

// Utility routes
router.get('/users/search', searchUsers);

export default router;
