import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import pharmacyService from '../../services/pharmacy.service';
import type {
  PharmacyFormData,
  Pharmacy,
  SocialMediaLinks,
} from '../../types/pharmacy.types';

const PharmacyForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  const initialFormData: PharmacyFormData = {
    name: '',
    email: '',
    phone: '',
    yearEstablished: undefined,
    address: '', // Street Address
    landmark: '',
    townArea: '',
    pcnLicense: '', // "Previous Pharmacy License Number"
    licenseExpiryDate: '',
    numberOfStaff: undefined,
    superintendentName: '',
    superintendentLicenseNumber: '',
    superintendentPhoto: undefined,
    superintendentPhone: '',
    directorName: '',
    directorPhoto: undefined,
    directorPhone: '',
    operatingHours: '',
    websiteUrl: '',
    socialMedia: {
      facebookUrl: '',
      twitterUrl: '',
      instagramUrl: '',
    },
    servicesOffered: [],
  };

  const [formData, setFormData] = useState<PharmacyFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentService, setCurrentService] = useState('');

  // DEBUG: Log formData state
  console.log('DEBUG: PharmacyForm formData state:', formData);
  // DEBUG: Log isEditMode
  console.log('DEBUG: PharmacyForm isEditMode:', isEditMode);

  const handleAddService = () => {
    if (
      currentService.trim() !== '' &&
      !formData.servicesOffered?.includes(currentService.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        servicesOffered: [
          ...(prev.servicesOffered || []),
          currentService.trim(),
        ],
      }));
      setCurrentService('');
    }
  };

  const handleRemoveService = (serviceToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      servicesOffered: prev.servicesOffered?.filter(
        (service) => service !== serviceToRemove
      ),
    }));
  };

  const fetchPharmacyData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const pharmacy: Pharmacy = await pharmacyService.getPharmacy(id);

      const formatDateForInput = (dateString?: string | Date): string => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0]; // YYYY-MM-DD
        } catch {
          // Error during date parsing, return empty string. No need to use the error object.
          return '';
        }
      };

      setFormData({
        name: pharmacy.name || '',
        email: pharmacy.email || '',
        phone: pharmacy.phone || '',
        yearEstablished: pharmacy.yearEstablished,
        address: pharmacy.address || '',
        landmark: pharmacy.landmark || '',
        townArea: pharmacy.townArea || '',
        pcnLicense: pharmacy.pcnLicense || '',
        licenseExpiryDate: formatDateForInput(pharmacy.licenseExpiryDate),
        numberOfStaff: pharmacy.numberOfStaff,
        superintendentName: pharmacy.superintendentName || '',
        superintendentLicenseNumber: pharmacy.superintendentLicenseNumber || '',
        superintendentPhone: pharmacy.superintendentPhone || '',
        directorName: pharmacy.directorName || '',
        directorPhone: pharmacy.directorPhone || '',
        operatingHours: pharmacy.operatingHours || '',
        websiteUrl: pharmacy.websiteUrl || '',
        socialMedia: {
          facebookUrl: pharmacy.socialMedia?.facebookUrl || '',
          twitterUrl: pharmacy.socialMedia?.twitterUrl || '',
          instagramUrl: pharmacy.socialMedia?.instagramUrl || '',
        },
        servicesOffered: pharmacy.servicesOffered || [],
        // Keep photo fields as undefined initially, they will show current if available via URL string
        superintendentPhoto: pharmacy.superintendentPhoto || undefined,
        directorPhoto: pharmacy.directorPhoto || undefined,
      });
      setLoading(false);
    } catch (err) {
      let errorMessage = 'Failed to load pharmacy data';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode) {
      fetchPharmacyData();
    }
  }, [isEditMode, fetchPharmacyData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name.startsWith('socialMedia.')) {
      const socialKey = name.split('.')[1] as keyof SocialMediaLinks;
      setFormData((prev) => ({
        ...prev,
        socialMedia: {
          ...(prev.socialMedia || {}),
          [socialKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSuccess('');
    setError('');

    const data = new FormData();

    // Iterate through formData and add to FormData object
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'socialMedia' && value !== undefined && value !== null) {
        // Convert socialMedia to a JSON string to maintain its structure
        data.append('socialMedia', JSON.stringify(value));
      } else if (key === 'servicesOffered' && Array.isArray(value)) {
        value.forEach((service, index) => {
          data.append(`servicesOffered[${index}]`, service);
        });
      } else if (value !== undefined && value !== null) {
        if (typeof value === 'number') {
          data.append(key, String(value));
        } else {
          data.append(key, value as string);
        }
      }
    });

    try {
      if (isEditMode) {
        await pharmacyService.updatePharmacy(id!, data);
        setSuccess('Pharmacy updated successfully');
      } else {
        await pharmacyService.createPharmacy(data);
        setSuccess('Pharmacy created successfully');
        navigate('/dashboard/pharmacies');
      }
    } catch (err) {
      let displayMessage = 'Failed to save pharmacy';
      let consoleDetails = err;
      if (err instanceof Error) {
        consoleDetails = err.message;
      }
      setError(displayMessage);
      console.error('Submission error:', consoleDetails);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {isEditMode ? 'Edit Pharmacy' : 'Add New Pharmacy'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isEditMode
              ? 'Update the pharmacy information below.'
              : 'Fill out the form below to register a new pharmacy.'}
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            type="button"
            onClick={() => navigate('/admin/pharmacies-management')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to List
          </button>
        </div>
      </div>

      {/* DEBUG: Simple text to confirm this part renders */}
      <p className="text-red-500 font-bold p-4">
        DEBUG: FORM RENDERING TEST POINT 1
      </p>

      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-6 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-8 bg-white shadow-sm rounded-lg p-6 divide-y divide-gray-200"
      >
        {/* Section 1: Basic Information */}
        <div className="space-y-6 pt-8 sm:space-y-5 sm:pt-10">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Basic Information
            </h3>
          </div>
          <div className="space-y-6 sm:space-y-5">
            {/* Pharmacy Name */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Pharmacy Name<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            {/* Email Address */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Email Address<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            {/* Phone Number */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Phone Number<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            {/* Year Established */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="yearEstablished"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Year Established
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="number"
                  name="yearEstablished"
                  id="yearEstablished"
                  value={formData.yearEstablished || ''}
                  onChange={handleChange}
                  className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Section 2: Address Information */}
        <div className="space-y-6 pt-8 sm:space-y-5 sm:pt-10">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Address Information
            </h3>
          </div>
          <div className="space-y-6 sm:space-y-5">
            {/* Street Address */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Street Address<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            {/* Landmark */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="landmark"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Landmark<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="text"
                  name="landmark"
                  id="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  required
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            {/* Town/Area */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="townArea"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Town/Area<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="text"
                  name="townArea"
                  id="townArea"
                  value={formData.townArea}
                  onChange={handleChange}
                  required
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Section 3: Registration Information */}
        <div className="space-y-6 pt-8 sm:space-y-5 sm:pt-10">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Registration & Personnel
            </h3>
          </div>
          <div className="space-y-6 sm:space-y-5">
            {/* PCN License Number */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="pcnLicense"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Previous Pharmacy License Number
                <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="text"
                  name="pcnLicense"
                  id="pcnLicense"
                  value={formData.pcnLicense}
                  onChange={handleChange}
                  required
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            {/* License Expiry Date */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="licenseExpiryDate"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                License Expiry Date<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="date"
                  name="licenseExpiryDate"
                  id="licenseExpiryDate"
                  value={formData.licenseExpiryDate}
                  onChange={handleChange}
                  required
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            {/* Number of Staff */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="numberOfStaff"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Number of Staff
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="number"
                  name="numberOfStaff"
                  id="numberOfStaff"
                  value={formData.numberOfStaff || ''}
                  onChange={handleChange}
                  className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            {/* Superintendent Pharmacist Name */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="superintendentName"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Superintendent Pharmacist Name
                <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="text"
                  name="superintendentName"
                  id="superintendentName"
                  value={formData.superintendentName}
                  onChange={handleChange}
                  required
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            {/* Superintendent License Number */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="superintendentLicenseNumber"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Superintendent License Number
                <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="text"
                  name="superintendentLicenseNumber"
                  id="superintendentLicenseNumber"
                  value={formData.superintendentLicenseNumber}
                  onChange={handleChange}
                  required
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            {/* Superintendent Picture */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="superintendentPhoto"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Superintendent Picture<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="file"
                  name="superintendentPhoto"
                  id="superintendentPhoto"
                  onChange={handleFileChange}
                  accept="image/*"
                  required={
                    !isEditMode ||
                    !(
                      typeof formData.superintendentPhoto === 'string' &&
                      formData.superintendentPhoto
                    )
                  }
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {isEditMode &&
                  typeof formData.superintendentPhoto === 'string' &&
                  formData.superintendentPhoto && (
                    <p className="mt-2 text-sm text-gray-500">
                      Current photo:{' '}
                      <a
                        href={formData.superintendentPhoto}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        View
                      </a>{' '}
                      (Upload new to replace)
                    </p>
                  )}
              </div>
            </div>
            {/* Superintendent Phone */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="superintendentPhone"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Superintendent Phone<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="tel"
                  name="superintendentPhone"
                  id="superintendentPhone"
                  value={formData.superintendentPhone}
                  onChange={handleChange}
                  required
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            {/* Pharmacy Director Name */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="directorName"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Pharmacy Director Name<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="text"
                  name="directorName"
                  id="directorName"
                  value={formData.directorName}
                  onChange={handleChange}
                  required
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            {/* Pharmacy Director Picture */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="directorPhoto"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Pharmacy Director Picture<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="file"
                  name="directorPhoto"
                  id="directorPhoto"
                  onChange={handleFileChange}
                  accept="image/*"
                  required={
                    !isEditMode ||
                    !(
                      typeof formData.directorPhoto === 'string' &&
                      formData.directorPhoto
                    )
                  }
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {isEditMode &&
                  typeof formData.directorPhoto === 'string' &&
                  formData.directorPhoto && (
                    <p className="mt-2 text-sm text-gray-500">
                      Current photo:{' '}
                      <a
                        href={formData.directorPhoto}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        View
                      </a>{' '}
                      (Upload new to replace)
                    </p>
                  )}
              </div>
            </div>
            {/* Pharmacy Director Phone */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="directorPhone"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Pharmacy Director Phone<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="tel"
                  name="directorPhone"
                  id="directorPhone"
                  value={formData.directorPhone}
                  onChange={handleChange}
                  required
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Section 4: Additional Information (Optional) */}
        <div className="space-y-6 pt-8 sm:space-y-5 sm:pt-10">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Additional Information (Optional)
            </h3>
          </div>
          <div className="space-y-6 sm:space-y-5">
            {/* Operating Hours */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="operatingHours"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Operating Hours
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="text"
                  name="operatingHours"
                  id="operatingHours"
                  value={formData.operatingHours || ''}
                  onChange={handleChange}
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            {/* Website URL */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label
                htmlFor="websiteUrl"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Website URL
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="url"
                  name="websiteUrl"
                  id="websiteUrl"
                  value={formData.websiteUrl || ''}
                  onChange={handleChange}
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            {/* Social Media Links */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                Social Media
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0 space-y-2">
                <input
                  type="url"
                  name="socialMedia.facebookUrl"
                  placeholder="Facebook URL"
                  value={formData.socialMedia?.facebookUrl || ''}
                  onChange={handleChange}
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <input
                  type="url"
                  name="socialMedia.twitterUrl"
                  placeholder="Twitter URL"
                  value={formData.socialMedia?.twitterUrl || ''}
                  onChange={handleChange}
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <input
                  type="url"
                  name="socialMedia.instagramUrl"
                  placeholder="Instagram URL"
                  value={formData.socialMedia?.instagramUrl || ''}
                  onChange={handleChange}
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            {/* Services Offered */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
              <label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                Services Offered
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="flex">
                  <input
                    type="text"
                    value={currentService}
                    onChange={(e) => setCurrentService(e.target.value)}
                    className="block w-full max-w-lg rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Add a service (e.g., Prescription Dispensing, Consultations)"
                  />
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="rounded-r-md border border-l-0 border-gray-300 px-4 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.servicesOffered?.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                    >
                      <span className="text-sm">{service}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(service)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/pharmacies-management')}
              className="mr-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading || (isEditMode && loading)}
              className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {submitLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : isEditMode ? (
                'Update Pharmacy'
              ) : (
                'Create Pharmacy'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PharmacyForm;
