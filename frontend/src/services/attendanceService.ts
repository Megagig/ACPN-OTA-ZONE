import api from './api';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Event {
  _id: string;
  title: string;
  startDate: string;
  eventType: string;
  attendees?: any[];
}

export interface AttendeeWithUser {
  _id: string;
  eventId: string;
  userId: User;
  attended: boolean;
  markedBy: User;
  markedAt: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const attendanceService = {
  // Get all events for a specific year
  getEvents: async (year: number): Promise<Event[]> => {
    const response = await api.get(`/events?year=${year}`);
    // Ensure we return an array, even if the response data is nested
    return Array.isArray(response.data) ? response.data : 
           Array.isArray(response.data.data) ? response.data.data : [];
  },

  // Get attendees for a specific event
  getEventAttendees: async (eventId: string): Promise<AttendeeWithUser[]> => {
    const response = await api.get(`/events/${eventId}/attendance`);
    return response.data.data;
  },

  // Update attendance status for multiple attendees
  updateAttendance: async (eventId: string, attendanceData: { userId: string; attended: boolean }[]): Promise<void> => {
    await api.post(`/events/${eventId}/attendance`, { attendanceList: attendanceData });
  },

  // Calculate attendance penalties for a year
  calculatePenalties: async (year: number): Promise<void> => {
    await api.post(`/attendance/penalties/calculate`, { year });
  },

  // Send attendance warnings
  sendWarnings: async (year: number): Promise<void> => {
    await api.post(`/attendance/warnings/send`, { year });
  },

  // Export attendance as CSV
  exportAttendanceCSV: async (eventId: string): Promise<Blob> => {
    const response = await api.get(`/events/${eventId}/attendance/export`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default attendanceService; 