import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import documentService from '../../services/document.service';
import { Document } from '../../types/document.types';

const VersionUploadForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [changes, setChanges] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    const fetchDocument = async () => {
      try {
        setLoading(true);
        const doc = await documentService.getDocumentById(id);
        setDocument(doc);
      } catch (err) {
        setError('Failed to load document details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleChangesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChanges(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Create form data for file upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('changes', changes);

      // Upload new version
      await documentService.uploadNewVersion(id, uploadFormData);

      setSuccess(true);

      // Redirect to document detail after a short delay
      setTimeout(() => {
        navigate(`/documents/${id}`);
      }, 1500);
    } catch (err) {
      setError('Failed to upload new version. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
    }
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

  if (error && !document) {
    return (
      <div
        className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
        role="alert"
      >
        <p className="font-bold">Error</p>
        <p>{error}</p>
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

  if (!document) {
    return (
      <div
        className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
        role="alert"
      >
        <p className="font-bold">Error</p>
        <p>Document not found</p>
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            to={`/documents/${id}`}
            className="text-indigo-600 hover:text-indigo-800 mb-2 inline-block"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Document
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Upload New Version
          </h1>
          <p className="text-gray-600">
            Document: <span className="font-medium">{document.title}</span>
          </p>
          <p className="text-gray-600">
            Current Version:{' '}
            <span className="font-medium">v{document.version}</span>
          </p>
        </div>
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

      {success && (
        <div
          className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6"
          role="alert"
        >
          <p className="font-bold">Success!</p>
          <p>
            New version uploaded successfully. Redirecting to document
            details...
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label
                htmlFor="file"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Document File*
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <div className="flex flex-col items-center">
                    {!file ? (
                      <>
                        <i className="fas fa-upload text-gray-400 text-3xl mb-3"></i>
                        <p className="text-gray-500 text-sm">
                          <span className="text-indigo-600 font-medium hover:text-indigo-500 focus:outline-none focus:underline transition duration-150 ease-in-out cursor-pointer">
                            Upload a file
                          </span>{' '}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          File type should match the previous version
                        </p>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-file text-indigo-500 text-3xl mb-2"></i>
                        <p className="text-gray-700 font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {file.size < 1024
                            ? `${file.size} B`
                            : file.size < 1048576
                            ? `${(file.size / 1024).toFixed(1)} KB`
                            : `${(file.size / 1048576).toFixed(1)} MB`}
                        </p>
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="mt-2 text-xs text-red-600 hover:text-red-800"
                        >
                          Remove file
                        </button>
                      </>
                    )}
                  </div>
                  <input
                    id="file"
                    name="file"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    required={!file}
                  />
                </div>
              </div>
              <label
                htmlFor="file"
                className="mt-2 flex justify-center px-4 py-2 w-full border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
              >
                Select File
              </label>
            </div>

            <div>
              <label
                htmlFor="changes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                What has changed in this version?*
              </label>
              <textarea
                id="changes"
                name="changes"
                value={changes}
                onChange={handleChangesChange}
                rows={4}
                required
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe the changes made in this version..."
              ></textarea>
              <p className="mt-1 text-xs text-gray-500">
                This will help users understand what has been updated in this
                version.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Link
              to={`/documents/${id}`}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 mr-4"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={uploading || success}
              className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                uploading || success ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin mr-2"></i>
                  Uploading...
                </>
              ) : success ? (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Uploaded
                </>
              ) : (
                <>
                  <i className="fas fa-upload mr-2"></i>
                  Upload New Version
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VersionUploadForm;
