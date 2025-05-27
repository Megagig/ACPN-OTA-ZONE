import api from './api';
import type {
  FinancialRecord,
  FinancialSummary,
  Due,
  DuePayment,
  Donation,
  FinancialAnalytics,
  FinancialReport,
  Payment,
  DueAssignmentData,
  BulkAssignmentData,
  PenaltyData,
  ClearanceEligibility,
  CertificateData,
} from '../types/financial.types';
import type { PharmacyDue } from '../types/pharmacy.types';
import type { DueType, Pharmacy } from '../types/pharmacy.types';
import mockFinancialService from './mockData.service';

// Remove the /api prefix since it's already included in the axios baseURL
const BASE_URL = '';

// ============== ORIGINAL FINANCIAL RECORDS API ==============

export const getFinancialRecords = async (): Promise<FinancialRecord[]> => {
  return mockFinancialService.getFinancialRecords();
};

export const getFinancialRecordById = async (
  id: string
): Promise<FinancialRecord> => {
  return mockFinancialService.getFinancialRecordById(id);
};

export const createFinancialRecord = async (
  data: Partial<FinancialRecord>
): Promise<FinancialRecord> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    _id: 'new-' + Date.now(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as FinancialRecord;
};

export const updateFinancialRecord = async (
  id: string,
  data: Partial<FinancialRecord>
): Promise<FinancialRecord> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    _id: id,
    ...data,
    updatedAt: new Date().toISOString(),
  } as FinancialRecord;
};

export const deleteFinancialRecord = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  console.log('Deleting financial record:', id);
};

export const getFinancialSummary = async (): Promise<FinancialSummary> => {
  return mockFinancialService.getFinancialSummary();
};

// ============== ORIGINAL DUES API ==============

export const getDues = async (): Promise<Due[]> => {
  return mockFinancialService.getDues();
};

export const getDueById = async (id: string): Promise<Due> => {
  return mockFinancialService.getDueById(id);
};

export const createDue = async (data: Partial<Due>): Promise<Due> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    _id: 'new-' + Date.now(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Due;
};

export const updateDue = async (
  id: string,
  data: Partial<Due>
): Promise<Due> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    _id: id,
    ...data,
    updatedAt: new Date().toISOString(),
  } as Due;
};

export const deleteDue = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  console.log('Deleting due:', id);
};

// ============== ORIGINAL DUE PAYMENTS API ==============

export const getDuePayments = async (): Promise<DuePayment[]> => {
  return mockFinancialService.getDuePayments();
};

export const getDuePaymentById = async (id: string): Promise<DuePayment> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const payment = (await mockFinancialService.getDuePayments()).find(
    (p) => p._id === id
  );
  if (!payment) throw new Error('Payment not found');
  return payment;
};

export const createDuePayment = async (
  data: Partial<DuePayment>
): Promise<DuePayment> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    _id: 'new-' + Date.now(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as DuePayment;
};

export const updateDuePayment = async (
  id: string,
  data: Partial<DuePayment>
): Promise<DuePayment> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    _id: id,
    ...data,
    updatedAt: new Date().toISOString(),
  } as DuePayment;
};

export const deleteDuePayment = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  console.log('Deleting due payment:', id);
};

// ============== ORIGINAL DONATIONS API ==============

export const getDonations = async (): Promise<Donation[]> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return [];
};

export const getDonationById = async (id: string): Promise<Donation> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  console.log('Getting donation by id:', id);
  throw new Error('Donation not found');
};

export const createDonation = async (
  data: Partial<Donation>
): Promise<Donation> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    _id: 'new-' + Date.now(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Donation;
};

export const updateDonation = async (
  id: string,
  data: Partial<Donation>
): Promise<Donation> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    _id: id,
    ...data,
    updatedAt: new Date().toISOString(),
  } as Donation;
};

export const deleteDonation = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  console.log('Deleting donation:', id);
};

// ============== NEW COMPREHENSIVE DUES & PAYMENTS API ==============

// Due Types API
export const getDueTypes = async (): Promise<DueType[]> => {
  const response = await api.get(`${BASE_URL}/due-types`);
  return response.data.data;
};

export const createDueType = async (data: {
  name: string;
  description?: string;
  defaultAmount: number;
  isRecurring?: boolean;
  recurringPeriod?: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
}): Promise<DueType> => {
  const response = await api.post(`${BASE_URL}/due-types`, data);
  return response.data.data;
};

export const updateDueType = async (
  id: string,
  data: Partial<DueType>
): Promise<DueType> => {
  const response = await api.put(`${BASE_URL}/due-types/${id}`, data);
  return response.data.data;
};

export const deleteDueType = async (id: string): Promise<void> => {
  await api.delete(`${BASE_URL}/due-types/${id}`);
};

// Bulk Due Assignment API
export const bulkAssignDues = async (
  data: BulkAssignmentData
): Promise<{ message: string; assignedCount: number }> => {
  const response = await api.post(`${BASE_URL}/dues/bulk-assign`, data);
  return response.data.data;
};

