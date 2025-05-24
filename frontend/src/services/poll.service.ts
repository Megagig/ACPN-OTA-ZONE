import api from './api';
import type {
  Poll,
  PollResponse,
  PollStatus,
  PollSubmission,
  PollResults,
  PollSummary,
  AnswerStatistics,
} from '../types/poll.types';

const BASE_URL = '/api';

// For demonstration, using mock data instead of actual API calls
// In production, replace these with actual API calls

// Mock polls data
const mockPolls: Poll[] = [
  {
    _id: 'poll001',
    title: 'Pharmacy Practice Improvement Survey',
    description:
      'Help us understand the challenges and opportunities in pharmacy practice in our zone.',
    status: 'active',
    questions: [
      {
        _id: 'q001',
        text: 'What are the biggest challenges you face in your pharmacy practice?',
        type: 'multiple_choice',
        required: true,
        order: 1,
        options: [
          { _id: 'opt001', text: 'Regulatory compliance', order: 1 },
          { _id: 'opt002', text: 'Inventory management', order: 2 },
          { _id: 'opt003', text: 'Staff training and retention', order: 3 },
          { _id: 'opt004', text: 'Competition from larger chains', order: 4 },
          {
            _id: 'opt005',
            text: 'Customer acquisition and retention',
            order: 5,
          },
          { _id: 'opt006', text: 'Financial management', order: 6 },
        ],
      },
      {
        _id: 'q002',
        text: 'How satisfied are you with the current regulatory environment?',
        type: 'rating',
        required: true,
        order: 2,
      },
      {
        _id: 'q003',
        text: 'What additional support would you like from ACPN Ota Zone?',
        type: 'text',
        required: false,
        order: 3,
      },
    ],
    startDate: '2025-05-15T00:00:00',
    endDate: '2025-05-30T23:59:59',
    isAnonymous: false,
    allowResultViewing: true,
    createdBy: 'user123',
    createdAt: '2025-05-10T09:30:00',
    updatedAt: '2025-05-10T09:30:00',
    responseCount: 15,
  },
  {
    _id: 'poll002',
    title: 'Annual Conference Topic Preferences',
    description:
      'Help us select the most relevant topics for our upcoming annual conference.',
    status: 'active',
    questions: [
      {
        _id: 'q101',
        text: 'Which of these topics would you like to see covered in the conference?',
        type: 'multiple_choice',
        required: true,
        order: 1,
        options: [
          { _id: 'opt101', text: 'Advances in pharmaceutical care', order: 1 },
          {
            _id: 'opt102',
            text: 'Digital transformation in pharmacy',
            order: 2,
          },
          {
            _id: 'opt103',
            text: 'Business management for pharmacy owners',
            order: 3,
          },
          {
            _id: 'opt104',
            text: 'Regulatory updates and compliance',
            order: 4,
          },
          { _id: 'opt105', text: 'Patient counseling skills', order: 5 },
        ],
      },
      {
        _id: 'q102',
        text: 'What format do you prefer for sessions?',
        type: 'single_choice',
        required: true,
        order: 2,
        options: [
          { _id: 'opt201', text: 'Lectures', order: 1 },
          { _id: 'opt202', text: 'Panel discussions', order: 2 },
          { _id: 'opt203', text: 'Workshops', order: 3 },
          { _id: 'opt204', text: 'Case studies', order: 4 },
        ],
      },
      {
        _id: 'q103',
        text: 'Any additional topics or speakers you would recommend?',
        type: 'text',
        required: false,
        order: 3,
      },
    ],
    startDate: '2025-05-10T00:00:00',
    endDate: '2025-05-25T23:59:59',
    isAnonymous: true,
    allowResultViewing: true,
    createdBy: 'user456',
    createdAt: '2025-05-05T14:20:00',
    updatedAt: '2025-05-05T14:20:00',
    responseCount: 28,
  },
  {
    _id: 'poll003',
    title: 'Member Satisfaction Survey',
    description:
      'Help us improve our services by providing feedback on your membership experience.',
    status: 'draft',
    questions: [
      {
        _id: 'q201',
        text: 'How would you rate your overall satisfaction with ACPN Ota Zone?',
        type: 'rating',
        required: true,
        order: 1,
      },
      {
        _id: 'q202',
        text: 'Which of our services do you find most valuable?',
        type: 'multiple_choice',
        required: true,
        order: 2,
        options: [
          { _id: 'opt301', text: 'Continuing education', order: 1 },
          { _id: 'opt302', text: 'Networking opportunities', order: 2 },
          { _id: 'opt303', text: 'Regulatory guidance', order: 3 },
          { _id: 'opt304', text: 'Legal support', order: 4 },
          { _id: 'opt305', text: 'Professional development', order: 5 },
        ],
      },
      {
        _id: 'q203',
        text: 'Would you recommend ACPN Ota Zone membership to a colleague?',
        type: 'boolean',
        required: true,
        order: 3,
      },
      {
        _id: 'q204',
        text: 'What additional services would you like us to offer?',
        type: 'text',
        required: false,
        order: 4,
      },
    ],
    startDate: '2025-06-01T00:00:00',
    endDate: '2025-06-15T23:59:59',
    isAnonymous: false,
    allowResultViewing: false,
    createdBy: 'user123',
    createdAt: '2025-05-20T10:15:00',
    updatedAt: '2025-05-20T10:15:00',
    responseCount: 0,
  },
  {
    _id: 'poll004',
    title: 'Professional Development Needs Assessment',
    description:
      'Help us plan relevant training and development activities for our members.',
    status: 'closed',
    questions: [
      {
        _id: 'q301',
        text: 'What skill areas would you like to develop further?',
        type: 'multiple_choice',
        required: true,
        order: 1,
        options: [
          { _id: 'opt401', text: 'Clinical pharmacy skills', order: 1 },
          { _id: 'opt402', text: 'Management and leadership', order: 2 },
          {
            _id: 'opt403',
            text: 'Communication and interpersonal skills',
            order: 3,
          },
          { _id: 'opt404', text: 'Technology and digital skills', order: 4 },
          { _id: 'opt405', text: 'Financial management', order: 5 },
        ],
      },
      {
        _id: 'q302',
        text: 'How often would you participate in professional development activities?',
        type: 'single_choice',
        required: true,
        order: 2,
        options: [
          { _id: 'opt501', text: 'Weekly', order: 1 },
          { _id: 'opt502', text: 'Monthly', order: 2 },
          { _id: 'opt503', text: 'Quarterly', order: 3 },
          { _id: 'opt504', text: 'Annually', order: 4 },
        ],
      },
      {
        _id: 'q303',
        text: 'What delivery format do you prefer?',
        type: 'single_choice',
        required: true,
        order: 3,
        options: [
          { _id: 'opt601', text: 'In-person workshops', order: 1 },
          { _id: 'opt602', text: 'Online webinars', order: 2 },
          { _id: 'opt603', text: 'Self-paced online courses', order: 3 },
          { _id: 'opt604', text: 'Hybrid format', order: 4 },
        ],
      },
    ],
    startDate: '2025-04-01T00:00:00',
    endDate: '2025-04-15T23:59:59',
    isAnonymous: true,
    allowResultViewing: true,
    createdBy: 'user456',
    createdAt: '2025-03-20T15:10:00',
    updatedAt: '2025-04-16T09:00:00',
    responseCount: 42,
  },
];

