import api from './api';
import type {
  Document,
  DocumentVersion,
  DocumentSearchParams,
  DocumentSummary,
} from '../types/document.types';

// Using relative path since api.ts already has the '/api' baseURL
const BASE_URL = '/organization-documents';

// Documents API
export const getDocuments = async (
  params?: DocumentSearchParams
): Promise<Document[]> => {
  try {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.category) queryParams.append('category', params.category);
      if (params.accessLevel)
        queryParams.append('accessLevel', params.accessLevel);
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);
      if (params.uploadedBy)
        queryParams.append('uploadedBy', params.uploadedBy);
      if (params.tags && params.tags.length > 0) {
        params.tags.forEach((tag) => queryParams.append('tags', tag));
      }
      if (params.dateRange) {
        queryParams.append('dateStart', params.dateRange.start);
        queryParams.append('dateEnd', params.dateRange.end);
      }
    }

    const url = queryParams.toString()
      ? `${BASE_URL}?${queryParams.toString()}`
      : BASE_URL;

    const response = await api.get(url);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch documents'
    );
  }
};

export const getDocumentById = async (id: string): Promise<Document> => {
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching document:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch document'
    );
  }
};

export const uploadDocument = async (formData: FormData): Promise<Document> => {
  try {
    const response = await api.post(`${BASE_URL}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error uploading document:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to upload document'
    );
  }
};

export const updateDocument = async (
  id: string,
  data: Partial<Document>
): Promise<Document> => {
  try {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data.data;
  } catch (error: any) {
    console.error('Error updating document:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to update document'
    );
  }
};

export const deleteDocument = async (id: string): Promise<void> => {
  try {
    await api.delete(`${BASE_URL}/${id}`);
  } catch (error: any) {
    console.error('Error deleting document:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to delete document'
    );
  }
};

export const archiveDocument = async (id: string): Promise<Document> => {
  try {
    const response = await api.put(`${BASE_URL}/${id}/archive`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error archiving document:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to archive document'
    );
  }
};

export const downloadDocument = async (id: string): Promise<Blob> => {
  try {
    const response = await api.get(`${BASE_URL}/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error: any) {
    console.error('Error downloading document:', error);
    // Fallback: try to redirect to the download URL
    window.open(`${BASE_URL}/${id}/download`, '_blank');
    throw new Error(
      error.response?.data?.message || 'Failed to download document'
    );
  }
};

export const getDocumentVersions = async (
  id: string
): Promise<DocumentVersion[]> => {
  try {
    const response = await api.get(`${BASE_URL}/${id}/versions`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching document versions:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch document versions'
    );
  }
};

export const getDocumentSummary = async (): Promise<DocumentSummary> => {
  try {
    const response = await api.get(`${BASE_URL}/summary`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching document summary:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch document summary'
    );
  }
};

export const uploadNewVersion = async (
  id: string,
  formData: FormData
): Promise<DocumentVersion> => {
  try {
    const response = await api.post(`${BASE_URL}/${id}/versions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error uploading new version:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to upload new version'
    );
  }
};

// All exported functions
const documentService = {
  getDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  deleteDocument,
  archiveDocument,
  downloadDocument,
  getDocumentVersions,
  getDocumentSummary,
  uploadNewVersion,
};

export default documentService;
