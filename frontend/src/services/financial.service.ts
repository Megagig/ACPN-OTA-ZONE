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

// Remove the /api prefix since it's already included in the axios baseURL
const BASE_URL = '';

// ============== FINANCIAL RECORDS API ==============

export const getFinancialRecords = async (params?: {
  limit?: number;
  page?: number;
  sort?: string;
  search?: string;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}): Promise<FinancialRecord[]> => {
  try {
    const response = await api.get('/financial-records', { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching financial records:', error);
    throw error;
  }
};

export const getFinancialRecordById = async (
  id: string
): Promise<FinancialRecord> => {
  try {
    const response = await api.get(`/financial-records/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching financial record with id ${id}:`, error);
    throw error;
  }
};

export const createFinancialRecord = async (
  data: Partial<FinancialRecord>
): Promise<FinancialRecord> => {
  try {
    const response = await api.post('/financial-records', data);
    return response.data.data;
  } catch (error) {
    console.error('Error creating financial record:', error);
    throw error;
  }
};

export const updateFinancialRecord = async (
  id: string,
  data: Partial<FinancialRecord>
): Promise<FinancialRecord> => {
  try {
    const response = await api.put(`/financial-records/${id}`, data);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating financial record with id ${id}:`, error);
    throw error;
  }
};

export const deleteFinancialRecord = async (id: string): Promise<void> => {
  try {
    await api.delete(`/financial-records/${id}`);
  } catch (error) {
    console.error(`Error deleting financial record with id ${id}:`, error);
    throw error;
  }
};

export const getFinancialSummary = async (
  period: string = 'month'
): Promise<FinancialSummary> => {
  try {
    const response = await api.get('/financial-records/summary', {
      params: { period },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    throw error;
  }
};

// ============== DUES API ==============

export const getDues = async (params?: {
  limit?: number;
  page?: number;
  sort?: string;
  year?: number;
}): Promise<Due[]> => {
  try {
    const response = await api.get('/dues', { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching dues:', error);
    throw error;
  }
};

export const getDueById = async (id: string): Promise<Due> => {
  try {
    const response = await api.get(`/dues/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching due with id ${id}:`, error);
    throw error;
  }
};

export const createDue = async (data: Partial<Due>): Promise<Due> => {
  try {
    const response = await api.post('/dues', data);
    return response.data.data;
  } catch (error) {
    console.error('Error creating due:', error);
    throw error;
  }
};

export const updateDue = async (
  id: string,
  data: Partial<Due>
): Promise<Due> => {
  try {
    const response = await api.put(`/dues/${id}`, data);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating due with id ${id}:`, error);
    throw error;
  }
};

export const deleteDue = async (id: string): Promise<void> => {
  try {
    await api.delete(`/dues/${id}`);
  } catch (error) {
    console.error(`Error deleting due with id ${id}:`, error);
    throw error;
  }
};

// ============== DUE PAYMENTS API ==============

export const getDuePayments = async (params?: {
  limit?: number;
  page?: number;
  sort?: string;
  dueId?: string;
  pharmacyId?: string;
  status?: string;
}): Promise<DuePayment[]> => {
  try {
    // Use the admin/all endpoint which is properly defined in the backend
    const response = await api.get('/payments/admin/all', { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching due payments:', error);
    throw error;
  }
};

export const getDuePaymentById = async (id: string): Promise<DuePayment> => {
  try {
    // Use a properly defined endpoint format
    const response = await api.get(`/payments/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching due payment with id ${id}:`, error);
    throw error;
  }
};

export const createDuePayment = async (
  data: Partial<DuePayment>
): Promise<DuePayment> => {
  try {
    // Use the submit endpoint which is properly defined in the backend
    const response = await api.post('/payments/submit', data);
    return response.data.data;
  } catch (error) {
    console.error('Error creating due payment:', error);
    throw error;
  }
};

export const updateDuePayment = async (
  id: string,
  data: Partial<DuePayment>
): Promise<DuePayment> => {
  try {
    // Use the review endpoint which is properly defined in the backend
    // The backend has separate endpoints for approval/rejection, so we'll use review
    const response = await api.post(`/payments/${id}/review`, data);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating due payment with id ${id}:`, error);
    throw error;
  }
};

export const deleteDuePayment = async (id: string): Promise<void> => {
  try {
    // Use the delete endpoint which is properly defined in the backend
    await api.delete(`/payments/${id}`);
  } catch (error) {
    console.error(`Error deleting due payment with id ${id}:`, error);
    throw error;
  }
};

// ============== DONATIONS API ==============

export const getDonations = async (params?: {
  limit?: number;
  page?: number;
  sort?: string;
  pharmacyId?: string;
}): Promise<Donation[]> => {
  try {
    const response = await api.get('/donations', { params });

    // Transform backend data to match frontend Donation type
    if (Array.isArray(response.data.data)) {
      return response.data.data.map(
        (donation: {
          _id: string;
          pharmacyId?: string;
          pharmacyName?: string;
          amount?: number;
          donationDate?: string;
          purpose?: string;
          acknowledgmentStatus?: string;
          createdAt?: string;
          updatedAt?: string;
        }) => {
          // Handle missing properties to match the frontend Donation type
          return {
            _id: donation._id,
            title: donation.purpose || 'Donation',
            description: donation.purpose || '',
            amount: donation.amount || 0,
            donor: {
              name: donation.pharmacyName || 'Unknown Pharmacy',
              type: 'organization',
              pharmacyId: donation.pharmacyId,
            },
            purpose: donation.purpose || '',
            date:
              donation.donationDate ||
              donation.createdAt ||
              new Date().toISOString(),
            paymentMethod: 'cash',
            status: donation.acknowledgmentStatus || 'pending',
            createdAt: donation.createdAt,
            updatedAt: donation.updatedAt,
          };
        }
      );
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching donations:', error);
    throw error;
  }
};

export const getDonationById = async (id: string): Promise<Donation> => {
  try {
    const response = await api.get(`/donations/${id}`);

    // Transform backend data to match frontend Donation type
    const donation = response.data.data;
    if (donation) {
      return {
        _id: donation._id,
        title: donation.purpose || 'Donation',
        description: donation.purpose || '',
        amount: donation.amount || 0,
        donor: {
          name: donation.pharmacyName || 'Unknown Pharmacy',
          type: 'organization',
          pharmacyId: donation.pharmacyId,
        },
        purpose: donation.purpose || '',
        date:
          donation.donationDate ||
          donation.createdAt ||
          new Date().toISOString(),
        paymentMethod: 'cash',
        status: donation.acknowledgmentStatus || 'pending',
        createdAt: donation.createdAt,
        updatedAt: donation.updatedAt,
      };
    }

    return response.data.data;
  } catch (error) {
    console.error(`Error fetching donation with id ${id}:`, error);
    throw error;
  }
};

export const createDonation = async (
  data: Partial<Donation>
): Promise<Donation> => {
  try {
    const response = await api.post('/donations', data);
    return response.data.data;
  } catch (error) {
    console.error('Error creating donation:', error);
    throw error;
  }
};

export const updateDonation = async (
  id: string,
  data: Partial<Donation>
): Promise<Donation> => {
  try {
    const response = await api.put(`/donations/${id}`, data);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating donation with id ${id}:`, error);
    throw error;
  }
};

export const deleteDonation = async (id: string): Promise<void> => {
  try {
    await api.delete(`/donations/${id}`);
  } catch (error) {
    console.error(`Error deleting donation with id ${id}:`, error);
    throw error;
  }
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
    totalPages: number;
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
    totalPages: number;
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
  try {
    // Create a new FormData object to ensure proper format
    const cleanFormData = new FormData();

    // Add text fields first
    for (const [key, value] of Array.from(data.entries())) {
      if (key !== 'receipt' && typeof value === 'string') {
        cleanFormData.append(key, value);
      }
    }

    // Add the file last - this helps prevent "Unexpected end of form" errors
    const receiptFile = data.get('receipt') as File;
    if (receiptFile instanceof File) {
      cleanFormData.append('receipt', receiptFile);
    }

    // Use a longer timeout for file uploads
    const response = await api.post(
      `${BASE_URL}/payments/submit`,
      cleanFormData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout for file uploads
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error submitting payment:', error);
    throw error;
  }
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
    totalPages: number;
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
  try {
    const response = await api.get(
      `${BASE_URL}/dues/clearance-eligibility/${pharmacyId}`
    );
    return response.data.data;
  } catch (error) {
    console.error(
      `Error checking clearance eligibility for pharmacy ${pharmacyId}:`,
      error
    );
    throw error;
  }
};

export const recordCertificateGeneration = async (
  certificateData: CertificateData
): Promise<void> => {
  try {
    await api.post(`${BASE_URL}/dues/certificates`, certificateData);
  } catch (error) {
    console.error('Error recording certificate generation:', error);
    throw error;
  }
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
    totalPages: number;
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

// Get clearance certificate for a paid due
export const getClearanceCertificate = async (dueId: string): Promise<any> => {
  try {
    const response = await api.get(`/dues/${dueId}/certificate`);
    return response.data.data;
  } catch (error) {
    console.error('Error getting clearance certificate:', error);
    throw error;
  }
};

// Generate PDF certificate from certificate data
export const generateCertificatePDF = async (
  certificateData: any
): Promise<Blob> => {
  try {
    const response = await api.post(
      '/dues/generate-certificate-pdf',
      certificateData,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error generating PDF certificate:', error);
    throw error;
  }
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

  // Clearance Certificate PDF
  getClearanceCertificate,
  generateCertificatePDF,
};

export default financialService;
