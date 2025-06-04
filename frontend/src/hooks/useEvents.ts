import {
  useQueryWithPagination,
  useFetchResource,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
  useBulkAction,
} from './useApiQuery';

// Event status and type enums
export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum EventType {
  MEETING = 'meeting',
  WORKSHOP = 'workshop',
  CONFERENCE = 'conference',
  SOCIAL = 'social',
  TRAINING = 'training',
  OTHER = 'other',
}

// Types
export interface Event {
  _id: string;
  title: string;
  description: string;
  eventType: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  location: string;
  isVirtual: boolean;
  virtualLink?: string;
  isPublic: boolean;
  requiresRegistration: boolean;
  maxAttendees?: number;
  registrationDeadline?: string;
  organizers: string[];
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  images?: string[];
  attachments?: { name: string; url: string }[];
}

export interface EventFilters {
  status?: EventStatus;
  eventType?: EventType;
  startDate?: string;
  endDate?: string;
  search?: string;
  isPublic?: boolean;
}

// Base endpoint and key
const EVENTS_ENDPOINT = '/events';
const EVENTS_KEY = 'events';

// Event query hooks
export function useEvents(page = 1, limit = 10, filters: EventFilters = {}) {
  return useQueryWithPagination<Event>(
    EVENTS_ENDPOINT,
    [EVENTS_KEY],
    page,
    limit,
    filters,
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

export function useEvent(id: string | undefined) {
  return useFetchResource<Event>(EVENTS_ENDPOINT, id, [EVENTS_KEY], {
    staleTime: 60 * 1000, // 1 minute (events can have frequent updates)
  });
}

export function useCreateEvent() {
  return useCreateResource<
    Event,
    Omit<Event, '_id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
  >(EVENTS_ENDPOINT, [EVENTS_KEY, 'create']);
}

export function useUpdateEvent() {
  return useUpdateResource<Event, Partial<Event>>(EVENTS_ENDPOINT, [
    EVENTS_KEY,
    'update',
  ]);
}

export function useDeleteEvent() {
  return useDeleteResource<{ success: boolean }>(EVENTS_ENDPOINT, [
    EVENTS_KEY,
    'delete',
  ]);
}

export function usePublishEvent() {
  return useUpdateResource<Event, { status: EventStatus }>(
    `${EVENTS_ENDPOINT}`,
    [EVENTS_KEY, 'publish'],
    {
      mutationFn: ({ id, data }) => {
        return fetch(`${EVENTS_ENDPOINT}/${id}/publish`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }).then((res) => res.json());
      },
    }
  );
}

export function useCancelEvent() {
  return useUpdateResource<Event, { reason?: string }>(
    `${EVENTS_ENDPOINT}`,
    [EVENTS_KEY, 'cancel'],
    {
      mutationFn: ({ id, data }) => {
        return fetch(`${EVENTS_ENDPOINT}/${id}/cancel`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }).then((res) => res.json());
      },
    }
  );
}

export function useCompleteEvent() {
  return useUpdateResource<Event, { summary?: string }>(
    `${EVENTS_ENDPOINT}`,
    [EVENTS_KEY, 'complete'],
    {
      mutationFn: ({ id, data }) => {
        return fetch(`${EVENTS_ENDPOINT}/${id}/complete`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }).then((res) => res.json());
      },
    }
  );
}

// Attendance Management
export interface Attendee {
  _id: string;
  eventId: string;
  userId: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  registrationDate: string;
  attended: boolean;
  checkinTime?: string;
  notes?: string;
}

export function useEventAttendees(
  eventId: string | undefined,
  page = 1,
  limit = 50
) {
  return useQueryWithPagination<Attendee>(
    `${EVENTS_ENDPOINT}/${eventId}/attendees`,
    [EVENTS_KEY, eventId, 'attendees'],
    page,
    limit,
    {},
    {
      enabled: !!eventId,
      staleTime: 30 * 1000, // 30 seconds (attendance can change frequently during events)
    }
  );
}

export function useMarkAttendance() {
  return useUpdateResource<Attendee, { attended: boolean; notes?: string }>(
    `${EVENTS_ENDPOINT}`,
    [EVENTS_KEY, 'attendance'],
    {
      mutationFn: ({ id, data }) => {
        const [eventId, attendeeId] = id.split(':');
        return fetch(`${EVENTS_ENDPOINT}/${eventId}/attendees/${attendeeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }).then((res) => res.json());
      },
    }
  );
}

export function useBulkMarkAttendance() {
  return useBulkAction<
    { success: boolean; count: number },
    { attendeeIds: string[]; attended: boolean }
  >(EVENTS_ENDPOINT, 'bulk-attendance', [EVENTS_KEY, 'bulk-attendance']);
}

// User attendance record
export function useUserAttendanceRecord(
  userId: string | undefined,
  year?: number
) {
  return useFetchResource<{
    meetings: number;
    attended: number;
    percentage: number;
  }>(
    `${EVENTS_ENDPOINT}/attendance/${userId}`,
    year ? year.toString() : 'current',
    [EVENTS_KEY, 'attendance', userId],
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}
