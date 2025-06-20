import api from './api';
import type {
  FinancialRecord,
  FinancialSummary,
  Due,
  DuePayment,
  Donation,
  FinancialAnalytics,
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
    const response = await api.get('/api/financial-records', { params });
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
    const response = await api.post('/api/financial-records', data);
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
    const response = await api.get('/api/financial-records/summary', {
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
    return response.data.data || response.data || [];
  } catch (error) {
    console.error('Error fetching dues:', error);
    return [];
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
    const response = await api.post('/api/dues', data);
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
    const response = await api.get('/api/donations', { params });

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
    const response = await api.post('/api/donations', data);
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

// Dues Analytics API
export const getDueAnalytics = async (
  year?: number
): Promise<any> => {
  try {
    const response = await api.get(`/dues/analytics/all`, {
      params: { year },
    });
    return response.data.data || response.data || { outstandingAmount: 0 };
  } catch (error) {
    console.error('Error fetching due analytics:', error);
    return { outstandingAmount: 0 };
  }
};

export const getPharmacyDueAnalytics = async (
  pharmacyId: string
): Promise<any> => {
  const response = await api.get(
    `/dues/analytics/pharmacy/${pharmacyId}`
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

// Payments Admin Endpoints
export const getPendingPayments = async (): Promise<any> => {
  const response = await api.get(`/payments/admin/pending`);
  return response.data.data;
};

export const getAllPayments = async (params?: { 
  status?: string; 
  page?: number; 
  limit?: number; 
}): Promise<any> => {
  try {
    if (params?.status === 'pending') {
      const response = await api.get(`/payments/admin/pending`);
      return response.data;
    }
    const response = await api.get('/payments/admin/all', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching payments:', error);
    // Return empty structure instead of throwing
    return { payments: [] };
  }
};

// Payment Management API
export const submitPayment = async (data: FormData): Promise<Payment> => {
  try {
    // Debug log the FormData contents
    console.log('Submitting payment with FormData:');
    for (const pair of data.entries()) {
      if (pair[0] === 'receipt') {
        const file = pair[1] as File;
        console.log('FormData entry - receipt:', {
          name: file.name,
          type: file.type,
          size: file.size,
        });
      } else {
        console.log('FormData entry:', pair[0], pair[1]);
      }
    }

    // Create a new FormData instance to ensure it's properly formatted
    const cleanFormData = new FormData();

    // Copy all entries from the original FormData to ensure proper formatting
    for (const [key, value] of data.entries()) {
      // Special handling for receipt file
      if (key === 'receipt' && value instanceof File) {
        // Ensure the file is properly attached
        cleanFormData.append('receipt', value, value.name);
        console.log(
          `Adding file to clean FormData: ${value.name} (${value.size} bytes)`
        );
      } else {
        cleanFormData.append(key, value as string);
        console.log(`Adding field to clean FormData: ${key}=${value}`);
      }
    }

    // Make a direct XMLHttpRequest for better control over the FormData submission
    const result = await new Promise<{ data: Payment }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      // Use the correct API endpoint with /api prefix
      xhr.open('POST', `/api/payments/submit`, true);

      // Set the auth token
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      // Do NOT set Content-Type header manually for FormData as it needs to include boundary
      // The browser will automatically set the correct Content-Type with boundary parameter

      // Add progress tracking
      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          console.log(`Upload progress: ${percentComplete}%`);
        }
      };

      xhr.timeout = 120000; // 2 minutes timeout to match vite proxy config

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log(
              'Upload completed successfully with response:',
              response
            );
            resolve({ data: response.data || response });
          } catch (e) {
            console.error('Error parsing response:', e, xhr.responseText);
            reject(new Error(`Invalid response format: ${xhr.responseText}`));
          }
        } else {
          console.error(
            'Upload failed with status:',
            xhr.status,
            xhr.statusText,
            xhr.responseText
          );

          let errorMessage = `Upload failed: ${xhr.status} ${xhr.statusText}`;

          try {
            // Try to parse the error response
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.error) {
              errorMessage = errorResponse.error;
            }
          } catch (e) {
            // If parsing fails, use the raw response
            if (xhr.responseText) {
              errorMessage += ` - ${xhr.responseText}`;
            }
          }

          reject(new Error(errorMessage));
        }
      };

      xhr.onerror = function (e) {
        console.error('Network error during upload:', e);
        reject(
          new Error(
            'Network error during upload. Please check your connection and try again.'
          )
        );
      };

      xhr.ontimeout = function () {
        console.error('Upload request timed out after 2 minutes');
        reject(
          new Error(
            'Upload timed out. Please try with a smaller file or check your connection.'
          )
        );
      };

      console.log('Sending FormData request now...');
      xhr.send(cleanFormData);
    });

    // Return the payment data from the response
    return result.data;
  } catch (error) {
    console.error('Error submitting payment:', error);
    throw error;
  }
};

export const getPaymentsByDue = async (dueId: string): Promise<Payment[]> => {
  const response = await api.get(`${BASE_URL}/payments/due/${dueId}`);
  return response.data.data;
};

