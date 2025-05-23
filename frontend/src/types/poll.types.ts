import { User } from './auth.types';

export type PollStatus = 'draft' | 'active' | 'closed';
export type QuestionType =
  | 'multiple_choice'
  | 'single_choice'
  | 'text'
  | 'rating'
  | 'boolean';

export interface PollOption {
  _id: string;
  text: string;
  order: number;
}

export interface PollQuestion {
  _id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  order: number;
  options?: PollOption[];
}

export interface Poll {
  _id: string;
  title: string;
  description: string;
  status: PollStatus;
  questions: PollQuestion[];
  startDate: string;
  endDate: string;
  targetAudience?: string[];
  isAnonymous: boolean;
  allowResultViewing: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  responseCount?: number;
}

export interface PollResponse {
  _id: string;
  poll: string;
  respondent: string | User;
  answers: {
    questionId: string;
    answer: string | string[]; // Can be single value or array for multiple choice
  }[];
  submittedAt: string;
}

export interface PollSummary {
  total: number;
  active: number;
  closed: number;
  draft: number;
  recentPolls: Poll[];
}

export interface AnswerStatistics {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  totalResponses: number;
  options?: {
    optionId: string;
    optionText: string;
    count: number;
    percentage: number;
  }[];
  textResponses?: string[];
  averageRating?: number;
}

export interface PollResults {
  pollId: string;
  pollTitle: string;
  totalResponses: number;
  answersStatistics: AnswerStatistics[];
  responseDistribution?: {
    date: string;
    count: number;
  }[];
}

export interface PollSubmission {
  pollId: string;
  answers: {
    questionId: string;
    answer: string | string[];
  }[];
}
