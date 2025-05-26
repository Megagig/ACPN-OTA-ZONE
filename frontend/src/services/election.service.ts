import api from './api';
import type {
  Election,
  Candidate,
  Position,
  Vote,
  ElectionSummary,
  ElectionResults,
  VoteSubmission,
  CandidateStatus,
} from '../types/election.types';

const BASE_URL = '/api';

// For demonstration, using mock data instead of actual API calls
// In production, replace these with actual API calls

// Mock elections data
const mockPositions: Position[] = [
  {
    _id: 'pos001',
    name: 'Chairman',
    description:
      'Oversees all activities of the association and represents it publicly.',
    maxCandidates: 3,
    order: 1,
  },
  {
    _id: 'pos002',
    name: 'Vice Chairman',
    description: "Assists the chairman and acts in the chairman's absence.",
    maxCandidates: 3,
    order: 2,
  },
  {
    _id: 'pos003',
    name: 'General Secretary',
    description: 'Responsible for all administrative tasks and record keeping.',
    maxCandidates: 3,
    order: 3,
  },
  {
    _id: 'pos004',
    name: 'Treasurer',
    description:
      'Manages financial records and handles all monetary transactions.',
    maxCandidates: 3,
    order: 4,
  },
  {
    _id: 'pos005',
    name: 'Public Relations Officer',
    description: 'Handles all external communications and public engagement.',
    maxCandidates: 3,
    order: 5,
  },
];

const mockCandidates: Candidate[] = [
  {
    _id: 'cand001',
    election: 'elect001',
    position: 'pos001',
    positionName: 'Chairman',
    user: 'user001',
    fullName: 'Dr. Elizabeth Adekunle',
    photoUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
    manifesto:
      'I aim to elevate our zone to new heights by focusing on increased professional development and community engagement.',
    status: 'approved',
    votes: 42,
    createdAt: '2025-04-10T10:30:00',
    updatedAt: '2025-04-12T14:20:00',
  },
  {
    _id: 'cand002',
    election: 'elect001',
    position: 'pos001',
    positionName: 'Chairman',
    user: 'user002',
    fullName: 'Pharm. Michael Adeyemi',
    photoUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
    manifesto:
      'My goal is to strengthen our advocacy efforts and improve the business environment for all members.',
    status: 'approved',
    votes: 38,
    createdAt: '2025-04-09T11:45:00',
    updatedAt: '2025-04-12T14:20:00',
  },
  {
    _id: 'cand003',
    election: 'elect001',
    position: 'pos002',
    positionName: 'Vice Chairman',
    user: 'user003',
    fullName: 'Pharm. Sarah Okonkwo',
    photoUrl: 'https://randomuser.me/api/portraits/women/3.jpg',
    manifesto:
      'I will support the chairman in driving our association forward while focusing on member welfare.',
    status: 'approved',
    votes: 45,
    createdAt: '2025-04-11T09:15:00',
    updatedAt: '2025-04-12T14:20:00',
  },
  {
    _id: 'cand004',
    election: 'elect001',
    position: 'pos002',
    positionName: 'Vice Chairman',
    user: 'user004',
    fullName: 'Dr. James Oluwole',
    photoUrl: 'https://randomuser.me/api/portraits/men/4.jpg',
    manifesto:
      'I bring years of experience and a fresh perspective to help grow our association.',
    status: 'approved',
    votes: 36,
    createdAt: '2025-04-10T13:30:00',
    updatedAt: '2025-04-12T14:20:00',
  },
  {
    _id: 'cand005',
    election: 'elect001',
    position: 'pos003',
    positionName: 'General Secretary',
    user: 'user005',
    fullName: 'Pharm. Victoria Afolabi',
    photoUrl: 'https://randomuser.me/api/portraits/women/5.jpg',
    manifesto:
      'I will ensure efficient administration and clear communication among all members.',
    status: 'approved',
    votes: 50,
    createdAt: '2025-04-08T15:20:00',
    updatedAt: '2025-04-12T14:20:00',
  },
  {
    _id: 'cand006',
    election: 'elect002',
    position: 'pos001',
    positionName: 'Chairman',
    user: 'user006',
    fullName: 'Pharm. David Okafor',
    photoUrl: 'https://randomuser.me/api/portraits/men/6.jpg',
    manifesto:
      'I will work to improve our professional standing and create more opportunities for members.',
    status: 'approved',
    votes: 0,
    createdAt: '2025-05-10T10:00:00',
    updatedAt: '2025-05-12T09:30:00',
  },
  {
    _id: 'cand007',
    election: 'elect002',
    position: 'pos002',
    positionName: 'Vice Chairman',
    user: 'user007',
    fullName: 'Pharm. Grace Nnamdi',
    photoUrl: 'https://randomuser.me/api/portraits/women/7.jpg',
    manifesto:
      'My focus will be on supporting members and strengthening our association.',
    status: 'approved',
    votes: 0,
    createdAt: '2025-05-11T11:30:00',
    updatedAt: '2025-05-12T09:30:00',
  },
];