export const assignDue = async (
  pharmacyId: string,
  data: DueAssignmentData
): Promise<Due> => {
  const response = await api.post(
    `${BASE_URL}/dues/assign/${pharmacyId}`,
    data
  );
  return response.data.data;
};

// Penalty Management API
export const addPenaltyToDue = async (
  dueId: string,
  data: PenaltyData
): Promise<Due> => {
  const response = await api.post(`${BASE_URL}/dues/${dueId}/penalty`, data);
  return response.data.data;
};

export const markDueAsPaid = async (dueId: string): Promise<Due> => {
  const response = await api.put(`${BASE_URL}/dues/${dueId}/mark-paid`);
  return response.data.data;
};

// Analytics API
export const getDueAnalytics = async (
  year?: number
): Promise<{
  totalDues: number;
  paidDues: number;
  unpaidDues: number;
  totalAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  monthlyData: Array<{ month: string; amount: number; count: number }>;
}> => {
  const response = await api.get(`${BASE_URL}/dues/analytics/all`, {
    params: { year },
  });
  return response.data.data;
};

export const getPharmacyDueAnalytics = async (
  pharmacyId: string
): Promise<{
  totalDues: number;
  paidDues: number;
  unpaidDues: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}> => {
  const response = await api.get(
    `${BASE_URL}/dues/analytics/pharmacy/${pharmacyId}`
  );
  return response.data.data;
};

