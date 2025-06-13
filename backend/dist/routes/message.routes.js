"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const message_controller_1 = require("../controllers/message.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Protect all routes
router.use(auth_middleware_1.protect);
// Thread routes
router.post('/threads', message_controller_1.createThread);
router.get('/threads', message_controller_1.getUserThreads);
router.get('/threads/:threadId', message_controller_1.getThread);
router.delete('/threads/:threadId', message_controller_1.deleteThread);
// Message routes
router.post('/threads/:threadId/messages', message_controller_1.sendMessage);
router.patch('/messages/:messageId/read', message_controller_1.markMessageAsRead);
router.patch('/threads/:threadId/read', message_controller_1.markThreadAsRead);
router.delete('/messages/:messageId', message_controller_1.deleteMessage);
// Participant routes
router.post('/threads/:threadId/participants', message_controller_1.addParticipants);
router.delete('/threads/:threadId/participants/:userId', message_controller_1.leaveThread);
router.patch('/threads/:threadId/participants/:userId/role', message_controller_1.updateParticipantRole);
router.patch('/threads/:threadId/participants/:userId/notifications', message_controller_1.updateNotificationSettings);
// Utility routes
router.get('/users/search', message_controller_1.searchUsers);
exports.default = router;
