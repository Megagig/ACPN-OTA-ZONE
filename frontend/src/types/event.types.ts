// Types for Event Management
export interface Event {
  _id: string;
  title: string;
  description: string;
  eventType: EventType;
  type?: EventType; // Added type as some components use this instead of eventType
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
  status: EventStatus;
  requiresRegistration: boolean;
  registrationRequired?: boolean; // Added registrationRequired as some components use this
  registrationDeadline?: string;
  registrationFee?: number;
  capacity?: number;
  maxAttendees?: number; // Added maxAttendees as some components use this
  isAttendanceRequired: boolean;
  organizer: string;
  organizerId?: string; // Reference to user ID
  imageUrl?: string; // URL to event image
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  registrations?: EventRegistration[];
  attendees?: EventAttendance[];
}

export type EventType =
  | 'conference'
  | 'workshop'
  | 'seminar'
  | 'training'
  | 'meetings'
  | 'state_events'
  | 'social'
  | 'other';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface EventRegistration {
  _id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  registeredAt: string;
  registrationDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type RegistrationStatus =
  | 'registered'
  | 'confirmed'
  | 'cancelled'
  | 'waitlist';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'waived';

export interface EventAttendance {
  _id: string;
  eventId: string;
  userId: string;
  attendedAt: string;
  markedBy: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventNotification {
  _id: string;
  eventId: string;
  userId: string;
  emailSent: boolean;
  emailSentAt?: string;
  seen: boolean;
  seenAt?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MeetingPenaltyConfig {
  _id: string;
  year: number;
  penaltyRules: {
    attendanceCount: number;
    penaltyType: 'multiplier' | 'fixed';
    penaltyValue: number;
  }[];
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

// Legacy interface for backward compatibility
export interface EventAttendee {
  _id: string;
  event: string | Event; // Event ID or Event object
  user: string; // User ID
  userName: string;
  pharmacy?: string; // Pharmacy ID
  pharmacyName?: string;
  registeredAt: string;
  status: AttendeeStatus;
  paid: boolean;
  paymentMethod?: string;
  paymentDate?: string;
  paymentReference?: string;
  checkedIn: boolean;
  checkedInAt?: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AttendeeStatus =
  | 'registered'
  | 'confirmed'
  | 'waitlisted'
  | 'canceled'
  | 'attended'
  | 'no-show';

export interface EventSummary {
  total: number;
  upcoming: number;
  past: number;
  byType: Record<EventType, number>;
  recentEvents: Event[];
  topAttendedEvents: {
    event: Event;
    attendeeCount: number;
  }[];
}

// Additional types for the new event management system

export interface CreateEventData {
  title: string;
  description: string;
  eventType: EventType;
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
}

export interface UpdateEventData extends Partial<CreateEventData> {
  status?: EventStatus;
}

export interface EventFilters {
  eventType?: EventType;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  organizer?: string;
  requiresRegistration?: boolean;
  dateRange?: string;
}

export interface AttendanceMarkingData {
  userId: string;
  eventId: string;
  notes?: string;
  // New fields for pharmacy attendance
  pharmacyId?: string;
  pharmacyName?: string;
  pharmacyRegNumber?: string;
  // Flag to indicate attendance status
  attended?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface EventRegistrationData {
  eventId: string;
  paymentReference?: string;
  notes?: string;
  emergencyContact?: string;
  dietaryRequirements?: string;
  specialNeeds?: string;
}

export interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  totalRegistrations: number;
  totalAttendees: number;
  eventsByType: Record<EventType, number>;
}

export interface UserEventHistory {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
  };
  data: {
    registrations: EventRegistration[];
    attendance: EventAttendance[];
    eventHistory: Array<{
      registration: EventRegistration;
      attendance: EventAttendance | null;
    }>;
  };
}

export interface PenaltyInfo {
  year: number;
  meetingsAttended: number;
  missedMeetings?: number;
  penaltyAmount: number;
  totalPenalty?: number;
  penaltyType: string;
  isPaid: boolean;
}