// Mock poll responses
const mockResponses: PollResponse[] = [
  // Responses would be populated here for a real implementation
];

// Mock poll summary
const mockPollSummary: PollSummary = {
  total: mockPolls.length,
  active: mockPolls.filter((p) => p.status === 'active').length,
  closed: mockPolls.filter((p) => p.status === 'closed').length,
  draft: mockPolls.filter((p) => p.status === 'draft').length,
  recentPolls: mockPolls
    .filter((p) => p.status !== 'draft')
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3),
};

// Mock poll results
const mockPollResults: PollResults = {
  pollId: 'poll001',
  pollTitle: 'Pharmacy Practice Improvement Survey',
  totalResponses: 15,
  answersStatistics: [
    {
      questionId: 'q001',
      questionText:
        'What are the biggest challenges you face in your pharmacy practice?',
      questionType: 'multiple_choice',
      totalResponses: 15,
      options: [
        {
          optionId: 'opt001',
          optionText: 'Regulatory compliance',
          count: 10,
          percentage: 66.7,
        },
        {
          optionId: 'opt002',
          optionText: 'Inventory management',
          count: 8,
          percentage: 53.3,
        },
        {
          optionId: 'opt003',
          optionText: 'Staff training and retention',
          count: 11,
          percentage: 73.3,
        },
        {
          optionId: 'opt004',
          optionText: 'Competition from larger chains',
          count: 9,
          percentage: 60.0,
        },
        {
          optionId: 'opt005',
          optionText: 'Customer acquisition and retention',
          count: 7,
          percentage: 46.7,
        },
        {
          optionId: 'opt006',
          optionText: 'Financial management',
          count: 12,
          percentage: 80.0,
        },
      ],
    },
    {
      questionId: 'q002',
      questionText:
        'How satisfied are you with the current regulatory environment?',
      questionType: 'rating',
      totalResponses: 15,
      averageRating: 3.2,
    },
    {
      questionId: 'q003',
      questionText:
        'What additional support would you like from ACPN Ota Zone?',
      questionType: 'text',
      totalResponses: 10,
      textResponses: [
        'More business development workshops',
        'Group purchasing options to reduce costs',
        'Legal support for regulatory compliance',
        'More networking events for pharmacy owners',
        'Training for pharmacy staff',
      ],
    },
  ],
  responseDistribution: [
    { date: '2025-05-15', count: 3 },
    { date: '2025-05-16', count: 2 },
    { date: '2025-05-17', count: 1 },
    { date: '2025-05-18', count: 4 },
    { date: '2025-05-19', count: 2 },
    { date: '2025-05-20', count: 3 },
  ],
};

