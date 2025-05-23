import api from './api';
import type { Event, EventAttendee, EventSummary } from '../types/event.types';

const BASE_URL = '/api';

// For demonstration, using mock data instead of actual API calls
// In production, replace these with actual API calls

// Mock events data for demo purposes
const mockEvents: Event[] = [
  {
    _id: 'evt001',
    title: 'Annual Pharmacy Conference 2025',
    description:
      'Join us for the annual ACPN Ota Zone conference featuring keynote speakers, workshops, and networking opportunities.',
    type: 'conference',
    startDate: '2025-07-15T09:00:00',
    endDate: '2025-07-17T17:00:00',
    location: {
      name: 'Ota Conference Center',
      address: '123 Pharmacy Road',
      city: 'Ota',
      state: 'Ogun',
      virtual: false,
    },
    status: 'published',
    registrationRequired: true,
    registrationDeadline: '2025-07-10T23:59:59',
    registrationFee: 5000,
    maxAttendees: 200,
    organizerName: 'ACPN Event Committee',
    organizerId: 'user123',
    thumbnail: 'https://example.com/images/event1.jpg',
    tags: ['conference', 'annual', 'pharmacy'],
    createdAt: '2025-05-01T10:30:00',
    updatedAt: '2025-05-01T10:30:00',
  },
  {
    _id: 'evt002',
    title: 'Pharmacy Practice Workshop',
    description:
      'A hands-on workshop on modern pharmacy practices and patient care.',
    type: 'workshop',
    startDate: '2025-06-20T10:00:00',
    endDate: '2025-06-20T16:00:00',
    location: {
      name: 'ACPN Training Center',
      address: '45 Healthcare Avenue',
      city: 'Ota',
      state: 'Ogun',
      virtual: false,
    },
    status: 'published',
    registrationRequired: true,
    registrationDeadline: '2025-06-15T23:59:59',
    registrationFee: 2000,
    maxAttendees: 50,
    organizerName: 'Training Committee',
    organizerId: 'user456',
    thumbnail: 'https://example.com/images/event2.jpg',
    tags: ['workshop', 'training', 'practice'],
    createdAt: '2025-05-05T11:20:00',
    updatedAt: '2025-05-05T11:20:00',
  },
  {
    _id: 'evt003',
    title: 'Virtual Town Hall Meeting',
    description: 'Monthly meeting to discuss zone updates and member concerns.',
    type: 'meeting',
    startDate: '2025-06-01T18:00:00',
    endDate: '2025-06-01T20:00:00',
    location: {
      name: 'Zoom Meeting',
      address: 'Online',
      city: 'Ota',
      state: 'Ogun',
      virtual: true,
      meetingLink: 'https://zoom.us/j/123456789',
    },
    status: 'published',
    registrationRequired: true,
    registrationDeadline: '2025-05-31T23:59:59',
    maxAttendees: 100,
    organizerName: 'ACPN Secretary',
    organizerId: 'user789',
    tags: ['meeting', 'virtual', 'monthly'],
    createdAt: '2025-05-10T09:45:00',
    updatedAt: '2025-05-10T09:45:00',
  },
  {
    _id: 'evt004',
    title: 'Regulatory Update Seminar',
    description:
      'Learn about the latest pharmaceutical regulations and compliance requirements.',
    type: 'seminar',
    startDate: '2025-06-10T14:00:00',
    endDate: '2025-06-10T17:00:00',
    location: {
      name: 'Pharmaceutical Council Hall',
      address: '789 Regulatory Road',
      city: 'Ota',
      state: 'Ogun',
      virtual: false,
    },
    status: 'published',
    registrationRequired: true,
    registrationDeadline: '2025-06-08T23:59:59',
    registrationFee: 1500,
    maxAttendees: 80,
    organizerName: 'Regulatory Affairs Committee',
    organizerId: 'user321',
    thumbnail: 'https://example.com/images/event4.jpg',
    tags: ['seminar', 'regulatory', 'compliance'],
    createdAt: '2025-05-15T13:15:00',
    updatedAt: '2025-05-15T13:15:00',
  },
  {
    _id: 'evt005',
    title: 'Community Health Outreach',
    description:
      'Volunteer opportunity for pharmacists to provide health services to underserved communities.',
    type: 'social',
    startDate: '2025-06-25T09:00:00',
    endDate: '2025-06-25T15:00:00',
    location: {
      name: 'Community Center',
      address: '456 Community Street',
      city: 'Ota',
      state: 'Ogun',
      virtual: false,
    },
    status: 'published',
    registrationRequired: true,
    registrationDeadline: '2025-06-20T23:59:59',
    maxAttendees: 30,
    organizerName: 'Community Service Committee',
    organizerId: 'user654',
    thumbnail: 'https://example.com/images/event5.jpg',
    tags: ['outreach', 'community', 'volunteer'],
    createdAt: '2025-05-20T10:10:00',
    updatedAt: '2025-05-20T10:10:00',
  },
];

