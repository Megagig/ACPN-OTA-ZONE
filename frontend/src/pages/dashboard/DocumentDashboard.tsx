import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import documentService from '../../services/document.service';
import type {
  DocumentSummary,
  DocumentCategory,
  DocumentAccessLevel,
} from '../../types/document.types';

const DocumentDashboard: React.FC = () => {
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await documentService.getDocumentSummary();
        setSummary(data);
      } catch (err) {
        setError('Failed to load document summary');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <i className="fas fa-circle-notch fa-spin text-3xl"></i>
          </div>
          <p className="mt-2 text-muted-foreground">
            Loading document summary...
          </p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div
        className="bg-destructive/15 border-l-4 border-destructive text-destructive p-4 my-4"
        role="alert"
      >
        <p className="font-bold">Error</p>
        <p>{error || 'Could not load document summary'}</p>
      </div>
    );
  }

  const getCategoryIcon = (category: DocumentCategory): string => {
    const icons: Record<DocumentCategory, string> = {
      policy: 'book',
      form: 'file-alt',
      report: 'chart-bar',
      newsletter: 'newspaper',
      minutes: 'clipboard',
      guideline: 'list-alt',
      other: 'file',
    };
    return icons[category] || 'file';
  };

  const getAccessLevelColor = (level: DocumentAccessLevel): string => {
    const colors: Record<DocumentAccessLevel, string> = {
      public: 'green',
      members: 'blue',
      committee: 'purple',
      executives: 'orange',
      admin: 'red',
    };
    return colors[level] || 'gray';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Document Management Dashboard
        </h1>
        <Link
          to="/documents/upload"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <i className="fas fa-upload mr-2"></i>
          Upload Document
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-primary/15 p-3 rounded-full mr-4">
              <i className="fas fa-file-alt text-primary text-xl"></i>
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">
                Total Documents
              </h2>
              <p className="text-2xl font-semibold text-foreground">
                {summary.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <i className="fas fa-eye text-green-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">
                Total Views
              </h2>
              <p className="text-2xl font-semibold text-foreground">
                {summary.documentActivity.reduce(
                  (sum, item) => sum + item.views,
                  0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <i className="fas fa-download text-blue-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">
                Total Downloads
              </h2>
              <p className="text-2xl font-semibold text-foreground">
                {summary.documentActivity.reduce(
                  (sum, item) => sum + item.downloads,
                  0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Documents by Category */}
        <div className="bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Documents by Category</h3>
          <div className="space-y-3">
            {Object.entries(summary.byCategory).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <i className={`fas fa-${getCategoryIcon(category as DocumentCategory)} mr-3 text-muted-foreground`}></i>
                  <span className="capitalize">{category}</span>
                </div>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Documents by Access Level */}
        <div className="bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Documents by Access Level</h3>
          <div className="space-y-3">
            {Object.entries(summary.byAccessLevel).map(([level, count]) => (
              <div key={level} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full bg-${getAccessLevelColor(level as DocumentAccessLevel)}-500 mr-3`}></div>
                  <span className="capitalize">{level}</span>
                </div>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Document Activity</h3>
        <div className="space-y-4">
          {summary.documentActivity.slice(0, 5).map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <i className="fas fa-chart-line text-blue-600"></i>
                </div>
                <div>
                  <p className="font-medium">{activity.date}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.views} views, {activity.downloads} downloads
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentDashboard;
