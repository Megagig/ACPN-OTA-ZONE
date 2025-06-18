"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const attendanceController_1 = require("../controllers/attendanceController");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_middleware_1.protect);
// Get events for a specific year
router.get('/events', attendanceController_1.getEvents);
// Get attendees for a specific event
router.get('/events/:eventId/attendees', attendanceController_1.getEventAttendees);
// Update attendance for an event
router.put('/events/:eventId/attendance', attendanceController_1.updateAttendance);
// Calculate penalties for a year
router.post('/penalties/calculate', attendanceController_1.calculatePenalties);
// Send attendance warnings
router.post('/warnings/send', attendanceController_1.sendWarnings);
// Export attendance as CSV
router.get('/events/:eventId/attendance/export', attendanceController_1.exportAttendanceCSV);
exports.default = router;
