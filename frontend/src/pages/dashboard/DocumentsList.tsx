import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import documentService from '../../services/document.service';
import type { Document, DocumentCategory, DocumentAccessLevel, DocumentStatus } from '../../types/document.types';

const DocumentsList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: undefined as DocumentCategory | undefined,
    accessLevel: undefined as DocumentAccessLevel | undefined,
    status: undefined as DocumentStatus | undefined,
  });

  useEffect(() => {
    loadDocuments();
  }, [filters]);

  const loadDocuments = async () => {
    try {
      const response = await documentService.getDocuments(filters);
      setDocuments(response);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      search: value,
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getStatusColor = (status: DocumentStatus): string => {
    return status === 'active' ? 'green' : 'gray';
  };

  const getAccessLevelColor = (level: DocumentAccessLevel): string => {
    const colors: Record<DocumentAccessLevel, string> = {
      public: 'blue',
      members: 'green',
      committee: 'purple',
      executives: 'orange',
      admin: 'red',
    };
    return colors[level] || 'gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Documents</h1>
        <Link to="/dashboard/documents/upload">
          <Button>Upload Document</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <Input
                placeholder="Search documents..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Select value={filters.category || 'all'} onValueChange={(value: string) => handleFilterChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="guideline">Guideline</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Access Level</label>
              <Select value={filters.accessLevel || 'all'} onValueChange={(value: string) => handleFilterChange('accessLevel', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="members">Members</SelectItem>
                  <SelectItem value="committee">Committee</SelectItem>
                  <SelectItem value="executives">Executives</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={filters.status || 'all'} onValueChange={(value: string) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.map((doc) => (
          <Card key={doc._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {doc.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{doc.title}</h3>
                    <p className="text-gray-600 text-sm">{doc.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-gray-500 text-sm">{doc.category}</span>
                      <span className={`text-${getAccessLevelColor(doc.accessLevel)}-500 text-sm`}>{doc.accessLevel}</span>
                      <span className={`text-${getStatusColor(doc.status)}-500 text-sm`}>{doc.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatFileSize(doc.fileSize)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <i className="fas fa-eye mr-2"></i>
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <i className="fas fa-download mr-2"></i>
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {documents.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">
              <i className="fas fa-file-alt text-4xl mb-4"></i>
              <p className="text-lg">No documents found</p>
              <p className="text-sm">Try adjusting your filters or upload a new document.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentsList;
