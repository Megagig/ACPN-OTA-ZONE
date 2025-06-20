import api from './api';
import type {
  Election,
  Position,
  Candidate,
  Vote,
} from '../types/election.types';

// Mock data for development
const mockElections: Election[] = [
  {
    _id: 'election001',
    title: '2024 Executive Committee Election',
    description: 'Annual election for executive committee positions',
    startDate: '2024-03-01T00:00:00.000Z',
    endDate: '2024-03-31T23:59:59.000Z',
    status: 'upcoming',
    positions: [],
    candidates: [],
    eligibleVoters: [],
    totalVoters: 150,
    votesSubmitted: 0,
    createdBy: 'admin001',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
  },
  {
    _id: 'election002',
    title: '2024 Committee Chair Election',
    description: 'Election for various committee chair positions',
    startDate: '2024-04-01T00:00:00.000Z',
    endDate: '2024-04-30T23:59:59.000Z',
    status: 'upcoming',
    positions: [],
    candidates: [],
    eligibleVoters: [],
    totalVoters: 120,
    votesSubmitted: 0,
    createdBy: 'admin001',
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z',
  },
];

const mockPositions: Position[] = [
  {
    _id: 'pos001',
    name: 'President',
    title: 'President',
    description: 'Lead the organization and represent members',
    maxCandidates: 3,
    order: 1,
    candidates: [],
  },
  {
    _id: 'pos002',
    name: 'Vice President',
    title: 'Vice President',
    description: 'Support the president and lead in their absence',
    maxCandidates: 2,
    order: 2,
    candidates: [],
  },
  {
    _id: 'pos003',
    name: 'Secretary',
    title: 'Secretary',
    description: 'Maintain records and handle communications',
    maxCandidates: 2,
    order: 3,
    candidates: [],
  },
];

const mockCandidates: Candidate[] = [
  {
    _id: 'candidate001',
    election: 'election001',
    position: 'pos001',
    positionName: 'President',
    user: 'user001',
    fullName: 'John Doe',
    name: 'John Doe',
    manifesto: 'I will focus on member engagement and professional development',
    status: 'approved',
    votes: 45,
    voteCount: 45,
    createdAt: '2024-01-20T00:00:00.000Z',
    updatedAt: '2024-01-20T00:00:00.000Z',
  },
  {
    _id: 'candidate002',
    election: 'election001',
    position: 'pos001',
    positionName: 'President',
    user: 'user002',
    fullName: 'Jane Smith',
    name: 'Jane Smith',
    manifesto: 'My priority is to strengthen our professional network',
    status: 'approved',
    votes: 38,
    voteCount: 38,
    createdAt: '2024-01-22T00:00:00.000Z',
    updatedAt: '2024-01-22T00:00:00.000Z',
  },
];

const mockVotes: Vote[] = [
  {
    _id: 'vote001',
    election: 'election001',
    voter: 'user001',
    selections: [
      {
        position: 'pos001',
        candidate: 'candidate001',
      },
    ],
    status: 'confirmed',
    submittedAt: '2024-03-15T10:00:00.000Z',
  },
  {
    _id: 'vote002',
    election: 'election001',
    voter: 'user002',
    selections: [
      {
        position: 'pos001',
        candidate: 'candidate002',
      },
    ],
    status: 'confirmed',
    submittedAt: '2024-03-15T11:00:00.000Z',
  },
];

// API functions
export const getElections = async (): Promise<Election[]> => {
  try {
    const response = await api.get('/api/elections');
    return response.data;
  } catch (error) {
    console.error('Error fetching elections:', error);
    return mockElections;
  }
};

export const getElectionById = async (id: string): Promise<Election> => {
  try {
    const response = await api.get(`/api/elections/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching election:', error);
    const election = mockElections.find(e => e._id === id);
    if (!election) throw new Error('Election not found');
    return election;
  }
};

export const createElection = async (data: any): Promise<Election> => {
  try {
    const response = await api.post('/api/elections', data);
    return response.data;
  } catch (error) {
    console.error('Error creating election:', error);
    throw error;
  }
};

export const updateElection = async (id: string, data: any): Promise<Election> => {
  try {
    const response = await api.put(`/api/elections/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating election:', error);
    throw error;
  }
};

export const deleteElection = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/elections/${id}`);
  } catch (error) {
    console.error('Error deleting election:', error);
    throw error;
  }
};

export const getPositions = async (): Promise<Position[]> => {
  try {
    const response = await api.get('/api/elections/positions');
    return response.data;
  } catch (error) {
    console.error('Error fetching positions:', error);
    return mockPositions;
  }
};

export const createPosition = async (data: any): Promise<Position> => {
  try {
    const response = await api.post('/api/elections/positions', data);
    return response.data;
  } catch (error) {
    console.error('Error creating position:', error);
    throw error;
  }
};

export const updatePosition = async (positionId: string, data: any): Promise<Position> => {
  try {
    const response = await api.put(`/api/elections/positions/${positionId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating position:', error);
    throw error;
  }
};