const mockElections: Election[] = [
  {
    _id: 'elect001',
    title: 'ACPN Ota Zone 2023-2025 Executive Election',
    description:
      'Election for the executive committee members who will serve from 2023 to 2025.',
    startDate: '2023-06-15T08:00:00',
    endDate: '2023-06-16T17:00:00',
    status: 'ended',
    positions: mockPositions,
    candidates: mockCandidates.filter((c) => c.election === 'elect001'),
    eligibleVoters: [], // In a real app, this would be populated
    totalVoters: 120,
    votesSubmitted: 95,
    createdBy: 'user123',
    rules:
      'All financial members are eligible to vote. Voting will be conducted electronically.',
    createdAt: '2023-05-10T10:00:00',
    updatedAt: '2023-06-17T10:00:00',
  },
  {
    _id: 'elect002',
    title: 'ACPN Ota Zone 2025-2027 Executive Election',
    description:
      'Election for the executive committee members who will serve from 2025 to 2027.',
    startDate: '2025-06-14T08:00:00',
    endDate: '2025-06-15T17:00:00',
    status: 'upcoming',
    positions: mockPositions,
    candidates: mockCandidates.filter((c) => c.election === 'elect002'),
    eligibleVoters: [], // In a real app, this would be populated
    totalVoters: 135,
    votesSubmitted: 0,
    createdBy: 'user123',
    rules:
      'All financial members with paid dues as of May 31, 2025 are eligible to vote. Voting will be conducted electronically.',
    createdAt: '2025-05-01T09:30:00',
    updatedAt: '2025-05-20T14:15:00',
  },
  {
    _id: 'elect003',
    title: 'Special Committee Election 2025',
    description:
      'Election for special committee members to oversee the annual conference planning.',
    startDate: '2025-07-10T08:00:00',
    endDate: '2025-07-10T17:00:00',
    status: 'upcoming',
    positions: mockPositions.slice(2, 5), // Only secretary, treasurer, and PRO
    candidates: [], // No candidates yet
    eligibleVoters: [], // In a real app, this would be populated
    totalVoters: 135,
    votesSubmitted: 0,
    createdBy: 'user456',
    createdAt: '2025-05-15T11:00:00',
    updatedAt: '2025-05-15T11:00:00',
  },
  {
    _id: 'elect004',
    title: 'Draft Election 2025',
    description: 'This is a draft election for testing purposes.',
    startDate: '2025-08-01T08:00:00',
    endDate: '2025-08-02T17:00:00',
    status: 'draft',
    positions: [],
    candidates: [],
    eligibleVoters: [],
    totalVoters: 0,
    votesSubmitted: 0,
    createdBy: 'user123',
    createdAt: '2025-05-18T10:45:00',
    updatedAt: '2025-05-18T10:45:00',
  },
];

// Mock votes data
const mockVotes: Vote[] = [
  {
    _id: 'vote001',
    election: 'elect001',
    voter: 'user123',
    selections: [
      { position: 'pos001', candidate: 'cand001' },
      { position: 'pos002', candidate: 'cand003' },
      { position: 'pos003', candidate: 'cand005' },
    ],
    status: 'confirmed',
    ipAddress: '192.168.1.1',
    deviceInfo: 'Chrome on Windows',
    submittedAt: '2023-06-15T10:30:00',
    confirmedAt: '2023-06-15T10:30:05',
  },
  // Add more mock votes as needed
];

