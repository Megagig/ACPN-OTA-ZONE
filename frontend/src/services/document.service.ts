import api from './api';
import {
  Document,
  DocumentVersion,
  DocumentDownload,
  DocumentView,
  DocumentCategory,
  DocumentAccessLevel,
  DocumentStatus,
  DocumentSearchParams,
  DocumentSummary,
} from '../types/document.types';

const BASE_URL = '/api';

// For demonstration, using mock data instead of actual API calls
// In production, replace these with actual API calls

// Mock documents data
const mockDocuments: Document[] = [
  {
    _id: 'doc001',
    title: 'ACPN Ota Zone Constitution',
    description:
      'The official constitution document outlining the rules and regulations of ACPN Ota Zone.',
    fileUrl: 'https://example.com/files/constitution.pdf',
    fileName: 'ACPN_Ota_Zone_Constitution_2023.pdf',
    fileSize: 2458621, // In bytes
    fileType: 'application/pdf',
    category: 'policy',
    tags: [
      { _id: 'tag001', name: 'constitution' },
      { _id: 'tag002', name: 'governance' },
    ],
    accessLevel: 'members',
    status: 'active',
    uploadedBy: 'user123',
    uploadedAt: '2023-03-15T10:00:00',
    modifiedAt: '2023-05-10T14:30:00',
    modifiedBy: 'user456',
    version: 2,
    downloadCount: 45,
    viewCount: 120,
  },
  {
    _id: 'doc002',
    title: 'Membership Registration Form',
    description: 'Form for new members to register with ACPN Ota Zone.',
    fileUrl: 'https://example.com/files/registration.pdf',
    fileName: 'ACPN_Membership_Form_2023.pdf',
    fileSize: 524288, // In bytes
    fileType: 'application/pdf',
    category: 'form',
    tags: [
      { _id: 'tag003', name: 'registration' },
      { _id: 'tag004', name: 'membership' },
    ],
    accessLevel: 'public',
    status: 'active',
    uploadedBy: 'user456',
    uploadedAt: '2023-04-01T09:15:00',
    version: 1,
    downloadCount: 78,
    viewCount: 210,
  },
  {
    _id: 'doc003',
    title: 'Annual General Meeting Minutes - 2023',
    description: 'Minutes from the Annual General Meeting held on May 5, 2023.',
    fileUrl: 'https://example.com/files/agm-minutes.pdf',
    fileName: 'AGM_Minutes_2023.pdf',
    fileSize: 1572864, // In bytes
    fileType: 'application/pdf',
    category: 'minutes',
    tags: [
      { _id: 'tag005', name: 'agm' },
      { _id: 'tag006', name: 'minutes' },
    ],
    accessLevel: 'members',
    status: 'active',
    uploadedBy: 'user789',
    uploadedAt: '2023-05-10T16:45:00',
    version: 1,
    downloadCount: 32,
    viewCount: 67,
  },
  {
    _id: 'doc004',
    title: 'Pharmacy Practice Guidelines 2023',
    description:
      'Updated guidelines for pharmacy practice in accordance with national regulations.',
    fileUrl: 'https://example.com/files/practice-guidelines.pdf',
    fileName: 'Pharmacy_Practice_Guidelines_2023.pdf',
    fileSize: 3145728, // In bytes
    fileType: 'application/pdf',
    category: 'guideline',
    tags: [
      { _id: 'tag007', name: 'guidelines' },
      { _id: 'tag008', name: 'practice' },
      { _id: 'tag009', name: 'regulations' },
    ],
    accessLevel: 'members',
    status: 'active',
    uploadedBy: 'user123',
    uploadedAt: '2023-02-20T11:30:00',
    version: 1,
    downloadCount: 56,
    viewCount: 123,
  },
  {
    _id: 'doc005',
    title: 'Quarterly Newsletter - Q2 2023',
    description:
      'Newsletter covering events, updates, and announcements for Q2 2023.',
    fileUrl: 'https://example.com/files/newsletter-q2.pdf',
    fileName: 'ACPN_Newsletter_Q2_2023.pdf',
    fileSize: 2097152, // In bytes
    fileType: 'application/pdf',
    category: 'newsletter',
    tags: [
      { _id: 'tag010', name: 'newsletter' },
      { _id: 'tag011', name: 'quarterly' },
    ],
    accessLevel: 'public',
    status: 'active',
    uploadedBy: 'user456',
    uploadedAt: '2023-07-05T13:00:00',
    version: 1,
    downloadCount: 89,
    viewCount: 245,
  },
  {
    _id: 'doc006',
    title: 'Financial Report - 2022',
    description: 'Annual financial report for the year 2022.',
    fileUrl: 'https://example.com/files/financial-report.pdf',
    fileName: 'Financial_Report_2022.pdf',
    fileSize: 1835008, // In bytes
    fileType: 'application/pdf',
    category: 'report',
    tags: [
      { _id: 'tag012', name: 'financial' },
      { _id: 'tag013', name: 'annual' },
      { _id: 'tag014', name: 'report' },
    ],
    accessLevel: 'executives',
    status: 'active',
    uploadedBy: 'user789',
    uploadedAt: '2023-01-30T10:45:00',
    version: 1,
    downloadCount: 12,
    viewCount: 25,
  },
  {
    _id: 'doc007',
    title: 'Executive Committee Meeting Minutes - March 2023',
    description:
      'Minutes from the Executive Committee meeting held on March 15, 2023.',
    fileUrl: 'https://example.com/files/exco-minutes.pdf',
    fileName: 'ExCo_Minutes_March_2023.pdf',
    fileSize: 1048576, // In bytes
    fileType: 'application/pdf',
    category: 'minutes',
    tags: [
      { _id: 'tag015', name: 'exco' },
      { _id: 'tag006', name: 'minutes' },
    ],
    accessLevel: 'executives',
    status: 'active',
    uploadedBy: 'user123',
    uploadedAt: '2023-03-20T15:30:00',
    version: 1,
    downloadCount: 15,
    viewCount: 18,
  },
  {
    _id: 'doc008',
    title: 'Dues Payment Form',
    description:
      'Form for members to complete when making annual dues payments.',
    fileUrl: 'https://example.com/files/dues-form.docx',
    fileName: 'Dues_Payment_Form.docx',
    fileSize: 262144, // In bytes
    fileType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    category: 'form',
    tags: [
      { _id: 'tag016', name: 'dues' },
      { _id: 'tag017', name: 'payment' },
      { _id: 'tag004', name: 'membership' },
    ],
    accessLevel: 'members',
    status: 'active',
    uploadedBy: 'user456',
    uploadedAt: '2023-01-10T09:00:00',
    version: 1,
    downloadCount: 95,
    viewCount: 187,
  },
];

