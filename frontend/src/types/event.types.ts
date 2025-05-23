// Types for Event Management
export interface Event {
  _id: string;
  title: string;
  description: string;
  type: EventType;
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
  registrationRequired: boolean;
  registrationDeadline?: string;
  registrationFee?: number;
  maxAttendees?: number;
  organizerName: string;
  organizerId?: string; // Reference to user ID
  attachments?: string[]; // URLs to event attachments
  thumbnail?: string; // URL to event image
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type EventType =
  | 'conference'
  | 'workshop'
  | 'seminar'
  | 'training'
  | 'meeting'
  | 'social'
  | 'other';

export type EventStatus = 'draft' | 'published' | 'canceled' | 'completed';

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