// Mock attendees data for demo purposes
const mockAttendees: EventAttendee[] = [
  {
    _id: 'att001',
    event: 'evt001',
    user: 'user123',
    userName: 'John Doe',
    pharmacy: 'pharm1',
    pharmacyName: 'HealthPlus Pharmacy',
    registeredAt: '2025-05-05T10:30:00',
    status: 'confirmed',
    paid: true,
    paymentMethod: 'bank_transfer',
    paymentDate: '2025-05-05T11:20:00',
    paymentReference: 'TRF12345',
    checkedIn: false,
    createdAt: '2025-05-05T10:30:00',
    updatedAt: '2025-05-05T11:20:00',
  },
  {
    _id: 'att002',
    event: 'evt001',
    user: 'user456',
    userName: 'Jane Smith',
    pharmacy: 'pharm2',
    pharmacyName: 'MedPlus Pharmacy',
    registeredAt: '2025-05-06T09:15:00',
    status: 'confirmed',
    paid: true,
    paymentMethod: 'card',
    paymentDate: '2025-05-06T09:20:00',
    paymentReference: 'CRD67890',
    checkedIn: false,
    createdAt: '2025-05-06T09:15:00',
    updatedAt: '2025-05-06T09:20:00',
  },
  {
    _id: 'att003',
    event: 'evt002',
    user: 'user789',
    userName: 'Robert Johnson',
    pharmacy: 'pharm3',
    pharmacyName: 'City Pharmacy',
    registeredAt: '2025-05-07T14:45:00',
    status: 'confirmed',
    paid: true,
    paymentMethod: 'cash',
    paymentDate: '2025-05-07T14:50:00',
    paymentReference: 'CSH24680',
    checkedIn: false,
    createdAt: '2025-05-07T14:45:00',
    updatedAt: '2025-05-07T14:50:00',
  },
  {
    _id: 'att004',
    event: 'evt003',
    user: 'user321',
    userName: 'Sarah Williams',
    pharmacy: 'pharm4',
    pharmacyName: 'Community Pharmacy',
    registeredAt: '2025-05-08T11:30:00',
    status: 'registered',
    paid: false,
    checkedIn: false,
    createdAt: '2025-05-08T11:30:00',
    updatedAt: '2025-05-08T11:30:00',
  },
  {
    _id: 'att005',
    event: 'evt001',
    user: 'user654',
    userName: 'Michael Brown',
    pharmacy: 'pharm5',
    pharmacyName: 'Wellness Pharmacy',
    registeredAt: '2025-05-09T16:20:00',
    status: 'waitlisted',
    paid: false,
    checkedIn: false,
    createdAt: '2025-05-09T16:20:00',
    updatedAt: '2025-05-09T16:20:00',
  },
];

// Mock event summary data
const mockEventSummary: EventSummary = {
  total: 5,
  upcoming: 5,
  past: 0,
  byType: {
    conference: 1,
    workshop: 1,
    seminar: 1,
    meeting: 1,
    social: 1,
    training: 0,
    other: 0,
  },
  recentEvents: mockEvents.slice(0, 3),
  topAttendedEvents: [
    { event: mockEvents[0], attendeeCount: 3 },
    { event: mockEvents[1], attendeeCount: 1 },
    { event: mockEvents[2], attendeeCount: 1 },
  ],
};

