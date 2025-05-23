import { User } from './auth.types';

export type DocumentStatus = 'active' | 'archived';
export type DocumentAccessLevel =
  | 'public'
  | 'members'
  | 'committee'
  | 'executives'
  | 'admin';
export type DocumentCategory =
  | 'policy'
  | 'form'
  | 'report'
  | 'newsletter'
  | 'minutes'
  | 'guideline'
  | 'other';

export interface DocumentTag {
  _id: string;
  name: string;
}

export interface Document {
  _id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  category: DocumentCategory;
  tags: DocumentTag[];
  accessLevel: DocumentAccessLevel;
  status: DocumentStatus;
  uploadedBy: string | User;
  uploadedAt: string;
  modifiedAt?: string;
  modifiedBy?: string | User;
  version: number;
  previousVersions?: Document[];
  downloadCount: number;
  viewCount: number;
  expirationDate?: string;
}

export interface DocumentVersion {
  _id: string;
  documentId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  version: number;
  uploadedBy: string | User;
  uploadedAt: string;
  changes: string;
}

export interface DocumentDownload {
  _id: string;
  documentId: string;
  userId: string;
  downloadedAt: string;
  ipAddress: string;
  deviceInfo: string;
}

export interface DocumentView {
  _id: string;
  documentId: string;
  userId: string;
  viewedAt: string;
  ipAddress: string;
  deviceInfo: string;
}

export interface DocumentSearchParams {
  category?: DocumentCategory;
  accessLevel?: DocumentAccessLevel;
  status?: DocumentStatus;
  tags?: string[];
  search?: string;
  uploadedBy?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface DocumentSummary {
  total: number;
  byCategory: {
    [key in DocumentCategory]: number;
  };
  byAccessLevel: {
    [key in DocumentAccessLevel]: number;
  };
  recentDocuments: Document[];
  popularDocuments: Document[];
  documentActivity: {
    date: string;
    views: number;
    downloads: number;
  }[];
}

export interface UploadDocumentResponse {
  document: Document;
  uploadUrl?: string;
}