export const deletePosition = async (positionId: string): Promise<void> => {
  try {
    await api.delete(`/api/elections/positions/${positionId}`);
  } catch (error) {
    console.error('Error deleting position:', error);
    throw error;
  }
};

export const getCandidates = async (): Promise<Candidate[]> => {
  try {
    const response = await api.get('/api/elections/candidates');
    return response.data;
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return mockCandidates;
  }
};

export const createCandidate = async (positionId: string, data: any): Promise<Candidate> => {
  try {
    const response = await api.post(`/api/elections/positions/${positionId}/candidates`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating candidate:', error);
    throw error;
  }
};

export const updateCandidate = async (candidateId: string, data: any): Promise<Candidate> => {
  try {
    const response = await api.put(`/api/elections/candidates/${candidateId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating candidate:', error);
    throw error;
  }
};

export const deleteCandidate = async (candidateId: string): Promise<void> => {
  try {
    await api.delete(`/api/elections/candidates/${candidateId}`);
  } catch (error) {
    console.error('Error deleting candidate:', error);
    throw error;
  }
};

export const submitVote = async (electionId: string, positionId: string, candidateId: string): Promise<void> => {
  try {
    await api.post('/api/elections/vote', {
      electionId,
      positionId,
      candidateId,
    });
  } catch (error) {
    console.error('Error submitting vote:', error);
    throw error;
  }
};

export const checkUserVoted = async (): Promise<boolean> => {
  try {
    const response = await api.get('/api/elections/check-vote');
    return response.data.hasVoted;
  } catch (error) {
    console.error('Error checking vote status:', error);
    return mockVotes.some(vote => vote.voter === 'current-user-id');
  }
};

export const getElectionStatistics = async (): Promise<any> => {
  try {
    const response = await api.get('/api/elections/statistics');
    return response.data;
  } catch (error) {
    console.error('Error fetching election statistics:', error);
    // Return mock statistics
    const positions = mockPositions;
    const candidates = mockCandidates;
    const votes = mockVotes;

    return {
      totalPositions: positions.length,
      totalCandidates: candidates.length,
      totalVotes: votes.length,
      positions: positions.map(pos => ({
        positionName: pos.name,
        candidates: candidates
          .filter(c => c.position === pos._id)
          .map(c => ({
            candidateName: c.fullName,
            voteCount: c.votes,
          })),
      })),
    };
  }
};

export const getElectionSummary = async (): Promise<any> => {
  try {
    const response = await api.get('/api/elections/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching election summary:', error);
    return {
      total: mockElections.length,
      upcoming: mockElections.filter(e => e.status === 'upcoming').length,
      ongoing: mockElections.filter(e => e.status === 'ongoing').length,
      ended: mockElections.filter(e => e.status === 'ended').length,
      draft: mockElections.filter(e => e.status === 'draft').length,
      totalVotes: mockVotes.length,
      activeElection: mockElections.find(e => e.status === 'ongoing'),
      recentElections: mockElections.slice(0, 5),
    };
  }
};

export const updateElectionStatus = async (id: string, status: string): Promise<Election> => {
  try {
    const response = await api.put(`/api/elections/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating election status:', error);
    throw error;
  }
};

export const startElection = async (id: string): Promise<Election> => {
  return updateElectionStatus(id, 'ongoing');
};

export const endElection = async (id: string): Promise<Election> => {
  return updateElectionStatus(id, 'ended');
};

export const publishElection = async (id: string): Promise<Election> => {
  return updateElectionStatus(id, 'published');
};

export const submitVotes = async (electionId: string, votes: any[]): Promise<void> => {
  try {
    await api.post('/api/elections/vote', {
      electionId,
      votes,
    });
  } catch (error) {
    console.error('Error submitting votes:', error);
    throw error;
  }
};

// Export all functions
export default {
  getElections,
  getElectionById,
  createElection,
  updateElection,
  deleteElection,
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  submitVote,
  checkUserVoted,
  getElectionStatistics,
  getElectionSummary,
  updateElectionStatus,
  startElection,
  endElection,
  publishElection,
  submitVotes,
};
