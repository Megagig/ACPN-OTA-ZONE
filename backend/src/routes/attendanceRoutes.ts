import express from 'express';
import {
  getEvents,
  getEventAttendees,
  updateAttendance,
  calculatePenalties,
  sendWarnings,
  exportAttendanceCSV
} from '../controllers/attendanceController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get events for a specific year
router.get('/events', getEvents);

// Get attendees for a specific event
router.get('/events/:eventId/attendees', getEventAttendees);

// Update attendance for an event
router.put('/events/:eventId/attendance', updateAttendance);

// Calculate penalties for a year
router.post('/penalties/calculate', calculatePenalties);

// Send attendance warnings
router.post('/warnings/send', sendWarnings);

// Export attendance as CSV
router.get('/events/:eventId/attendance/export', exportAttendanceCSV);

export default router; 