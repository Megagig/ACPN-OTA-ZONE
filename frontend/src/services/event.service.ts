import apiClient from '../utils/apiClient';
import type {
  Event,
  EventRegistration,
  EventAttendance,
  MeetingPenaltyConfig,
  CreateEventData,
  UpdateEventData,
  EventFilters,
  AttendanceMarkingData,
  PaginatedResponse,
  EventRegistrationData,
  EventStats,
  UserEventHistory,
  PenaltyInfo,
  RegistrationStatus,
  EventSummary,
} from '../types/event.types';

export class EventService {
  // Event CRUD Operations
  static async getAllEvents(
    filters: EventFilters = {},
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Event>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) => value !== undefined && value !== ''
        )
      ),
    });

    const response = await apiClient.get(`/events?${params}`);
    return response.data;
  }

  static async getEventById(id: string): Promise<Event> {
    const response = await apiClient.get(`/events/${id}`);
    return response.data.data;
  }

  static async createEvent(eventData: CreateEventData): Promise<Event> {
    const response = await apiClient.post('/events', eventData);
    return response.data.data;
  }

  static async updateEvent(
    id: string,
    eventData: UpdateEventData
  ): Promise<Event> {
    const response = await apiClient.put(`/events/${id}`, eventData);
    return response.data.data;
  }

  static async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`/events/${id}`);
  }

  static async publishEvent(id: string): Promise<Event> {
    const response = await apiClient.patch(`/events/${id}/publish`);
    return response.data.data;
  }

  static async cancelEvent(id: string): Promise<Event> {
    const response = await apiClient.patch(`/events/${id}/cancel`);
    return response.data.data;
  }

  // Registration Operations
  static async registerForEvent(
    eventId: string,
    registrationData: EventRegistrationData
  ): Promise<EventRegistration> {
    const response = await apiClient.post(
      `/events/${eventId}/register`,
      registrationData
    );
    return response.data.data;
  }

  static async unregisterFromEvent(eventId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}/register`);
  }

  static async getEventRegistrations(
    eventId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<EventRegistration>> {
    const response = await apiClient.get(
      `/events/${eventId}/registrations?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  static async updateRegistrationStatus(
    eventId: string,
    userId: string,
    status: RegistrationStatus
  ): Promise<EventRegistration> {
    const response = await apiClient.patch(
      `/events/${eventId}/registrations/${userId}`,
      { status }
    );
    return response.data.data;
  }

  // Attendance Operations
  static async markAttendance(
    eventId: string,
    attendanceData: AttendanceMarkingData[]
  ): Promise<EventAttendance[]> {
    const response = await apiClient.post(`/events/${eventId}/attendance`, {
      attendees: attendanceData,
    });
    return response.data.data;
  }

  static async getEventAttendance(
    eventId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<EventAttendance>> {
    const response = await apiClient.get(
      `/events/${eventId}/attendance?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  static async updateAttendance(
    eventId: string,
    userId: string,
    present: boolean
  ): Promise<EventAttendance> {
    const response = await apiClient.patch(
      `/events/${eventId}/attendance/${userId}`,
      { present }
    );
    return response.data.data;
  }

  // User-specific Operations
  static async getUserEventHistory(
    userId?: string,
    page = 1,
    limit = 10
  ): Promise<UserEventHistory> {
    const url = userId
      ? `/events/user/${userId}/history`
      : '/events/my-history';
    const response = await apiClient.get(`${url}?page=${page}&limit=${limit}`);
    return response.data;
  }

  static async getUserPenalties(userId?: string): Promise<PenaltyInfo> {
    const url = userId
      ? `/events/user/${userId}/penalties`
      : '/events/my-penalties';
    const response = await apiClient.get(url);
    return response.data.data;
  }

  static async getUserRegistrations(
    userId?: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<EventRegistration>> {
    const url = userId
      ? `/events/user/${userId}/registrations`
      : '/events/my-registrations';
    const response = await apiClient.get(`${url}?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Statistics and Analytics
  static async getEventStats(): Promise<EventStats> {
    const response = await apiClient.get('/events/stats');
    return response.data.data;
  }

  static async getEventStatsByType(): Promise<Record<string, number>> {
    const response = await apiClient.get('/events/stats/by-type');
    return response.data.data;
  }

  // Penalty Configuration (Admin only)
  static async getPenaltyConfig(year: number): Promise<MeetingPenaltyConfig> {
    const response = await apiClient.get(`/events/penalty-config/${year}`);
    return response.data.data;
  }

  static async updatePenaltyConfig(
    year: number,
    config: Partial<MeetingPenaltyConfig>
  ): Promise<MeetingPenaltyConfig> {
    const response = await apiClient.put(
      `/events/penalty-config/${year}`,
      config
    );
    return response.data.data;
  }

  // Image Upload
  static async uploadEventImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/events/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data.imageUrl;
  }

  // Legacy methods for backward compatibility
  static async getEvents(filters?: EventFilters): Promise<Event[]> {
    const response = await this.getAllEvents(filters);
    return response.data;
  }

  static async getEvent(id: string): Promise<Event> {
    return this.getEventById(id);
  }

  static async addEvent(eventData: CreateEventData): Promise<Event> {
    return this.createEvent(eventData);
  }

  static async editEvent(
    id: string,
    eventData: UpdateEventData
  ): Promise<Event> {
    return this.updateEvent(id, eventData);
  }

  static async removeEvent(id: string): Promise<void> {
    return this.deleteEvent(id);
  }

  // Alias for getEventAttendance for backward compatibility
  static async getEventAttendees(
    eventId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<EventAttendance>> {
    return this.getEventAttendance(eventId, page, limit);
  }

  // Check in an attendee at an event
  static async checkInAttendee(
    eventId: string,
    attendeeId: string
  ): Promise<EventAttendance> {
    const response = await apiClient.post(
      `/events/${eventId}/check-in/${attendeeId}`
    );
    return response.data.data;
  }

  // Get event summary data
  static async getEventSummary(): Promise<EventSummary> {
    const response = await apiClient.get('/events/summary');
    return response.data.data;
  }
}

// Default export for legacy compatibility
export default EventService;

// Named exports for new code
export const eventService = EventService;
