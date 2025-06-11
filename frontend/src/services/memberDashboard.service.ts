import api from './api';

export interface MemberDashboardStats {
  userFinancialSummary: {
    totalDue: number;
    totalPaid: number;
    remainingBalance: number;
  };
  userAttendanceSummary: {
    attended: number;
    missed: number;
  };
  upcomingEvents: number;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    status?: string;
  }>;
}

export interface MemberPaymentsResponse {
  payments: Array<{
    _id: string;
    dueId: any;
    pharmacyId: any;
    amount: number;
    paymentMethod?: string;
    paymentReference?: string;
    receiptUrl?: string;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
    paymentDate?: string;
    status?: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get member dashboard overview stats
export const getMemberDashboardStats =
  async (): Promise<MemberDashboardStats> => {
    try {
      const response = await api.get('/member-dashboard/overview');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching member dashboard stats:', error);
      // Return default stats in case of error
      return {
        userFinancialSummary: {
          totalDue: 0,
          totalPaid: 0,
          remainingBalance: 0,
        },
        userAttendanceSummary: {
          attended: 0,
          missed: 0,
        },
        upcomingEvents: 0,
        recentActivity: [],
      };
    }
  };

// Get member payments
export const getMemberPayments = async (
  page = 1,
  limit = 10
): Promise<MemberPaymentsResponse> => {
  try {
    const response = await api.get('/member-dashboard/payments', {
      params: { page, limit },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching member payments:', error);
    // Return empty response in case of error
    return {
      payments: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }
};

const memberDashboardService = {
  getMemberDashboardStats,
  getMemberPayments,
};

export default memberDashboardService;