// Mock election summary
const mockElectionSummary: ElectionSummary = {
  total: mockElections.length,
  upcoming: mockElections.filter((e) => e.status === 'upcoming').length,
  ongoing: mockElections.filter((e) => e.status === 'ongoing').length,
  ended: mockElections.filter((e) => e.status === 'ended').length,
  draft: mockElections.filter((e) => e.status === 'draft').length,
  totalVotes: mockVotes.length,
  activeElection: mockElections.find((e) => e.status === 'ongoing'),
  recentElections: mockElections
    .filter((e) => e.status !== 'draft')
    .sort(
      (a, b) =>
        new Date(b.createdAt || '').getTime() -
        new Date(a.createdAt || '').getTime()
    )
    .slice(0, 3),
};

// Mock election results
const mockElectionResults: ElectionResults = {
  electionId: 'elect001',
  electionTitle: 'ACPN Ota Zone 2023-2025 Executive Election',
  totalVoters: 120,
  totalVotes: 95,
  turnoutPercentage: 79.2,
  positions: [
    {
      positionId: 'pos001',
      positionName: 'Chairman',
      candidates: [
        {
          candidateId: 'cand001',
          candidateName: 'Dr. Elizabeth Adekunle',
          votes: 42,
          percentage: 52.5,
        },
        {
          candidateId: 'cand002',
          candidateName: 'Pharm. Michael Adeyemi',
          votes: 38,
          percentage: 47.5,
        },
      ],
    },
    {
      positionId: 'pos002',
      positionName: 'Vice Chairman',
      candidates: [
        {
          candidateId: 'cand003',
          candidateName: 'Pharm. Sarah Okonkwo',
          votes: 45,
          percentage: 55.6,
        },
        {
          candidateId: 'cand004',
          candidateName: 'Dr. James Oluwole',
          votes: 36,
          percentage: 44.4,
        },
      ],
    },
    {
      positionId: 'pos003',
      positionName: 'General Secretary',
      candidates: [
        {
          candidateId: 'cand005',
          candidateName: 'Pharm. Victoria Afolabi',
          votes: 50,
          percentage: 100,
        },
      ],
    },
  ],
  voteHistory: [
    { date: '2023-06-15T09:00:00', votes: 15 },
    { date: '2023-06-15T12:00:00', votes: 35 },
    { date: '2023-06-15T15:00:00', votes: 25 },
    { date: '2023-06-16T09:00:00', votes: 10 },
    { date: '2023-06-16T12:00:00', votes: 5 },
    { date: '2023-06-16T15:00:00', votes: 5 },
  ],
};

// Helper for simulating API responses with delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Elections API
export const getElections = async (
  params?: Record<string, unknown>
): Promise<Election[]> => {
  // For demo purposes, return mock data
  await delay(800);
  return mockElections;

  // Real API call
  // const response = await api.get(`${BASE_URL}/elections`, { params });
  // return response.data.data;
};

export const getElectionById = async (id: string): Promise<Election> => {
  // For demo purposes, return mock data
  await delay(800);
  const election = mockElections.find((e) => e._id === id);
  if (!election) throw new Error('Election not found');
  return election;

  // Real API call
  // const response = await api.get(`${BASE_URL}/elections/${id}`);
  // return response.data.data;
};

