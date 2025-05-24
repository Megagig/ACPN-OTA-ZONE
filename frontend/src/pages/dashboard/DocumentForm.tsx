import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import documentService from '../../services/document.service';
import type {
  DocumentCategory,
  DocumentAccessLevel,
} from '../../types/document.types';

const DocumentForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other' as DocumentCategory,
    accessLevel: 'members' as DocumentAccessLevel,
    tags: '',
    expirationDate: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create form data for file upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('category', formData.category);
      uploadFormData.append('accessLevel', formData.accessLevel);

      if (formData.tags) {
        uploadFormData.append('tags', formData.tags);
      }

      if (formData.expirationDate) {
        uploadFormData.append('expirationDate', formData.expirationDate);
      }

      // Upload document
      const result = await documentService.uploadDocument(uploadFormData);

      setSuccess(true);

      // Redirect to document detail after a short delay
      setTimeout(() => {
        navigate(`/documents/${result._id}`);
      }, 1500);
    } catch (err) {
      setError('Failed to upload document. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories: DocumentCategory[] = [
    'policy',
    'form',
    'report',
    'newsletter',
    'minutes',
    'guideline',
    'other',
  ];
  const accessLevels: DocumentAccessLevel[] = [
    'public',
    'members',
    'committee',
    'executives',
    'admin',
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            to="/documents/list"
            className="text-indigo-600 hover:text-indigo-800 mb-2 inline-block"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Documents
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Upload New Document
          </h1>
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
            Document uploaded successfully. Redirecting to document details...
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Document Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter document title"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter document description"
              ></textarea>
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category*
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="accessLevel"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Access Level*
              </label>
              <select
                id="accessLevel"
                name="accessLevel"
                value={formData.accessLevel}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {accessLevels.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter tags separated by commas"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate tags with commas (e.g. policy, financial, annual)
              </p>
            </div>

            <div>
              <label
                htmlFor="expirationDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Expiration Date (Optional)
              </label>
              <input
                type="date"
                id="expirationDate"
                name="expirationDate"
                value={formData.expirationDate}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
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
                          PDF, Word, Excel, PowerPoint or image files up to 10MB
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
          </div>

          <div className="mt-8 flex justify-end">
            <Link
              to="/documents/list"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 mr-4"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || success}
              className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                loading || success ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
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
                  Upload Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentForm;