// Mock document versions
const mockDocumentVersions: DocumentVersion[] = [
  {
    _id: 'ver001',
    documentId: 'doc001',
    fileUrl: 'https://example.com/files/constitution_v1.pdf',
    fileName: 'ACPN_Ota_Zone_Constitution_2022.pdf',
    fileSize: 2359296, // In bytes
    version: 1,
    uploadedBy: 'user123',
    uploadedAt: '2022-11-10T10:00:00',
    changes: 'Initial document upload',
  },
  {
    _id: 'ver002',
    documentId: 'doc001',
    fileUrl: 'https://example.com/files/constitution.pdf',
    fileName: 'ACPN_Ota_Zone_Constitution_2023.pdf',
    fileSize: 2458621, // In bytes
    version: 2,
    uploadedBy: 'user456',
    uploadedAt: '2023-05-10T14:30:00',
    changes: 'Updated with amendments approved at the 2023 AGM',
  },
];

// Mock document summary
const mockDocumentSummary: DocumentSummary = {
  total: mockDocuments.length,
  byCategory: {
    policy: mockDocuments.filter((d) => d.category === 'policy').length,
    form: mockDocuments.filter((d) => d.category === 'form').length,
    report: mockDocuments.filter((d) => d.category === 'report').length,
    newsletter: mockDocuments.filter((d) => d.category === 'newsletter').length,
    minutes: mockDocuments.filter((d) => d.category === 'minutes').length,
    guideline: mockDocuments.filter((d) => d.category === 'guideline').length,
    other: mockDocuments.filter((d) => d.category === 'other').length,
  },
  byAccessLevel: {
    public: mockDocuments.filter((d) => d.accessLevel === 'public').length,
    members: mockDocuments.filter((d) => d.accessLevel === 'members').length,
    committee: mockDocuments.filter((d) => d.accessLevel === 'committee')
      .length,
    executives: mockDocuments.filter((d) => d.accessLevel === 'executives')
      .length,
    admin: mockDocuments.filter((d) => d.accessLevel === 'admin').length,
  },
  recentDocuments: mockDocuments
    .sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
    .slice(0, 5),
  popularDocuments: mockDocuments
    .sort((a, b) => b.downloadCount - a.downloadCount)
    .slice(0, 5),
  documentActivity: [
    { date: '2023-05-01', views: 15, downloads: 7 },
    { date: '2023-05-08', views: 22, downloads: 9 },
    { date: '2023-05-15', views: 18, downloads: 5 },
    { date: '2023-05-22', views: 30, downloads: 12 },
    { date: '2023-05-29', views: 25, downloads: 10 },
  ],
};

