import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import documentService from '../../services/document.service';
import type {
  Document,
  DocumentCategory,
  DocumentAccessLevel,
  DocumentStatus,
  DocumentSearchParams,
} from '../../types/document.types';

const DocumentsList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<DocumentSearchParams>({});
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [documentsPerPage] = useState<number>(10);

  useEffect(() => {
    fetchDocuments();
  }, [searchParams]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentService.getDocuments(searchParams);
      setDocuments(data);
    } catch (err) {
      setError('Failed to load documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as DocumentCategory | undefined;
    setSearchParams((prev) => ({
      ...prev,
      category: value === 'all' ? undefined : (value as DocumentCategory),
    }));
  };

  const handleAccessLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as DocumentAccessLevel | undefined;
    setSearchParams((prev) => ({
      ...prev,
      accessLevel: value === 'all' ? undefined : (value as DocumentAccessLevel),
    }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as DocumentStatus | undefined;
    setSearchParams((prev) => ({
      ...prev,
      status: value === 'all' ? undefined : (value as DocumentStatus),
    }));
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedDocuments((prev) => {
      if (prev.includes(id)) {
        return prev.filter((docId) => docId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documents.map((doc) => doc._id));
    }
  };

  const handleBulkArchive = async () => {
    if (!selectedDocuments.length) return;

    if (
      window.confirm(
        `Are you sure you want to archive ${selectedDocuments.length} document(s)?`
      )
    ) {
      try {
        setLoading(true);

        // Archive each selected document
        for (const id of selectedDocuments) {
          await documentService.archiveDocument(id);
        }

        // Refresh documents list
        fetchDocuments();

        // Clear selection
        setSelectedDocuments([]);
      } catch (err) {
        setError('Failed to archive selected documents');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedDocuments.length) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedDocuments.length} document(s)? This action cannot be undone.`
      )
    ) {
      try {
        setLoading(true);

        // Delete each selected document
        for (const id of selectedDocuments) {
          await documentService.deleteDocument(id);
        }

        // Refresh documents list
        fetchDocuments();

        // Clear selection
        setSelectedDocuments([]);
      } catch (err) {
        setError('Failed to delete selected documents');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getAccessLevelBadge = (level: DocumentAccessLevel): JSX.Element => {
    const colors: Record<DocumentAccessLevel, { bg: string; text: string }> = {
      public: { bg: 'bg-green-100', text: 'text-green-800' },
      members: { bg: 'bg-blue-100', text: 'text-blue-800' },
      committee: { bg: 'bg-purple-100', text: 'text-purple-800' },
      executives: { bg: 'bg-orange-100', text: 'text-orange-800' },
      admin: { bg: 'bg-red-100', text: 'text-red-800' },
    };

    const style = colors[level] || { bg: 'bg-gray-100', text: 'text-gray-800' };

    return (
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${style.bg} ${style.text}`}
      >
        {level}
      </span>
    );
  };

  const getStatusBadge = (status: DocumentStatus): JSX.Element => {
    const style =
      status === 'active'
        ? 'bg-green-100 text-green-800'
        : 'bg-gray-100 text-gray-800';

    return (
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}
      >
        {status}
      </span>
    );
  };

  // Pagination logic
  const indexOfLastDocument = currentPage * documentsPerPage;
  const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
  const currentDocuments = documents.slice(
    indexOfFirstDocument,
    indexOfLastDocument
  );
  const totalPages = Math.ceil(documents.length / documentsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner-border text-indigo-500" role="status">
            <i className="fas fa-circle-notch fa-spin text-3xl"></i>
          </div>
          <p className="mt-2 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
        <Link
          to="/documents/upload"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <i className="fas fa-upload mr-2"></i>
          Upload Document
        </Link>
      </div>

      {error && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search
              </label>
              <input
                type="text"
                id="search"
                name="search"
                value={searchParams.search || ''}
                onChange={handleInputChange}
                placeholder="Search documents..."
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                value={searchParams.category || 'all'}
                onChange={handleCategoryChange}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                <option value="policy">Policy</option>
                <option value="form">Form</option>
                <option value="report">Report</option>
                <option value="newsletter">Newsletter</option>
                <option value="minutes">Minutes</option>
                <option value="guideline">Guideline</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="accessLevel"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Access Level
              </label>
              <select
                id="accessLevel"
                name="accessLevel"
                value={searchParams.accessLevel || 'all'}
                onChange={handleAccessLevelChange}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Access Levels</option>
                <option value="public">Public</option>
                <option value="members">Members</option>
                <option value="committee">Committee</option>
                <option value="executives">Executives</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={searchParams.status || 'all'}
                onChange={handleStatusChange}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSearchParams({});
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 mr-2"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Bulk Actions */}
      {selectedDocuments.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-yellow-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {selectedDocuments.length} document(s) selected
              </p>
              <div className="mt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={handleBulkArchive}
                  className="text-sm px-3 py-1 bg-yellow-200 text-yellow-800 rounded-md hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                  Archive Selected
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="text-sm px-3 py-1 bg-red-200 text-red-800 rounded-md hover:bg-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Delete Selected
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDocuments([])}
                  className="text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <i className="fas fa-file-alt text-gray-400 text-5xl mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No documents found
          </h3>
          <p className="text-gray-500">
            No documents match your search criteria or there are no documents
            available.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedDocuments.length === currentDocuments.length
                        }
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentDocuments.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc._id)}
                        onChange={() => handleCheckboxChange(doc._id)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-md">
                          <i
                            className={`fas fa-${getCategoryIcon(
                              doc.category
                            )} text-gray-600`}
                          ></i>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {doc.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {doc.fileName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAccessLevelBadge(doc.accessLevel)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/documents/${doc._id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
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
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Download
                      </a>
                      {doc.status === 'active' && (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (
                              window.confirm(
                                'Are you sure you want to archive this document?'
                              )
                            ) {
                              documentService
                                .archiveDocument(doc._id)
                                .then(() => fetchDocuments())
                                .catch((err) => {
                                  setError('Failed to archive document');
                                  console.error(err);
                                });
                            }
                          }}
                          className="text-yellow-600 hover:text-yellow-900 mr-3"
                        >
                          Archive
                        </a>
                      )}
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (
                            window.confirm(
                              'Are you sure you want to delete this document? This action cannot be undone.'
                            )
                          ) {
                            documentService
                              .deleteDocument(doc._id)
                              .then(() => fetchDocuments())
                              .catch((err) => {
                                setError('Failed to delete document');
                                console.error(err);
                              });
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {indexOfFirstDocument + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastDocument, documents.length)}
                    </span>{' '}
                    of <span className="font-medium">{documents.length}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <i className="fas fa-chevron-left"></i>
                    </button>

                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => paginate(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === i + 1
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentsList;
