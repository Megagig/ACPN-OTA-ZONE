import api from './api';
import type {
  Event,
  EventAttendance,
  MeetingPenaltyConfig,
  EventSummary,
  EventAttendee,
  EventType,
} from '../types/event.types';

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
    const url = queryString ? `/api/events?${queryString}` : '/api/events';

    const response = await api.get(url);
    return response.data;
  }

  async getEvent(id: string): Promise<{
    success: boolean;
    data: Event;
  }> {
    const response = await api.get(`/api/events/${id}`);
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
    const response = await api.post('/api/events', eventData);
    return response.data;
  }

  async updateEvent(
    id: string,
    eventData: Partial<Event>
  ): Promise<{
    success: boolean;
    data: Event;
  }> {
    const response = await api.put(`/api/events/${id}`, eventData);
    return response.data;
  }

  async deleteEvent(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.delete(`/api/events/${id}`);
    return response.data;
  }

  // Registration operations
  async registerForEvent(eventId: string): Promise<{
    success: boolean;
    message: string;
    data: { status: string };
  }> {
    const response = await api.post(`/api/events/${eventId}/register`);
    return response.data;
  }

  async cancelRegistration(eventId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.delete(`/api/events/${eventId}/register`);
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
      `/api/events/${eventId}/attendance`,
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
    const response = await api.get('/api/events/my-events');
    return response.data;
  }

  // Notifications
  async acknowledgeEvent(eventId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.post(`/api/events/${eventId}/acknowledge`);
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
      const response = await api.get('/api/events/summary');
      const events = response.data;
      const now = new Date();
      
      const upcoming = events.filter(
        (event: Event) => new Date(event.startDate) > now
      );
      const past = events.filter(
        (event: Event) => new Date(event.endDate) < now
      );

      const byType = events.reduce((acc: Record<EventType, number>, event: Event) => {
        const eventType = event.type || event.eventType;
        if (eventType) {
          acc[eventType] = (acc[eventType] || 0) + 1;
        }
        return acc;
      }, {} as Record<EventType, number>);

      // Sort events by start date
      const sortedEvents = events.sort(
        (a: Event, b: Event) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      return {
        total: events.length,
        upcoming: upcoming.length,
        past: past.length,
        recentEvents: sortedEvents.slice(0, 5),
        byType: byType,
        topAttendedEvents: [],
      };
    } catch (error) {
      console.error('Error fetching event summary:', error);
      return {
        total: 0,
        upcoming: 0,
        past: 0,
        recentEvents: [],
        byType: {} as Record<EventType, number>,
        topAttendedEvents: [],
      };
    }
  }

  // Legacy method for attendees
  async getEventAttendees(eventId: string): Promise<EventAttendee[]> {
    try {
      const response = await api.get(`/api/events/${eventId}`);
      const event = response.data;

      // Convert registrations to legacy attendee format
      const attendees: EventAttendee[] = (event.registrations || []).map(
        (reg: any) => ({
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
    _eventId: string,
    _attendeeId: string,
    _status: string
  ): Promise<any> {
    // This would need to be implemented based on registration/attendance operations
    throw new Error(
      'Not implemented - use registration/attendance methods instead'
    );
  }

  // Legacy compatibility methods
  async checkInAttendee(
    _eventId: string,
    _attendeeId: string
  ): Promise<EventAttendee | null> {
    // This would need to be implemented using attendance marking
    throw new Error('Not implemented - use markAttendance method instead');
  }

  async deleteAttendee(
    _eventId: string,
    _attendeeId: string
  ): Promise<any> {
    // This would need to be implemented based on registration/attendance operations
    throw new Error(
      'Not implemented - use registration/attendance methods instead'
    );
  }
}

const eventService = new EventService();
export default eventService;
