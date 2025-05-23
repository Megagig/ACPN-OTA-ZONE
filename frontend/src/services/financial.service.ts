import api from './api';
import type {
  FinancialRecord,
  FinancialSummary,
  Due,
  DuePayment,
  Donation,
} from '../types/financial.types';
import mockFinancialService from './mockData.service';

const BASE_URL = '/api';

// For demonstration, using mock data instead of actual API calls
// In production, replace these with actual API calls

// Financial Records API
export const getFinancialRecords = async (
  params?: Record<string, unknown>
): Promise<FinancialRecord[]> => {
  // Comment this in production and uncomment the real API call
  return mockFinancialService.getFinancialRecords();

  // Real API call
  // const response = await api.get(`${BASE_URL}/financial-records`, { params });
  // return response.data.data;
};

export const getFinancialRecordById = async (
  id: string
): Promise<FinancialRecord> => {
  // Comment this in production and uncomment the real API call
  return mockFinancialService.getFinancialRecordById(id);

  // Real API call
  // const response = await api.get(`${BASE_URL}/financial-records/${id}`);
  // return response.data.data;
};

export const createFinancialRecord = async (
  data: Partial<FinancialRecord>
): Promise<FinancialRecord> => {
  // For demo purposes, just return a mock result
  await new Promise((resolve) => setTimeout(resolve, 800)); // Fake delay
  return {
    _id: 'new-' + Date.now(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as FinancialRecord;

  // Real API call
  // const response = await api.post(`${BASE_URL}/financial-records`, data);
  // return response.data.data;
};

export const updateFinancialRecord = async (
  id: string,
  data: Partial<FinancialRecord>
): Promise<FinancialRecord> => {
  // For demo purposes, just return a mock result
  await new Promise((resolve) => setTimeout(resolve, 800)); // Fake delay
  return {
    _id: id,
    ...data,
    updatedAt: new Date().toISOString(),
  } as FinancialRecord;

  // Real API call
  // const response = await api.put(`${BASE_URL}/financial-records/${id}`, data);
  // return response.data.data;
};

export const deleteFinancialRecord = async (id: string): Promise<void> => {
  // For demo purposes, just add a delay
  await new Promise((resolve) => setTimeout(resolve, 800)); // Fake delay

  // Real API call
  // await api.delete(`${BASE_URL}/financial-records/${id}`);
};

export const getFinancialSummary = async (
  period?: string
): Promise<FinancialSummary> => {
  // Comment this in production and uncomment the real API call
  return mockFinancialService.getFinancialSummary();

  // Real API call
  // const response = await api.get(`${BASE_URL}/financial-records/summary`, { params: { period } });
  // return response.data.data;
};

// Dues API
export const getDues = async (
  _params?: Record<string, unknown>
): Promise<Due[]> => {
  // Comment this in production and uncomment the real API call
  return mockFinancialService.getDues();

  // Real API call
  // const response = await api.get(`${BASE_URL}/dues`, { params });
  // return response.data.data;
};

export const getDueById = async (id: string): Promise<Due> => {
  // Comment this in production and uncomment the real API call
  return mockFinancialService.getDueById(id);

  // Real API call
  // const response = await api.get(`${BASE_URL}/dues/${id}`);
  // return response.data.data;
};

export const createDue = async (data: Partial<Due>): Promise<Due> => {
  // For demo purposes, just return a mock result
  await new Promise((resolve) => setTimeout(resolve, 800)); // Fake delay
  return {
    _id: 'new-' + Date.now(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Due;

  // Real API call
  // const response = await api.post(`${BASE_URL}/dues`, data);
  // return response.data.data;
};

export const updateDue = async (
  id: string,
  data: Partial<Due>
): Promise<Due> => {
  // For demo purposes, just return a mock result
  await new Promise((resolve) => setTimeout(resolve, 800)); // Fake delay
  return {
    _id: id,
    ...data,
    updatedAt: new Date().toISOString(),
  } as Due;

  // Real API call
  // const response = await api.put(`${BASE_URL}/dues/${id}`, data);
  // return response.data.data;
};

export const deleteDue = async (_id: string): Promise<void> => {
  // For demo purposes, just add a delay
  await new Promise((resolve) => setTimeout(resolve, 800)); // Fake delay

  // Real API call
  // await api.delete(`${BASE_URL}/dues/${id}`);
};

// Due Payments API
export const getDuePayments = async (
  _params?: Record<string, unknown>
): Promise<DuePayment[]> => {
  // Comment this in production and uncomment the real API call
  return mockFinancialService.getDuePayments();

  // Real API call
  // const response = await api.get(`${BASE_URL}/dues/payments`, { params });
  // return response.data.data;
};

export const getDuePaymentById = async (id: string): Promise<DuePayment> => {
  // For demo purposes, return a mock result
  await new Promise((resolve) => setTimeout(resolve, 800)); // Fake delay
  const payment = (await mockFinancialService.getDuePayments()).find(
    (p) => p._id === id
  );
  if (!payment) throw new Error('Payment not found');
  return payment;

  // Real API call
  // const response = await api.get(`${BASE_URL}/dues/payments/${id}`);
  // return response.data.data;
};

export const createDuePayment = async (
  data: Partial<DuePayment>
): Promise<DuePayment> => {
  // For demo purposes, just return a mock result
  await new Promise((resolve) => setTimeout(resolve, 800)); // Fake delay
  return {
    _id: 'new-' + Date.now(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as DuePayment;

  // Real API call
  // const response = await api.post(`${BASE_URL}/dues/payments`, data);
  // return response.data.data;
};

export const updateDuePayment = async (
  id: string,
  data: Partial<DuePayment>
): Promise<DuePayment> => {
  // For demo purposes, just return a mock result
  await new Promise((resolve) => setTimeout(resolve, 800)); // Fake delay
  return {
    _id: id,
    ...data,
    updatedAt: new Date().toISOString(),
  } as DuePayment;

  // Real API call
  // const response = await api.put(`${BASE_URL}/dues/payments/${id}`, data);
  // return response.data.data;
};

export const deleteDuePayment = async (_id: string): Promise<void> => {
  // For demo purposes, just add a delay
  await new Promise((resolve) => setTimeout(resolve, 800)); // Fake delay

  // Real API call
  // await api.delete(`${BASE_URL}/dues/payments/${id}`);
};

// Donations API
export const getDonations = async (
  _params?: Record<string, unknown>
): Promise<Donation[]> => {
  // For demo purposes, return mock data
  await new Promise((resolve) => setTimeout(resolve, 800)); // Fake delay
  return [];

  // Real API call
  // const response = await api.get(`${BASE_URL}/donations`, { params });
  // return response.data.data;
};

export const getDonationById = async (_id: string): Promise<Donation> => {
  // For demo purposes, throw an error
  await new Promise((resolve) => setTimeout(resolve, 800)); // Fake delay
  throw new Error('Donation not found');

  // Real API call
  // const response = await api.get(`${BASE_URL}/donations/${id}`);
  // return response.data.data;
};

export const createDonation = async (
  data: Partial<Donation>
): Promise<Donation> => {
  // For demo purposes, just return a mock result
  await new Promise((resolve) => setTimeout(resolve, 800)); // Fake delay
  return {
    _id: 'new-' + Date.now(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Donation;

  // Real API call
  // const response = await api.post(`${BASE_URL}/donations`, data);
  // return response.data.data;
};

export const updateDonation = async (
  id: string,
  data: Partial<Donation>
): Promise<Donation> => {
  // For demo purposes, just return a mock result
  await new Promise((resolve) => setTimeout(resolve, 800)); // Fake delay
  return {
    _id: id,
    ...data,
    updatedAt: new Date().toISOString(),
  } as Donation;

  // Real API call
  // const response = await api.put(`${BASE_URL}/donations/${id}`, data);
  // return response.data.data;
};

export const deleteDonation = async (_id: string): Promise<void> => {
  // For demo purposes, just add a delay
  await new Promise((resolve) => setTimeout(resolve, 800)); // Fake delay

  // Real API call
  // await api.delete(`${BASE_URL}/donations/${id}`);
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
};

export default financialService;
