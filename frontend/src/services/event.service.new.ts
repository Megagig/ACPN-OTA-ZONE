import api from './api';
import type {
  Event,
  EventRegistration,
  EventAttendance,
  EventNotification,
  MeetingPenaltyConfig,
  EventSummary,
  EventAttendee,
} from '../types/event.types';

const BASE_URL = '/api/events';

class EventService {
  // Event CRUD operations
  async getEvents(params?: {
    page?: number;
    limit?: number;
    eventType?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    success: boolean;
    data: Event[];
    pagination: {
      page: number;
      totalPages: number;
      total: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

    const response = await api.get(url);
    return response.data;
  }

  async getEvent(id: string): Promise<{
    success: boolean;
    data: Event;
  }> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  }

  async createEvent(eventData: {
    title: string;
    description: string;
    eventType: string;
    startDate: string;
    endDate: string;
    location: {
      name: string;
      address: string;
      city: string;
      state: string;
      virtual?: boolean;
      meetingLink?: string;
    };
    requiresRegistration: boolean;
    registrationDeadline?: string;
    registrationFee?: number;
    capacity?: number;
    isAttendanceRequired: boolean;
    organizer: string;
    imageUrl?: string;
    tags?: string[];
  }): Promise<{
    success: boolean;
    data: Event;
  }> {
    const response = await api.post(BASE_URL, eventData);
    return response.data;
  }

  async updateEvent(
    id: string,
    eventData: Partial<Event>
  ): Promise<{
    success: boolean;
    data: Event;
  }> {
    const response = await api.put(`${BASE_URL}/${id}`, eventData);
    return response.data;
  }

  async deleteEvent(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  }

  // Registration operations
  async registerForEvent(eventId: string): Promise<{
    success: boolean;
    message: string;
    data: { status: string };
  }> {
    const response = await api.post(`${BASE_URL}/${eventId}/register`);
    return response.data;
  }

  async cancelRegistration(eventId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.delete(`${BASE_URL}/${eventId}/register`);
    return response.data;
  }

  // Attendance operations
  async markAttendance(
    eventId: string,
    attendanceData: {
      userId: string;
      notes?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    data: EventAttendance;
  }> {
    const response = await api.post(
      `${BASE_URL}/${eventId}/attendance`,
      attendanceData
    );
    return response.data;
  }

  // My events (for members)
  async getMyEvents(): Promise<{
    success: boolean;
    data: {
      registeredEvents: Event[];
      attendedEvents: Event[];
      upcomingEvents: Event[];
      penalties: {
        totalPenalties: number;
        yearlyBreakdown: Array<{
          year: number;
          attendanceCount: number;
          penaltyAmount: number;
        }>;
      };
    };
  }> {
    const response = await api.get(`${BASE_URL}/my-events`);
    return response.data;
  }

  // Notifications
  async acknowledgeEvent(eventId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.post(`${BASE_URL}/${eventId}/acknowledge`);
    return response.data;
  }

  // Penalty configuration (admin only)
  async getPenaltyConfigs(): Promise<{
    success: boolean;
    data: MeetingPenaltyConfig[];
  }> {
    const response = await api.get('/api/penalty-config');
    return response.data;
  }

  async createPenaltyConfig(configData: {
    year: number;
    penaltyRules: Array<{
      attendanceCount: number;
      penaltyType: 'multiplier' | 'fixed';
      penaltyValue: number;
    }>;
  }): Promise<{
    success: boolean;
    data: MeetingPenaltyConfig;
  }> {
    const response = await api.post('/api/penalty-config', configData);
    return response.data;
  }

  // Legacy methods for backward compatibility
  async getEventSummary(): Promise<EventSummary> {
    try {
      const { data: eventsResponse } = await this.getEvents();
      const events = eventsResponse.data;

      const now = new Date();
      const total = events.length;
      const upcoming = events.filter(
        (event) => new Date(event.startDate) > now
      ).length;
      const past = events.filter(
        (event) => new Date(event.endDate) < now
      ).length;

      const byType = events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const recentEvents = events
        .sort(
          (a, b) =>
            new Date(b.createdAt || '').getTime() -
            new Date(a.createdAt || '').getTime()
        )
        .slice(0, 5);

      return {
        total,
        upcoming,
        past,
        byType,
        recentEvents,
        topAttendedEvents: [], // This would need attendance data
      };
    } catch (error) {
      console.error('Error fetching event summary:', error);
      return {
        total: 0,
        upcoming: 0,
        past: 0,
        byType: {},
        recentEvents: [],
        topAttendedEvents: [],
      };
    }
  }

  // Legacy method for attendees
  async getEventAttendees(eventId: string): Promise<EventAttendee[]> {
    try {
      const { data: eventResponse } = await this.getEvent(eventId);
      const event = eventResponse.data;

      // Convert registrations to legacy attendee format
      const attendees: EventAttendee[] = (event.registrations || []).map(
        (reg) => ({
          _id: reg._id,
          event: eventId,
          user: reg.userId,
          userName: 'Unknown', // Would need user data
          registeredAt: reg.registeredAt,
          status: reg.status as any,
          paid: reg.paymentStatus === 'paid',
          paymentDate: reg.updatedAt,
          checkedIn: false, // Would need attendance data
          createdAt: reg.createdAt,
          updatedAt: reg.updatedAt,
        })
      );

      return attendees;
    } catch (error) {
      console.error('Error fetching event attendees:', error);
      return [];
    }
  }

  async updateAttendeeStatus(
    eventId: string,
    attendeeId: string,
    status: string
  ): Promise<EventAttendee> {
    // This would need to be implemented based on registration/attendance operations
    throw new Error(
      'Not implemented - use registration/attendance methods instead'
    );
  }

  // Legacy compatibility methods
  async getEventById(id: string): Promise<Event | null> {
    try {
      const { data: response } = await this.getEvent(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      return null;
    }
  }

  async checkInAttendee(
    eventId: string,
    attendeeId: string
  ): Promise<EventAttendee | null> {
    // This would need to be implemented using attendance marking
    throw new Error('Not implemented - use markAttendance method instead');
  }
}

const eventService = new EventService();
export default eventService;