export const createElection = async (
  data: Partial<Election>
): Promise<Election> => {
  // For demo purposes, just return a mock result
  await delay(800);
  return {
    _id: 'new-' + Date.now(),
    ...data,
    positions: [],
    candidates: [],
    eligibleVoters: [],
    totalVoters: 0,
    votesSubmitted: 0,
    createdBy: 'currentUser',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Election;

  // Real API call
  // const response = await api.post(`${BASE_URL}/elections`, data);
  // return response.data.data;
};

export const updateElection = async (
  id: string,
  data: Partial<Election>
): Promise<Election> => {
  // For demo purposes, just return a mock result
  await delay(800);
  return {
    _id: id,
    ...data,
    updatedAt: new Date().toISOString(),
  } as Election;

  // Real API call
  // const response = await api.put(`${BASE_URL}/elections/${id}`, data);
  // return response.data.data;
};

export const deleteElection = async (id: string): Promise<void> => {
  // For demo purposes, just add a delay
  await delay(800);

  // Real API call
  // await api.delete(`${BASE_URL}/elections/${id}`);
};

export const publishElection = async (id: string): Promise<Election> => {
  // For demo purposes, just return a mock result
  await delay(800);

  return {
    _id: id,
    status: 'upcoming',
    updatedAt: new Date().toISOString(),
  } as Election;

  // Real API call
  // const response = await api.post(`${BASE_URL}/elections/${id}/publish`);
  // return response.data.data;
};

export const startElection = async (id: string): Promise<Election> => {
  // For demo purposes, just return a mock result
  await delay(800);

  return {
    _id: id,
    status: 'ongoing',
    updatedAt: new Date().toISOString(),
  } as Election;

  // Real API call
  // const response = await api.post(`${BASE_URL}/elections/${id}/start`);
  // return response.data.data;
};

export const endElection = async (id: string): Promise<Election> => {
  // For demo purposes, just return a mock result
  await delay(800);

  return {
    _id: id,
    status: 'ended',
    updatedAt: new Date().toISOString(),
  } as Election;

  // Real API call
  // const response = await api.post(`${BASE_URL}/elections/${id}/end`);
  // return response.data.data;
};

export const getElectionSummary = async (): Promise<ElectionSummary> => {
  // For demo purposes, return mock data
  await delay(800);
  return mockElectionSummary;

  // Real API call
  // const response = await api.get(`${BASE_URL}/elections/summary`);
  // return response.data.data;
};

export const getElectionResults = async (
  id: string
): Promise<ElectionResults> => {
  // For demo purposes, return mock data
  await delay(800);
  return mockElectionResults;

  // Real API call
  // const response = await api.get(`${BASE_URL}/elections/${id}/results`);
  // return response.data.data;
};

export const submitVote = async (data: VoteSubmission): Promise<Vote> => {
  // For demo purposes, just return a mock result
  await delay(1500); // Longer delay to simulate vote processing

  return {
    _id: 'vote-new-' + Date.now(),
    election: data.electionId,
    voter: 'currentUser',
    selections: data.selections,
    status: 'confirmed',
    ipAddress: '192.168.1.1',
    deviceInfo: 'Chrome on Windows',
    submittedAt: new Date().toISOString(),
    confirmedAt: new Date().toISOString(),
  } as Vote;

  // Real API call
  // const response = await api.post(`${BASE_URL}/elections/${data.electionId}/vote`, data);
  // return response.data.data;
};

// Positions API
export const getPositions = async (): Promise<Position[]> => {
  // For demo purposes, return mock data
  await delay(800);
  return mockPositions;

  // Real API call
  // const response = await api.get(`${BASE_URL}/positions`);
  // return response.data.data;
};

// Candidates API
export const getCandidates = async (
  electionId: string
): Promise<Candidate[]> => {
  // For demo purposes, return mock data
  await delay(800);
  return mockCandidates.filter((c) => c.election === electionId);

  // Real API call
  // const response = await api.get(`${BASE_URL}/elections/${electionId}/candidates`);
  // return response.data.data;
};

export const createCandidate = async (
  electionId: string,
  data: Partial<Candidate>
): Promise<Candidate> => {
  // For demo purposes, just return a mock result
  await delay(800);

  const position = mockPositions.find((p) => p._id === data.position);

  return {
    _id: 'cand-new-' + Date.now(),
    election: electionId,
    position: data.position || '',
    positionName: position?.name || 'Unknown Position',
    user: data.user || 'currentUser',
    fullName: data.fullName || 'Current User',
    photoUrl: data.photoUrl,
    manifesto: data.manifesto || '',
    status: 'pending',
    votes: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Candidate;

  // Real API call
  // const response = await api.post(`${BASE_URL}/elections/${electionId}/candidates`, data);
  // return response.data.data;
};

export const updateCandidate = async (
  id: string,
  data: Partial<Candidate>
): Promise<Candidate> => {
  // For demo purposes, just return a mock result
  await delay(800);

  return {
    _id: id,
    ...data,
    updatedAt: new Date().toISOString(),
  } as Candidate;

  // Real API call
  // const response = await api.put(`${BASE_URL}/candidates/${id}`, data);
  // return response.data.data;
};

export const changeApplicationStatus = async (
  id: string,
  status: string
): Promise<Candidate> => {
  // For demo purposes, just return a mock result
  await delay(800);

  return {
    _id: id,
    status: status as any,
    updatedAt: new Date().toISOString(),
  } as Candidate;

  // Real API call
  // const response = await api.put(`${BASE_URL}/candidates/${id}/status`, { status });
  // return response.data.data;
};

export const getUserVoteStatus = async (
  electionId: string
): Promise<{ hasVoted: boolean; vote?: Vote }> => {
  // For demo purposes, return mock data
  await delay(800);

  const vote = mockVotes.find(
    (v) => v.election === electionId && v.voter === 'currentUser'
  );

  return {
    hasVoted: !!vote,
    vote,
  };

  // Real API call
  // const response = await api.get(`${BASE_URL}/elections/${electionId}/vote-status`);
  // return response.data.data;
};

export const updateElectionStatus = async (
  id: string,
  status: string
): Promise<Election> => {
  // For demo purposes, just return a mock result
  await delay(800);

  return {
    _id: id,
    status: status as any,
    updatedAt: new Date().toISOString(),
  } as Election;

  // Real API call
  // const response = await api.put(`${BASE_URL}/elections/${id}/status`, { status });
  // return response.data.data;
};

export const addCandidate = async (
  electionId: string,
  positionId: string,
  candidateData: any
): Promise<Candidate> => {
  // For demo purposes, just return a mock result
  await delay(800);

  const position = mockPositions.find((p) => p._id === positionId);

  return {
    _id: 'cand-new-' + Date.now(),
    election: electionId,
    position: positionId,
    positionName: position?.name || 'Unknown Position',
    user: candidateData.userId || 'user-temp-' + Date.now(),
    fullName: candidateData.name,
    photoUrl: candidateData.photoUrl,
    manifesto: candidateData.manifesto,
    status: 'pending' as CandidateStatus,
    votes: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Real API call
  // const response = await api.post(`${BASE_URL}/elections/${electionId}/positions/${positionId}/candidates`, candidateData);
  // return response.data.data;
};

export const updateCandidateInPosition = async (
  electionId: string,
  positionId: string,
  candidateId: string,
  candidateData: any
): Promise<Candidate> => {
  // For demo purposes, just return a mock result
  await delay(800);

  return {
    _id: candidateId,
    ...candidateData,
    updatedAt: new Date().toISOString(),
  } as Candidate;

  // Real API call
  // const response = await api.put(`${BASE_URL}/elections/${electionId}/positions/${positionId}/candidates/${candidateId}`, candidateData);
  // return response.data.data;
};

export const removeCandidate = async (
  electionId: string,
  positionId: string,
  candidateId: string
): Promise<void> => {
  // For demo purposes, just add a delay
  await delay(800);

  // Real API call
  // await api.delete(`${BASE_URL}/elections/${electionId}/positions/${positionId}/candidates/${candidateId}`);
};

export const submitVotes = async (
  electionId: string,
  votes: Array<{ positionId: string; candidateId: string }>
): Promise<{ success: boolean }> => {
  // For demo purposes, just return a mock result
  await delay(1200);

  return { success: true };

  // Real API call
  // const response = await api.post(`${BASE_URL}/elections/${electionId}/votes`, { votes });
  // return response.data;
};

export const checkUserVoted = async (electionId: string): Promise<boolean> => {
  // For demo purposes, return mock result
  await delay(500);

  // Simulate that user hasn't voted yet
  return false;

  // Real API call
  // const response = await api.get(`${BASE_URL}/elections/${electionId}/user-voted`);
  // return response.data.hasVoted;
};

export const getElectionStatistics = async (
  electionId: string
): Promise<any> => {
  // For demo purposes, return mock data
  await delay(800);

  return {
    totalEligibleVoters: 150,
    totalVotesCast: 95,
    votingPercentage: 63.3,
    votersByAge: {
      '18-30': 25,
      '31-40': 35,
      '41-50': 20,
      '51-60': 10,
      '60+': 5,
    },
    votersByGender: {
      male: 45,
      female: 48,
      other: 2,
    },
  };

  // Real API call
  // const response = await api.get(`${BASE_URL}/elections/${electionId}/statistics`);
  // return response.data;
};

// All exported functions
const electionService = {
  getElections,
  getElectionById,
  createElection,
  updateElection,
  deleteElection,
  publishElection,
  startElection,
  endElection,
  updateElectionStatus,
  getElectionSummary,
  getElectionResults,
  submitVote,
  getPositions,
  getCandidates,
  createCandidate,
  addCandidate,
  updateCandidate,
  updateCandidateInPosition,
  removeCandidate,
  changeApplicationStatus,
  getUserVoteStatus,
  submitVotes,
  checkUserVoted,
  getElectionStatistics,
};

export default electionService;