// Filtered Views API
export const getDuesByType = async (
  typeId: string,
  page = 1,
  limit = 10
): Promise<{
  dues: Due[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  const response = await api.get(`${BASE_URL}/dues/type/${typeId}`, {
    params: { page, limit },
  });
  return response.data;
};

export const getOverdueDues = async (
  page = 1,
  limit = 10
): Promise<{
  dues: Due[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  const response = await api.get(`${BASE_URL}/dues/overdue`, {
    params: { page, limit },
  });
  return response.data;
};

export interface PaymentHistoryResponse {
  success: boolean;
  count: number;
  data: Payment[];
  dues: PharmacyDue[];
}

export const getPharmacyPaymentHistory = async (
  pharmacyId: string
): Promise<PaymentHistoryResponse> => {
  const response = await api.get(
    `${BASE_URL}/dues/pharmacy/${pharmacyId}/history`
  );
  return response.data;
};

// Payment Management API
export const submitPayment = async (data: FormData): Promise<Payment> => {
  const response = await api.post(`${BASE_URL}/payments/submit`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

export const getPaymentsByDue = async (dueId: string): Promise<Payment[]> => {
  const response = await api.get(`${BASE_URL}/payments/due/${dueId}`);
  return response.data.data;
};

export const getPendingPayments = async (): Promise<Payment[]> => {
  const response = await api.get(`${BASE_URL}/payments/admin/pending`);
  return response.data.data;
};

export const approvePayment = async (
  paymentId: string,
  data?: { notes?: string }
): Promise<Payment> => {
  const response = await api.post(
    `${BASE_URL}/payments/${paymentId}/approve`,
    data
  );
  return response.data.data;
};

export const rejectPayment = async (
  paymentId: string,
  data: {
    rejectionReason: string;
  }
): Promise<Payment> => {
  const response = await api.post(
    `${BASE_URL}/payments/${paymentId}/reject`,
    data
  );
  return response.data.data;
};

export const deletePayment = async (paymentId: string): Promise<void> => {
  await api.delete(`${BASE_URL}/payments/${paymentId}`);
};

export const getAllPayments = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  const response = await api.get(`${BASE_URL}/payments/admin/all`, { params });
  return response.data;
};

export const reviewPayment = async (
  paymentId: string,
  data: {
    status: 'approved' | 'rejected';
    rejectionReason?: string;
  }
): Promise<Payment> => {
  const response = await api.post(
    `${BASE_URL}/payments/${paymentId}/review`,
    data
  );
  return response.data.data;
};

// Clearance Certificate API
export const generateClearanceCertificate = async (
  dueId: string
): Promise<{ certificateUrl: string; certificateNumber: string }> => {
  const response = await api.get(`${BASE_URL}/dues/${dueId}/certificate`);
  return response.data.data;
};

export const checkClearanceEligibility = async (
  pharmacyId: string
): Promise<ClearanceEligibility> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const mockEligibility: ClearanceEligibility = {
    isEligible: Math.random() > 0.3,
    reason:
      Math.random() > 0.3 ? undefined : 'Outstanding dues exceed allowed limit',
    details: {
      totalDuesPaid: Math.floor(Math.random() * 500000) + 100000,
      outstandingAmount: Math.floor(Math.random() * 50000),
      lastPaymentDate: new Date(
        Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
      ).toISOString(),
      complianceStatus: Math.random() > 0.2 ? 'compliant' : 'non-compliant',
    },
  };

  if (!mockEligibility.isEligible && !mockEligibility.reason) {
    mockEligibility.reason = 'Outstanding amount exceeds threshold';
  }

  console.log('Checking clearance eligibility for pharmacy:', pharmacyId);
  return mockEligibility;
};

export const recordCertificateGeneration = async (
  certificateData: CertificateData
): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log('Recording certificate generation:', certificateData);
};

export const getAllPharmacies = async (): Promise<Pharmacy[]> => {
  try {
    const response = await api.get(`${BASE_URL}/pharmacies`, {
      params: {
        registrationStatus: 'active',
        limit: 1000, // Fetch a large number of pharmacies, assuming no more than 1000 active
      },
    });
    // The backend returns pharmacies under response.data.data.pharmacies
    return response.data.data.pharmacies;
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    // It's good practice to throw the error so the calling component can handle it
    throw error;
  }
};

// Real API calls for existing dues
export const getRealDues = async (params?: {
  pharmacyId?: string;
  page?: number;
  limit?: number;
  paymentStatus?: string;
  year?: number;
}): Promise<{
  dues: Due[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  // Add populate parameter to ensure due type information is included
  const enhancedParams = {
    ...params,
    // Request the backend to populate dueTypeId field
    populate: 'dueTypeId',
  };

  const response = await api.get(`${BASE_URL}/dues`, {
    params: enhancedParams,
  });
  return response.data;
};

export const getRealDueById = async (id: string): Promise<Due> => {
  const response = await api.get(`${BASE_URL}/dues/${id}`);
  return response.data.data;
};

export const createRealDue = async (data: Partial<Due>): Promise<Due> => {
  const response = await api.post(`${BASE_URL}/dues`, data);
  return response.data.data;
};

export const updateRealDue = async (
  id: string,
  data: Partial<Due>
): Promise<Due> => {
  const response = await api.put(`${BASE_URL}/dues/${id}`, data);
  return response.data.data;
};

export const deleteRealDue = async (id: string): Promise<void> => {
  await api.delete(`${BASE_URL}/dues/${id}`);
};

// Financial Analytics
export const getFinancialAnalytics = async (): Promise<FinancialAnalytics> => {
  return {
    totalRevenue: 5000000,
    pendingPayments: 1500000,
    completedPayments: 3500000,
    monthlyData: [
      { month: 'Jan', amount: 400000 },
      { month: 'Feb', amount: 500000 },
      { month: 'Mar', amount: 450000 },
      { month: 'Apr', amount: 600000 },
      { month: 'May', amount: 550000 },
      { month: 'Jun', amount: 700000 },
    ],
    topCategories: [
      { name: 'Annual Dues', amount: 2000000 },
      { name: 'Registration Fee', amount: 1500000 },
      { name: 'Event Fee', amount: 1000000 },
    ],
    stateWiseData: [
      { state: 'Lagos', amount: 2000000 },
      { state: 'Abuja', amount: 1500000 },
      { state: 'Kano', amount: 1000000 },
    ],
  };
};

export const getFinancialReports = async (): Promise<FinancialReport[]> => {
  return [
    {
      id: '1',
      type: 'Monthly',
      period: 'June 2024',
      totalAmount: 500000,
      generatedAt: new Date(),
    },
  ];
};

// All exported functions
const financialService = {
  // Financial Records
  getFinancialRecords,
  getFinancialRecordById,
  createFinancialRecord,
  updateFinancialRecord,
  deleteFinancialRecord,
  getFinancialSummary,

  // Dues
  getDues,
  getDueById,
  createDue,
  updateDue,
  deleteDue,

  // Due Payments
  getDuePayments,
  getDuePaymentById,
  createDuePayment,
  updateDuePayment,
  deleteDuePayment,

  // Donations
  getDonations,
  getDonationById,
  createDonation,
  updateDonation,
  deleteDonation,

  // Due Types
  getDueTypes,
  createDueType,
  updateDueType,
  deleteDueType,

  // Bulk Due Assignment
  bulkAssignDues,
  assignDue,

  // Penalty Management
  addPenaltyToDue,
  markDueAsPaid,

  // Analytics
  getDueAnalytics,
  getPharmacyDueAnalytics,

  // Filtered Views
  getDuesByType,
  getOverdueDues,
  getPharmacyPaymentHistory,

  // Payments
  submitPayment,
  getPaymentsByDue,
  getPendingPayments,
  approvePayment,
  rejectPayment,
  deletePayment,
  getAllPayments,
  reviewPayment,

  // Clearance Certificate
  generateClearanceCertificate,
  checkClearanceEligibility,
  recordCertificateGeneration,
  getAllPharmacies,

  // Real Dues API
  getRealDues,
  getRealDueById,
  createRealDue,
  updateRealDue,
  deleteRealDue,

  // Financial Analytics
  getFinancialAnalytics,
  getFinancialReports,
};

export default financialService;
