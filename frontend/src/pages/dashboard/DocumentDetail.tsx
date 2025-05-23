import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import documentService from '../../services/document.service';
import { Document, DocumentVersion } from '../../types/document.types';

const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    const fetchDocumentData = async () => {
      try {
        setLoading(true);
        const docData = await documentService.getDocumentById(id);
        setDocument(docData);
        setActiveVersion(docData.version);

        // If document has version history, fetch it
        if (docData.version > 1) {
          const versionData = await documentService.getDocumentVersions(id);
          setVersions(versionData);
        }
      } catch (err) {
        setError('Failed to load document details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentData();
  }, [id]);

  const handleDownload = async () => {
    if (!id) return;

    try {
      const blob = await documentService.downloadDocument(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document?.fileName || `document-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError('Failed to download document');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    if (
      window.confirm(
        'Are you sure you want to delete this document? This action cannot be undone.'
      )
    ) {
      try {
        await documentService.deleteDocument(id);
        navigate('/documents/list');
      } catch (err) {
        setError('Failed to delete document');
        console.error(err);
      }
    }
  };

  const handleArchive = async () => {
    if (!id || !document) return;

    if (window.confirm('Are you sure you want to archive this document?')) {
      try {
        await documentService.archiveDocument(id);
        setDocument({
          ...document,
          status: 'archived',
        });
      } catch (err) {
        setError('Failed to archive document');
        console.error(err);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.includes('pdf')) return 'file-pdf';
    if (fileType.includes('word') || fileType.includes('document'))
      return 'file-word';
    if (fileType.includes('excel') || fileType.includes('sheet'))
      return 'file-excel';
    if (fileType.includes('presentation') || fileType.includes('powerpoint'))
      return 'file-powerpoint';
    if (fileType.includes('image')) return 'file-image';
    if (fileType.includes('zip') || fileType.includes('archive'))
      return 'file-archive';
    if (fileType.includes('text')) return 'file-alt';
    return 'file';
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
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

  const toggleVersionHistory = () => {
    setShowVersionHistory(!showVersionHistory);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner-border text-indigo-500" role="status">
            <i className="fas fa-circle-notch fa-spin text-3xl"></i>
          </div>
          <p className="mt-2 text-gray-600">Loading document details...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div
        className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
        role="alert"
      >
        <p className="font-bold">Error</p>
        <p>{error || 'Could not load document details'}</p>
        <div className="mt-4">
          <Link
            to="/documents/list"
            className="text-red-700 hover:text-red-900 underline"
          >
            Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <Link
            to="/documents/list"
            className="text-indigo-600 hover:text-indigo-800 mb-2 inline-block"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Documents
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{document.title}</h1>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <i className="fas fa-download mr-2"></i>
            Download
          </button>
          {document.version > 1 && (
            <button
              onClick={toggleVersionHistory}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <i className="fas fa-history mr-2"></i>
              {showVersionHistory ? 'Hide History' : 'Version History'}
            </button>
          )}
          {document.status === 'active' && (
            <button
              onClick={handleArchive}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              <i className="fas fa-archive mr-2"></i>
              Archive
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <i className="fas fa-trash-alt mr-2"></i>
            Delete
          </button>
        </div>
      </div>

      {/* Document Preview */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row">
          {/* File preview icon */}
          <div className="w-full md:w-1/3 flex justify-center items-start mb-6 md:mb-0">
            <div className="bg-gray-100 rounded-lg p-6 text-center">
              <i
                className={`fas fa-${getFileIcon(
                  document.fileType
                )} text-gray-600 text-7xl mb-4`}
              ></i>
              <h3 className="text-lg font-medium text-gray-800 truncate max-w-xs mx-auto">
                {document.fileName}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {formatFileSize(document.fileSize)}
              </p>
              <div className="mt-4">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <i className="fas fa-download mr-2"></i>
                  Download
                </button>
              </div>
            </div>
          </div>

          {/* Document details */}
          <div className="w-full md:w-2/3 md:pl-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {document.title}
              </h2>
              <p className="text-gray-600">{document.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="flex items-center">
                  <i
                    className={`fas fa-${getCategoryIcon(
                      document.category
                    )} text-gray-400 mr-2`}
                  ></i>
                  <span className="capitalize">{document.category}</span>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Access Level
                </h3>
                <p className="capitalize">{document.accessLevel}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="capitalize">{document.status}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Version</h3>
                <p>{document.version}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Uploaded</h3>
                <p>{formatDate(document.uploadedAt)}</p>
              </div>
              {document.modifiedAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Last Modified
                  </h3>
                  <p>{formatDate(document.modifiedAt)}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Downloads</h3>
                <p>{document.downloadCount}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Views</h3>
                <p>{document.viewCount}</p>
              </div>
            </div>

            {document.tags && document.tags.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag) => (
                    <span
                      key={tag._id}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {document.expirationDate && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Expiration Date
                </h3>
                <p>{formatDate(document.expirationDate)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Version History */}
      {showVersionHistory && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Version History
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Changes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {versions.map((version) => (
                  <tr
                    key={version._id}
                    className={
                      version.version === activeVersion
                        ? 'bg-indigo-50'
                        : 'hover:bg-gray-50'
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {version.version === activeVersion && (
                          <span className="flex h-2 w-2 mr-2">
                            <span className="animate-pulse relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                          </span>
                        )}
                        <span
                          className={
                            version.version === activeVersion
                              ? 'font-semibold'
                              : ''
                          }
                        >
                          v{version.version}
                          {version.version === activeVersion && ' (Current)'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(version.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof version.uploadedBy === 'string'
                        ? version.uploadedBy
                        : version.uploadedBy.firstName +
                          ' ' +
                          version.uploadedBy.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(version.fileSize)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {version.changes || 'No change description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          // In a real app, we would download this specific version
                          alert('Downloading version ' + version.version);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
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
      )}

      {/* Upload New Version Button */}
      {document.status === 'active' && (
        <div className="flex justify-end">
          <Link
            to={`/documents/${id}/upload-version`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <i className="fas fa-upload mr-2"></i>
            Upload New Version
          </Link>
        </div>
      )}
    </div>
  );
};

export default DocumentDetail;