export const getPaymentById = async (paymentId: string): Promise<Payment> => {
  const response = await api.get(`${BASE_URL}/payments/${paymentId}`);
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

export const getAllPharmacies = async (limit = 100): Promise<Pharmacy[]> => {
  try {
    // Try to get from cache first
    const { getPharmaciesFromCache, cachePharmacies } = await import(
      '../utils/dataCache'
    );
    const cachedPharmacies = getPharmaciesFromCache();

    if (cachedPharmacies && cachedPharmacies.length > 0) {
      console.log(`Retrieved ${cachedPharmacies.length} pharmacies from cache`);
      return cachedPharmacies;
    }

    // If not in cache, fetch from API with progressive loading
    console.log('Fetching pharmacies from API in batches...');

    // Fetch first page to get total count
    const firstPageResponse = await api.get(`${BASE_URL}/pharmacies`, {
      params: {
        registrationStatus: 'active',
        limit: limit,
        page: 1,
      },
      timeout: 10000, // Reduced timeout for faster feedback
    });

    const firstPageData = firstPageResponse.data.data;
    let pharmacies = firstPageData.pharmacies || [];
    const totalPharmacies = firstPageData.total || 0;
    const totalPages = Math.ceil(totalPharmacies / limit);

    console.log(
      `Found ${totalPharmacies} total pharmacies, will fetch in ${totalPages} pages with limit ${limit}`
    );

    // Only try to load more pages if we have a reasonable number
    // This prevents timeouts with too many requests
    const MAX_PAGES_TO_LOAD = 3; // Limit to prevent excessive requests
    const pagesToLoad = Math.min(totalPages, MAX_PAGES_TO_LOAD);

    if (pagesToLoad > 1) {
      // Load pages 2 to pagesToLoad in parallel with individual error handling
      const pagePromises = [];

      for (let page = 2; page <= pagesToLoad; page++) {
        const pagePromise = api
          .get(`${BASE_URL}/pharmacies`, {
            params: {
              registrationStatus: 'active',
              limit: limit,
              page: page,
            },
            timeout: 8000, // Even shorter timeout for subsequent pages
          })
          .then((response) => response.data.data.pharmacies || [])
          .catch((error) => {
            console.warn(`Failed to load page ${page} of pharmacies:`, error);
            return []; // Return empty array for failed pages
          });

        pagePromises.push(pagePromise);
      }

      // Wait for all pages (or timeouts)
      const additionalPharmaciesArrays = await Promise.all(pagePromises);

      // Combine all pharmacy arrays
      for (const pagePharmacies of additionalPharmaciesArrays) {
        pharmacies = [...pharmacies, ...pagePharmacies];
      }
    }

    console.log(
      `Successfully loaded ${pharmacies.length} pharmacies out of ${totalPharmacies} total`
    );

    // Save to cache for future use
    if (pharmacies.length > 0) {
      cachePharmacies(pharmacies);
    }

    return pharmacies;
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    // Return an empty array instead of throwing to prevent UI crashes
    return [];
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

export const getFinancialReports = async (params: {
  reportType?: 'yearly' | 'monthly' | 'custom';
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
}): Promise<any> => {
  const queryParams = new URLSearchParams();
  
  if (params.reportType) {
    queryParams.append('reportType', params.reportType);
  }
  if (params.year) {
    queryParams.append('year', params.year.toString());
  }
  if (params.month) {
    queryParams.append('month', params.month.toString());
  }
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }

  const response = await api.get(`/financial-records/reports?${queryParams.toString()}`);
  return response.data.data;
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

export const recordPayment = async (formData: FormData): Promise<any> => {
  const response = await api.post('/api/payments/record', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
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
  getPaymentById,
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

  // Certificate History
  getCertificateHistory: async (
    pharmacyId?: string
  ): Promise<CertificateData[]> => {
    try {
      let url = `${BASE_URL}/dues/certificates`;
      if (pharmacyId) {
        url = `${BASE_URL}/dues/pharmacy/${pharmacyId}/certificates`;
      }
      const response = await api.get(url);
      return response.data.certificates;
    } catch (error) {
      console.error('Error fetching certificate history:', error);
      throw error;
    }
  },

  downloadCertificateByNumber: async (
    certificateNumber: string
  ): Promise<Blob> => {
    try {
      const response = await api.get(
        `${BASE_URL}/dues/certificates/${certificateNumber}/download`,
        { responseType: 'blob' }
      );
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificateNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return blob;
    } catch (error) {
      console.error('Error downloading certificate:', error);
      throw error;
    }
  },

  viewCertificateByNumber: async (
    certificateNumber: string
  ): Promise<string> => {
    try {
      const response = await api.get(
        `${BASE_URL}/dues/certificates/${certificateNumber}/view`
      );
      
      // Open certificate URL in new tab
      const certificateUrl = response.data.certificateUrl;
      window.open(certificateUrl, '_blank');
      
      return certificateUrl;
    } catch (error) {
      console.error('Error viewing certificate:', error);
      throw error;
    }
  },

  // Record Payment
  recordPayment,

  downloadReport: async (reportId: string): Promise<Blob> => {
    const response = await api.get(`${BASE_URL}/financial-records/reports/${reportId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default financialService;
