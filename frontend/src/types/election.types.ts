// Types for Election Management

export type ElectionStatus =
  | 'upcoming'
  | 'ongoing'
  | 'ended'
  | 'cancelled'
  | 'draft';

export type CandidateStatus =
  | 'pending'
  | 'approved'
  | 'disqualified'
  | 'withdrew';

export type VoteStatus = 'pending' | 'confirmed' | 'rejected';

export interface Position {
  _id: string;
  name: string;
  title?: string; // Added title as some components use this
  description: string;
  maxCandidates: number;
  candidates?: Candidate[]; // Added candidates array
  order: number; // For ordering positions in election ballots
}

export interface Candidate {
  _id: string;
  election: string; // Reference to election ID
  position: string; // Reference to position ID
  positionName: string;
  user: string; // Reference to user ID
  fullName: string;
  name?: string; // Added name as some components use this
  photoUrl?: string;
  manifesto: string;
  status: CandidateStatus;
  votes: number; // Total votes received
  voteCount?: number; // Added voteCount as some components use this
  createdAt?: string;
  updatedAt?: string;
}

export interface Election {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ElectionStatus;
  positions: Position[];
  candidates: Candidate[];
  eligibleVoters: string[]; // Array of user IDs or a voter group ID
  totalVoters: number;
  votesSubmitted: number;
  createdBy: string; // User ID who created the election
  rules?: string; // Election rules and regulations
  createdAt?: string;
  updatedAt?: string;
}

export interface Vote {
  _id: string;
  election: string; // Reference to election ID
  voter: string; // Reference to user ID
  selections: {
    position: string; // Position ID
    candidate: string; // Candidate ID
  }[];
  status: VoteStatus;
  ipAddress?: string;
  deviceInfo?: string;
  submittedAt: string;
  confirmedAt?: string;
}

export interface VoteSubmission {
  electionId: string;
  selections: {
    position: string;
    candidate: string;
  }[];
}

export interface ElectionSummary {
  total: number;
  upcoming: number;
  ongoing: number;
  ended: number;
  draft: number;
  totalVotes: number;
  activeElection?: Election;
  recentElections: Election[];
}

export interface ElectionResults {
  electionId: string;
  electionTitle: string;
  totalVoters: number;
  totalVotes: number;
  turnoutPercentage: number;
  positions: {
    positionId: string;
    positionName: string;
    candidates: {
      candidateId: string;
      candidateName: string;
      votes: number;
      percentage: number;
    }[];
  }[];
  voteHistory: {
    date: string;
    votes: number;
  }[];
}