// Helper for simulating API responses with delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Documents API
export const getDocuments = async (
  params?: DocumentSearchParams
): Promise<Document[]> => {
  // For demo purposes, return mock data
  await delay(800);

  let filteredDocs = [...mockDocuments];

  // Apply filters if provided
  if (params) {
    if (params.category) {
      filteredDocs = filteredDocs.filter(
        (doc) => doc.category === params.category
      );
    }

    if (params.accessLevel) {
      filteredDocs = filteredDocs.filter(
        (doc) => doc.accessLevel === params.accessLevel
      );
    }

    if (params.status) {
      filteredDocs = filteredDocs.filter((doc) => doc.status === params.status);
    }

    if (params.tags && params.tags.length > 0) {
      filteredDocs = filteredDocs.filter((doc) =>
        doc.tags.some((tag) => params.tags!.includes(tag._id))
      );
    }

    if (params.uploadedBy) {
      filteredDocs = filteredDocs.filter((doc) =>
        typeof doc.uploadedBy === 'string'
          ? doc.uploadedBy === params.uploadedBy
          : doc.uploadedBy._id === params.uploadedBy
      );
    }

    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      filteredDocs = filteredDocs.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchTerm) ||
          doc.description.toLowerCase().includes(searchTerm) ||
          doc.fileName.toLowerCase().includes(searchTerm) ||
          doc.tags.some((tag) => tag.name.toLowerCase().includes(searchTerm))
      );
    }

    if (params.dateRange) {
      const startDate = new Date(params.dateRange.start).getTime();
      const endDate = new Date(params.dateRange.end).getTime();

      filteredDocs = filteredDocs.filter((doc) => {
        const uploadDate = new Date(doc.uploadedAt).getTime();
        return uploadDate >= startDate && uploadDate <= endDate;
      });
    }
  }

  return filteredDocs;

  // Real API call
  // const response = await api.get(`${BASE_URL}/documents`, { params });
  // return response.data.data;
};

export const getDocumentById = async (id: string): Promise<Document> => {
  // For demo purposes, return mock data
  await delay(800);
  const document = mockDocuments.find((d) => d._id === id);
  if (!document) throw new Error('Document not found');

  // Increment view count in mock data
  document.viewCount += 1;

  return document;

  // Real API call
  // const response = await api.get(`${BASE_URL}/documents/${id}`);
  // return response.data.data;
};