// Helper for simulating API responses with delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Events API
export const getEvents = async (
  params?: Record<string, unknown>
): Promise<Event[]> => {
  // For demo purposes, return mock data
  await delay(800);
  return mockEvents;

  // Real API call
  // const response = await api.get(`${BASE_URL}/events`, { params });
  // return response.data.data;
};

export const getEventById = async (id: string): Promise<Event> => {
  // For demo purposes, return mock data
  await delay(800);
  const event = mockEvents.find((e) => e._id === id);
  if (!event) throw new Error('Event not found');
  return event;

  // Real API call
  // const response = await api.get(`${BASE_URL}/events/${id}`);
  // return response.data.data;
};

export const createEvent = async (data: Partial<Event>): Promise<Event> => {
  // For demo purposes, just return a mock result
  await delay(800);
  return {
    _id: 'new-' + Date.now(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Event;

  // Real API call
  // const response = await api.post(`${BASE_URL}/events`, data);
  // return response.data.data;
};

export const updateEvent = async (
  id: string,
  data: Partial<Event>
): Promise<Event> => {
  // For demo purposes, just return a mock result
  await delay(800);
  return {
    _id: id,
    ...data,
    updatedAt: new Date().toISOString(),
  } as Event;

  // Real API call
  // const response = await api.put(`${BASE_URL}/events/${id}`, data);
  // return response.data.data;
};

export const deleteEvent = async (id: string): Promise<void> => {
  // For demo purposes, just add a delay
  await delay(800);

  // Real API call
  // await api.delete(`${BASE_URL}/events/${id}`);
};

export const getEventSummary = async (): Promise<EventSummary> => {
  // For demo purposes, return mock data
  await delay(800);
  return mockEventSummary;

  // Real API call
  // const response = await api.get(`${BASE_URL}/events/summary`);
  // return response.data.data;
};

// Event Attendees API
export const getEventAttendees = async (
  eventId: string
): Promise<EventAttendee[]> => {
  // For demo purposes, return mock data
  await delay(800);
  return mockAttendees.filter((a) => a.event === eventId);

  // Real API call
  // const response = await api.get(`${BASE_URL}/events/${eventId}/attendees`);
  // return response.data.data;
};

export const registerForEvent = async (
  eventId: string,
  data: Partial<EventAttendee>
): Promise<EventAttendee> => {
  // For demo purposes, just return a mock result
  await delay(800);
  return {
    _id: 'new-' + Date.now(),
    event: eventId,
    ...data,
    registeredAt: new Date().toISOString(),
    status: 'registered',
    checkedIn: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as EventAttendee;

  // Real API call
  // const response = await api.post(`${BASE_URL}/events/${eventId}/register`, data);
  // return response.data.data;
};

export const updateAttendeeStatus = async (
  eventId: string,
  attendeeId: string,
  status: AttendeeStatus
): Promise<EventAttendee> => {
  // For demo purposes, just return a mock result
  await delay(800);
  return {
    _id: attendeeId,
    event: eventId,
    status,
    updatedAt: new Date().toISOString(),
  } as EventAttendee;

  // Real API call
  // const response = await api.put(`${BASE_URL}/events/${eventId}/attendees/${attendeeId}`, { status });
  // return response.data.data;
};

export const checkInAttendee = async (
  eventId: string,
  attendeeId: string
): Promise<EventAttendee> => {
  // For demo purposes, just return a mock result
  await delay(800);
  return {
    _id: attendeeId,
    event: eventId,
    checkedIn: true,
    checkedInAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as EventAttendee;

  // Real API call
  // const response = await api.put(`${BASE_URL}/events/${eventId}/attendees/${attendeeId}/check-in`);
  // return response.data.data;
};

// All exported functions
const eventService = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventSummary,
  getEventAttendees,
  registerForEvent,
  updateAttendeeStatus,
  checkInAttendee,
};

export default eventService;
