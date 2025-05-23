import {
  FinancialRecord,
  FinancialSummary,
  Due,
  DuePayment,
  Donation,
} from '../types/financial.types';

// Mock financial data for demonstration purposes
// In a real app, this would be replaced by API calls

// Mock Financial Records
const mockFinancialRecords: FinancialRecord[] = [
  {
    _id: 'fr001',
    title: 'Annual Membership Dues Collection',
    description: 'Collection of annual membership dues for 2025',
    amount: 25000,
    type: 'income',
    category: 'dues',
    date: '2025-05-15',
    paymentMethod: 'bank_transfer',
    status: 'approved',
    createdBy: 'Treasurer',
    createdAt: '2025-05-15T10:30:00',
    updatedAt: '2025-05-15T10:30:00',
  },
  {
    _id: 'fr002',
    title: 'Office Rent Payment',
    description: 'Monthly office space rent payment',
    amount: 150000,
    type: 'expense',
    category: 'rent',
    date: '2025-05-10',
    paymentMethod: 'bank_transfer',
    status: 'approved',
    createdBy: 'Treasurer',
    createdAt: '2025-05-10T11:15:00',
    updatedAt: '2025-05-10T11:15:00',
  },
  {
    _id: 'fr003',
    title: 'Donation from Pharma Inc.',
    description: 'Corporate donation for community outreach program',
    amount: 500000,
    type: 'income',
    category: 'donation',
    date: '2025-05-05',
    paymentMethod: 'bank_transfer',
    status: 'approved',
    createdBy: 'Treasurer',
    createdAt: '2025-05-05T14:20:00',
    updatedAt: '2025-05-05T14:20:00',
  },
  {
    _id: 'fr004',
    title: 'Conference Hall Booking',
    description: 'Deposit for upcoming quarterly meeting',
    amount: 75000,
    type: 'expense',
    category: 'event',
    date: '2025-05-18',
    paymentMethod: 'card',
    status: 'pending',
    createdBy: 'Secretary',
    createdAt: '2025-05-18T09:45:00',
    updatedAt: '2025-05-18T09:45:00',
  },
  {
    _id: 'fr005',
    title: 'Stationery and Office Supplies',
    description: 'Purchase of office supplies and stationery items',
    amount: 35000,
    type: 'expense',
    category: 'administrative',
    date: '2025-05-20',
    paymentMethod: 'cash',
    status: 'approved',
    createdBy: 'Admin Assistant',
    createdAt: '2025-05-20T13:10:00',
    updatedAt: '2025-05-20T13:10:00',
  },
];

// Mock Financial Summary
const mockFinancialSummary: FinancialSummary = {
  totalIncome: 1250000,
  totalExpense: 750000,
  balance: 500000,
  incomeByCategory: {
    dues: 350000,
    donation: 650000,
    event: 150000,
    miscellaneous: 100000,
  },
  expenseByCategory: {
    administrative: 120000,
    utility: 80000,
    rent: 150000,
    event: 250000,
    salary: 150000,
  },
  monthlyData: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    income: [150000, 180000, 220000, 250000, 300000, 150000],
    expense: [100000, 120000, 140000, 130000, 150000, 110000],
  },
};

// Mock Dues
const mockDues: Due[] = [
  {
    _id: 'due001',
    title: 'Annual Membership Fee',
    description: 'Mandatory annual membership fee for all members',
    amount: 25000,
    dueDate: '2025-06-30',
    lateAmount: 30000,
    frequency: 'annually',
    status: 'active',
    createdAt: '2025-01-01T00:00:00',
    updatedAt: '2025-01-01T00:00:00',
  },
  {
    _id: 'due002',
    title: 'Quarterly Development Levy',
    description: 'Quarterly levy for zone development projects',
    amount: 10000,
    dueDate: '2025-06-15',
    frequency: 'quarterly',
    status: 'active',
    createdAt: '2025-01-01T00:00:00',
    updatedAt: '2025-01-01T00:00:00',
  },
  {
    _id: 'due003',
    title: 'Emergency Response Fund',
    description: 'One-time contribution for emergency response initiatives',
    amount: 5000,
    dueDate: '2025-07-15',
    frequency: 'one-time',
    status: 'active',
    createdAt: '2025-05-01T00:00:00',
    updatedAt: '2025-05-01T00:00:00',
  },
];

// Mock Due Payments
const mockDuePayments: DuePayment[] = [
  {
    _id: 'dp001',
    due: {
      _id: 'due001',
      title: 'Annual Membership Fee',
      description: 'Mandatory annual membership fee for all members',
      amount: 25000,
      dueDate: '2025-06-30',
      lateAmount: 30000,
      frequency: 'annually',
      status: 'active',
    },
    user: 'John Doe',
    pharmacy: 'Pharmacy A',
    amount: 25000,
    paymentDate: '2025-05-15',
    paymentMethod: 'bank_transfer',
    status: 'approved',
    createdAt: '2025-05-15T10:30:00',
    updatedAt: '2025-05-15T10:30:00',
  },
  {
    _id: 'dp002',
    due: {
      _id: 'due002',
      title: 'Quarterly Development Levy',
      description: 'Quarterly levy for zone development projects',
      amount: 10000,
      dueDate: '2025-06-15',
      frequency: 'quarterly',
      status: 'active',
    },
    user: 'Jane Smith',
    pharmacy: 'Pharmacy B',
    amount: 10000,
    paymentDate: '2025-05-10',
    paymentMethod: 'cash',
    status: 'pending',
    createdAt: '2025-05-10T11:15:00',
    updatedAt: '2025-05-10T11:15:00',
  },
];

// Mock API Response Delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API Service
export const mockFinancialService = {
  // Helper for simulating API responses with delay
  mockResponse: async <T>(data: T, errorRate = 0.1): Promise<T> => {
    await delay(800); // Simulate network delay

    // Randomly fail to simulate errors (for testing error handling)
    if (Math.random() < errorRate) {
      throw new Error('Simulated API error');
    }

    return data;
  },

  // Override real API service methods for demo purposes
  // These methods can be imported and used to replace the actual API calls

  // Financial Records
  getFinancialRecords: async () => {
    return mockFinancialService.mockResponse(mockFinancialRecords);
  },

  getFinancialRecordById: async (id: string) => {
    const record = mockFinancialRecords.find((r) => r._id === id);
    if (!record) {
      throw new Error('Record not found');
    }
    return mockFinancialService.mockResponse(record);
  },

  getFinancialSummary: async () => {
    return mockFinancialService.mockResponse(mockFinancialSummary);
  },

  // Dues
  getDues: async () => {
    return mockFinancialService.mockResponse(mockDues);
  },

  getDueById: async (id: string) => {
    const due = mockDues.find((d) => d._id === id);
    if (!due) {
      throw new Error('Due not found');
    }
    return mockFinancialService.mockResponse(due);
  },

  // Due Payments
  getDuePayments: async () => {
    return mockFinancialService.mockResponse(mockDuePayments);
  },
};

export default mockFinancialService;