export const uploadDocument = async (formData: FormData): Promise<Document> => {
  // For demo purposes, just return a mock result
  await delay(1500);

  // Extract data from FormData
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as DocumentCategory;
  const accessLevel = formData.get('accessLevel') as DocumentAccessLevel;
  const file = formData.get('file') as File;

  return {
    _id: 'new-' + Date.now(),
    title,
    description,
    fileUrl: URL.createObjectURL(file), // This URL will only work locally
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    category,
    tags: [],
    accessLevel,
    status: 'active',
    uploadedBy: 'currentUser',
    uploadedAt: new Date().toISOString(),
    version: 1,
    downloadCount: 0,
    viewCount: 0,
  } as Document;

  // Real API call
  // const response = await api.post(`${BASE_URL}/documents/upload`, formData, {
  //   headers: {
  //     'Content-Type': 'multipart/form-data'
  //   }
  // });
  // return response.data.data;
};

export const updateDocument = async (
  id: string,
  data: Partial<Document>
): Promise<Document> => {
  // For demo purposes, just return a mock result
  await delay(800);

  return {
    _id: id,
    ...data,
    modifiedAt: new Date().toISOString(),
    modifiedBy: 'currentUser',
  } as Document;

  // Real API call
  // const response = await api.put(`${BASE_URL}/documents/${id}`, data);
  // return response.data.data;
};

export const deleteDocument = async (id: string): Promise<void> => {
  // For demo purposes, just add a delay
  await delay(800);

  // Real API call
  // await api.delete(`${BASE_URL}/documents/${id}`);
};

export const archiveDocument = async (id: string): Promise<Document> => {
  // For demo purposes, just return a mock result
  await delay(800);

  return {
    _id: id,
    status: 'archived',
    modifiedAt: new Date().toISOString(),
    modifiedBy: 'currentUser',
  } as Document;

  // Real API call
  // const response = await api.put(`${BASE_URL}/documents/${id}/archive`);
  // return response.data.data;
};

export const downloadDocument = async (id: string): Promise<Blob> => {
  // For demo purposes, just add a delay
  await delay(1200);

  // Increment download count in mock data
  const document = mockDocuments.find((d) => d._id === id);
  if (document) {
    document.downloadCount += 1;
  }

  // In a real app, this would download the actual file
  // For demo, just create a dummy text file
  const blob = new Blob(['This is a mock document content for ' + id], {
    type: 'text/plain',
  });
  return blob;

  // Real API call
  // const response = await api.get(`${BASE_URL}/documents/${id}/download`, {
  //   responseType: 'blob'
  // });
  // return response.data;
};

export const getDocumentVersions = async (
  id: string
): Promise<DocumentVersion[]> => {
  // For demo purposes, return mock data
  await delay(800);
  return mockDocumentVersions.filter((v) => v.documentId === id);

  // Real API call
  // const response = await api.get(`${BASE_URL}/documents/${id}/versions`);
  // return response.data.data;
};

export const getDocumentSummary = async (): Promise<DocumentSummary> => {
  // For demo purposes, return mock data
  await delay(800);
  return mockDocumentSummary;

  // Real API call
  // const response = await api.get(`${BASE_URL}/documents/summary`);
  // return response.data.data;
};

export const uploadNewVersion = async (
  id: string,
  formData: FormData
): Promise<DocumentVersion> => {
  // For demo purposes, just return a mock result
  await delay(1500);

  const document = mockDocuments.find((d) => d._id === id);
  if (!document) throw new Error('Document not found');

  const file = formData.get('file') as File;
  const changes = formData.get('changes') as string;

  // Update the document
  document.version += 1;
  document.fileUrl = URL.createObjectURL(file); // This URL will only work locally
  document.fileName = file.name;
  document.fileSize = file.size;
  document.fileType = file.type;
  document.modifiedAt = new Date().toISOString();
  document.modifiedBy = 'currentUser';

  // Create a new version record
  const newVersion: DocumentVersion = {
    _id: 'ver-new-' + Date.now(),
    documentId: id,
    fileUrl: document.fileUrl,
    fileName: document.fileName,
    fileSize: document.fileSize,
    version: document.version,
    uploadedBy: 'currentUser',
    uploadedAt: new Date().toISOString(),
    changes,
  };

  return newVersion;

  // Real API call
  // const response = await api.post(`${BASE_URL}/documents/${id}/versions`, formData, {
  //   headers: {
  //     'Content-Type': 'multipart/form-data'
  //   }
  // });
  // return response.data.data;
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
