// Types for financial records
export interface FinancialRecord {
  _id: string;
  title: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: FinancialCategory;
  date: string;
  paymentMethod: PaymentMethod;
  attachments?: string[];
  createdBy: string;
  pharmacy?: string;
  user?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export type FinancialCategory =
  | 'dues'
  | 'donation'
  | 'event'
  | 'administrative'
  | 'utility'
  | 'rent'
  | 'salary'
  | 'miscellaneous'
  | 'refund'
  | 'investment'
  | 'other';

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'check'
  | 'card'
  | 'mobile_money'
  | 'online_payment'
  | 'other';

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeByCategory: Record<string, number>;
  expenseByCategory: Record<string, number>;
  monthlyData: {
    labels: string[];
    income: number[];
    expense: number[];
  };
}

// Types for dues
export interface Due {
  _id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  lateAmount?: number;
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'annually';
  status: 'active' | 'inactive';
  members?: string[]; // list of member IDs the due applies to
  createdAt?: string;
  updatedAt?: string;
}

export interface DuePayment {
  _id: string;
  due?: string | Due;
  dueId?:
    | string
    | Due
    | {
        _id: string;
        title: string;
        amount?: number;
        [key: string]: any;
      };
  user?:
    | string
    | {
        _id: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        [key: string]: any;
      };
  submittedBy?:
    | string
    | {
        _id: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        [key: string]: any;
      };
  pharmacy?: string;
  pharmacyId?:
    | string
    | {
        _id: string;
        name?: string;
        registrationNumber?: string;
        [key: string]: any;
      };
  amount: number;
  paymentDate?: string;
  submittedAt?: string;
  paymentMethod: PaymentMethod | { [key: string]: any };
  status?: 'pending' | 'approved' | 'rejected';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  receipt?: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
  paymentReference?: string;
  [key: string]: any; // Allow for additional properties
}

// Types for donations
export interface Donation {
  _id: string;
  title: string;
  description: string;
  amount: number;
  donor: {
    name: string;
    email?: string;
    phone?: string;
    type: 'member' | 'organization' | 'individual' | 'anonymous';
    userId?: string; // If donor is a registered user
    pharmacyId?: string; // If donor is a pharmacy
  };
  purpose?: string;
  date: string;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'approved' | 'rejected';
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Additional interfaces for the comprehensive dues and payments system
export interface FinancialAnalytics {
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  monthlyData: Array<{
    month: string;
    amount: number;
  }>;
  topCategories: Array<{
    name: string;
    amount: number;
  }>;
  stateWiseData: Array<{
    state: string;
    amount: number;
  }>;
}

export interface FinancialReport {
  id: string;
  type: string;
  period: string;
  totalAmount: number;
  generatedAt: Date;
}

export interface Payment {
  _id: string;
  dueId: string | object;
  pharmacyId: string;
  amount: number;
  paymentDate: string;
  status: 'pending' | 'approved' | 'rejected';
  // Backend may use approvalStatus instead of status
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  receiptUrl?: string;
  paymentMethod?: string;
  paymentReference?: string;
  submittedBy: string;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  dueInfo?: {
    _id: string;
    title: string;
    description?: string;
    amount: number;
    dueDate: string;
    paymentStatus: string;
    totalAmount: number;
    balance: number;
    dueTypeId?: {
      _id: string;
      name: string;
      description?: string;
      defaultAmount: number;
      isRecurring?: boolean;
    };
  };
}

export interface DueAssignmentData {
  dueTypeId: string;
  amount: number;
  dueDate: string;
  description?: string;
  title?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'annually';
}

export interface BulkAssignmentData {
  dueTypeId: string;
  amount: number;
  dueDate: string;
  description?: string;
  pharmacyIds: string[];
}

export interface PenaltyData {
  amount: number;
  reason: string;
}

export interface ClearanceEligibility {
  isEligible: boolean;
  reason?: string;
  details: {
    totalDuesPaid: number;
    outstandingAmount: number;
    lastPaymentDate: string;
    complianceStatus: 'compliant' | 'non-compliant';
  };
}

export interface CertificateData {
  pharmacyId?: string;
  pharmacyName: string;
  dueType: string;
  amount: number;
  paidDate: string;
  validUntil: string;
  certificateNumber: string;
  issueDate?: string;
  issuedBy?: string;
}
