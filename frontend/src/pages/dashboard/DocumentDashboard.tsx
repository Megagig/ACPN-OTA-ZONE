import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import documentService from '../../services/document.service';
import type {
  DocumentSummary,
  DocumentCategory,
  DocumentAccessLevel,
} from '../../types/document.types';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DocumentDashboard: React.FC = () => {
  const { theme } = useTheme();
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

  // Prepare data for Category chart
  const categoryChartData = {
    labels: Object.keys(summary.byCategory) as DocumentCategory[],
    datasets: [
      {
        label: 'Documents by Category',
        data: Object.values(summary.byCategory),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for Access Level chart
  const accessLevelChartData = {
    labels: Object.keys(summary.byAccessLevel) as DocumentAccessLevel[],
    datasets: [
      {
        label: 'Documents by Access Level',
        data: Object.values(summary.byAccessLevel),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare activity chart data
  const activityChartData = {
    labels: summary.documentActivity.map((item) => item.date),
    datasets: [
      {
        label: 'Views',
        data: summary.documentActivity.map((item) => item.views),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Downloads',
        data: summary.documentActivity.map((item) => item.downloads),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
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
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mr-4">
              <i className="fas fa-eye text-green-600 dark:text-green-400 text-xl"></i>
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
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
              <i className="fas fa-download text-blue-600 dark:text-blue-400 text-xl"></i>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Documents by Category
          </h2>
          <div className="h-64">
            <Pie
              data={categoryChartData}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Documents by Access Level
          </h2>
          <div className="h-64">
            <Pie
              data={accessLevelChartData}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Document Activity
        </h2>
        <div className="h-64">
          <Bar
            data={activityChartData}
            options={{
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      </div>

      {/* Recent Documents */}
      <div className="bg-card rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Documents
          </h2>
          <Link
            to="/documents/list"
            className="text-primary hover:text-primary/80"
          >
            View All Documents
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Access Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {summary.recentDocuments.map((doc) => (
                <tr key={doc._id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-muted rounded-md">
                        <i
                          className={`fas fa-${getCategoryIcon(
                            doc.category
                          )} text-muted-foreground`}
                        ></i>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-foreground">
                          {doc.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {doc.fileName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-muted text-foreground">
                      {doc.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getAccessLevelColor(
                        doc.accessLevel
                      )}-100 dark:bg-${getAccessLevelColor(
                        doc.accessLevel
                      )}-900/30 text-${getAccessLevelColor(
                        doc.accessLevel
                      )}-800 dark:text-${getAccessLevelColor(
                        doc.accessLevel
                      )}-400`}
                    >
                      {doc.accessLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/documents/${doc._id}`}
                      className="text-primary hover:text-primary/80 mr-3"
                    >
                      View
                    </Link>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        documentService
                          .downloadDocument(doc._id)
                          .then((blob) => {
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = doc.fileName;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                          });
                      }}
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popular Documents */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Popular Documents
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.popularDocuments.map((doc) => (
            <div
              key={doc._id}
              className="border border-border rounded-lg p-4 bg-muted/50"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-muted rounded-md">
                  <i
                    className={`fas fa-${getCategoryIcon(
                      doc.category
                    )} text-muted-foreground`}
                  ></i>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-medium text-foreground">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {doc.fileName}
                  </p>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">
                      <i className="fas fa-eye mr-1"></i> {doc.viewCount} views
                    </span>
                    <span className="text-xs text-muted-foreground">
                      <i className="fas fa-download mr-1"></i>{' '}
                      {doc.downloadCount} downloads
                    </span>
                  </div>
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