// Helper for simulating API responses with delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Polls API
export const getPolls = async (
  params?: Record<string, unknown>
): Promise<Poll[]> => {
  // For demo purposes, return mock data
  await delay(800);
  return mockPolls;

  // Real API call
  // const response = await api.get(`${BASE_URL}/polls`, { params });
  // return response.data.data;
};

export const getPollById = async (id: string): Promise<Poll> => {
  // For demo purposes, return mock data
  await delay(800);
  const poll = mockPolls.find((p) => p._id === id);
  if (!poll) throw new Error('Poll not found');
  return poll;

  // Real API call
  // const response = await api.get(`${BASE_URL}/polls/${id}`);
  // return response.data.data;
};

export const createPoll = async (data: Partial<Poll>): Promise<Poll> => {
  // For demo purposes, just return a mock result
  await delay(800);
  return {
    _id: 'new-' + Date.now(),
    ...data,
    status: 'draft',
    createdBy: 'currentUser',
    responseCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Poll;

  // Real API call
  // const response = await api.post(`${BASE_URL}/polls`, data);
  // return response.data.data;
};

export const updatePoll = async (
  id: string,
  data: Partial<Poll>
): Promise<Poll> => {
  // For demo purposes, just return a mock result
  await delay(800);
  return {
    _id: id,
    ...data,
    updatedAt: new Date().toISOString(),
  } as Poll;

  // Real API call
  // const response = await api.put(`${BASE_URL}/polls/${id}`, data);
  // return response.data.data;
};

export const deletePoll = async (id: string): Promise<void> => {
  // For demo purposes, just add a delay
  await delay(800);

  // Real API call
  // await api.delete(`${BASE_URL}/polls/${id}`);
};

export const updatePollStatus = async (
  id: string,
  status: PollStatus
): Promise<Poll> => {
  // For demo purposes, just return a mock result
  await delay(800);
  return {
    _id: id,
    status,
    updatedAt: new Date().toISOString(),
  } as Poll;

  // Real API call
  // const response = await api.put(`${BASE_URL}/polls/${id}/status`, { status });
  // return response.data.data;
};

export const getPollSummary = async (): Promise<PollSummary> => {
  // For demo purposes, return mock data
  await delay(800);
  return mockPollSummary;

  // Real API call
  // const response = await api.get(`${BASE_URL}/polls/summary`);
  // return response.data.data;
};

export const getPollResults = async (id: string): Promise<PollResults> => {
  // For demo purposes, return mock data
  await delay(800);
  // In a real implementation, this would return different results based on the poll ID
  return {
    ...mockPollResults,
    pollId: id,
  };

  // Real API call
  // const response = await api.get(`${BASE_URL}/polls/${id}/results`);
  // return response.data.data;
};

export const submitPollResponse = async (
  submission: PollSubmission
): Promise<PollResponse> => {
  // For demo purposes, just return a mock result
  await delay(1200);
  return {
    _id: 'response-' + Date.now(),
    poll: submission.pollId,
    respondent: 'currentUser',
    answers: submission.answers,
    submittedAt: new Date().toISOString(),
  } as PollResponse;

  // Real API call
  // const response = await api.post(`${BASE_URL}/polls/${submission.pollId}/responses`, submission);
  // return response.data.data;
};

export const checkUserResponded = async (pollId: string): Promise<boolean> => {
  // For demo purposes, return mock result
  await delay(500);

  // Simulate that user hasn't responded yet
  return false;

  // Real API call
  // const response = await api.get(`${BASE_URL}/polls/${pollId}/user-responded`);
  // return response.data.hasResponded;
};

// All exported functions
const pollService = {
  getPolls,
  getPollById,
  createPoll,
  updatePoll,
  deletePoll,
  updatePollStatus,
  getPollSummary,
  getPollResults,
  submitPollResponse,
  checkUserResponded,
};

export default pollService;
