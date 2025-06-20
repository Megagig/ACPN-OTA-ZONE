export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPharmacies: number;
  activePharmacies: number;
  totalEvents: number;
  upcomingEvents: number;
  totalDues: number;
  collectedDues: number;
  outstandingDues: number;
  totalElections: number;
  activeElections: number;
  totalPolls: number;
  activePolls: number;
  totalAnnouncements: number;
  recentAnnouncements: number;
}

export interface DashboardSummary {
  recentActivities: Array<{
    type: 'event' | 'due' | 'election' | 'poll' | 'announcement';
    title: string;
    description: string;
    date: string;
    status: string;
  }>;
  upcomingEvents: Array<{
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
    type: string;
    status: string;
  }>;
  recentDues: Array<{
    _id: string;
    title: string;
    amount: number;
    dueDate: string;
    status: string;
  }>;
  activeElections: Array<{
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
  activePolls: Array<{
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
  recentAnnouncements: Array<{
    _id: string;
    title: string;
    type: string;
    priority: string;
    createdAt: string;
  }>;
} 