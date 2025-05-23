import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import pharmacyService from '../../services/pharmacy.service';
import { PharmacyFormData } from '../../types/pharmacy.types';

const PharmacyForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<PharmacyFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    registrationNumber: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    superintendentPharmacist: '',
    superintendentLicenseNumber: '',
    staffCount: 0,
    phone: '',
    email: '',
    establishedYear: new Date().getFullYear(),
    services: [],
    operatingHours: '',
    website: '',
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // List of available pharmacy services
  const availableServices = [
    'Prescription Filling',
    'Over-the-Counter Medicine',
    'Health Consultation',
    'Blood Pressure Monitoring',
    'Glucose Testing',
    'Vaccination',
    'Health Screening',
    'Medicine Delivery',
    'Wellness Products',
    'First Aid',
    'Chronic Disease Management',
    'Home Healthcare',
    'Electronic Prescription',
    'Compounding',
    'Medical Equipment',
  ];

  useEffect(() => {
    if (isEditMode) {
      fetchPharmacyData();
    }
  }, [id]);

  const fetchPharmacyData = async () => {
    try {
      setLoading(true);
      const pharmacy = await pharmacyService.getPharmacy(id!);

      // Format the data for the form
      setFormData({
        name: pharmacy.name,
        address: pharmacy.address,
        city: pharmacy.city,
        state: pharmacy.state,
        registrationNumber: pharmacy.registrationNumber,
        licenseNumber: pharmacy.licenseNumber,
        licenseExpiryDate: pharmacy.licenseExpiryDate.split('T')[0], // Format date for input
        superintendentPharmacist: pharmacy.superintendentPharmacist || '',
        superintendentLicenseNumber: pharmacy.superintendentLicenseNumber || '',
        staffCount: pharmacy.staffCount || 0,
        phone: pharmacy.phone,
        email: pharmacy.email,
        establishedYear:
          pharmacy.additionalInfo?.establishedYear || new Date().getFullYear(),
        services: pharmacy.additionalInfo?.services || [],
        operatingHours: pharmacy.additionalInfo?.operatingHours || '',
        website: pharmacy.additionalInfo?.website || '',
        socialMedia: {
          facebook: pharmacy.additionalInfo?.socialMedia?.facebook || '',
          twitter: pharmacy.additionalInfo?.socialMedia?.twitter || '',
          instagram: pharmacy.additionalInfo?.socialMedia?.instagram || '',
        },
      });

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load pharmacy data');
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      // Handle nested objects like socialMedia.facebook
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof PharmacyFormData],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    if (checked) {
      setFormData((prev) => ({
        ...prev,
        services: [...(prev.services || []), value],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        services: (prev.services || []).filter((service) => service !== value),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isEditMode) {
        await pharmacyService.updatePharmacy(id!, formData);
        setSuccess('Pharmacy updated successfully');
      } else {
        await pharmacyService.createPharmacy(formData);
        setSuccess('Pharmacy created successfully');
        // Clear form after successful creation
        if (!isEditMode) {
          setFormData({
            name: '',
            address: '',
            city: '',
            state: '',
            registrationNumber: '',
            licenseNumber: '',
            licenseExpiryDate: '',
            superintendentPharmacist: '',
            superintendentLicenseNumber: '',
            staffCount: 0,
            phone: '',
            email: '',
            establishedYear: new Date().getFullYear(),
            services: [],
            operatingHours: '',
            website: '',
            socialMedia: {
              facebook: '',
              twitter: '',
              instagram: '',
            },
          });
        }
      }

      // Redirect back to pharmacy list after a delay
      setTimeout(() => {
        navigate('/pharmacies');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save pharmacy');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
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
            onClick={() => navigate('/pharmacies')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to List
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
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
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
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
        className="mt-6 space-y-6 bg-white shadow-sm rounded-lg p-6"
      >
        <div className="space-y-6 sm:space-y-5">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Basic Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Pharmacy identification details.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-5">
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
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
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Address<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="text"
                  name="address"
                  id="address"
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                City<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="text"
                  name="city"
                  id="city"
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="state"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                State<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <select
                  id="state"
                  name="state"
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
                  value={formData.state}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a state</option>
                  <option value="Ogun">Ogun</option>
                  <option value="Lagos">Lagos</option>
                  <option value="Oyo">Oyo</option>
                  <option value="Ondo">Ondo</option>
                  <option value="Osun">Osun</option>
                  <option value="Ekiti">Ekiti</option>
                  <option value="FCT">FCT</option>
                </select>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
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
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
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
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-5 pt-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Licensing Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Pharmacy registration and licensing details.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-5">
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="registrationNumber"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Registration Number<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="text"
                  name="registrationNumber"
                  id="registrationNumber"
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="licenseNumber"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                License Number<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="text"
                  name="licenseNumber"
                  id="licenseNumber"
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
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
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
                  value={formData.licenseExpiryDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="superintendentPharmacist"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Superintendent Pharmacist
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="text"
                  name="superintendentPharmacist"
                  id="superintendentPharmacist"
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
                  value={formData.superintendentPharmacist}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="superintendentLicenseNumber"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Superintendent License Number
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="text"
                  name="superintendentLicenseNumber"
                  id="superintendentLicenseNumber"
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
                  value={formData.superintendentLicenseNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="staffCount"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Number of Staff
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="number"
                  name="staffCount"
                  id="staffCount"
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
                  value={formData.staffCount || ''}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-5 pt-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Additional Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Optional details about the pharmacy.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-5">
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="establishedYear"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Established Year
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="number"
                  name="establishedYear"
                  id="establishedYear"
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
                  value={formData.establishedYear || new Date().getFullYear()}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="services"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Services Offered
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <fieldset>
                  <legend className="sr-only">Services</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2">
                    {availableServices.map((service) => (
                      <div className="relative flex items-start" key={service}>
                        <div className="flex items-center h-5">
                          <input
                            id={`service-${service}`}
                            name="services"
                            type="checkbox"
                            value={service}
                            checked={(formData.services || []).includes(
                              service
                            )}
                            onChange={handleServiceChange}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor={`service-${service}`}
                            className="font-medium text-gray-700"
                          >
                            {service}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </fieldset>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
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
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.operatingHours || ''}
                  onChange={handleChange}
                  placeholder="E.g., Mon-Fri: 8am-6pm, Sat: 9am-3pm"
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="website"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Website
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="url"
                  name="website"
                  id="website"
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.website || ''}
                  onChange={handleChange}
                  placeholder="https://www.example.com"
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="socialMedia.facebook"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Facebook
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="url"
                  name="socialMedia.facebook"
                  id="socialMedia.facebook"
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.socialMedia?.facebook || ''}
                  onChange={handleChange}
                  placeholder="https://facebook.com/yourpharmacy"
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="socialMedia.twitter"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Twitter
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="url"
                  name="socialMedia.twitter"
                  id="socialMedia.twitter"
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.socialMedia?.twitter || ''}
                  onChange={handleChange}
                  placeholder="https://twitter.com/yourpharmacy"
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="socialMedia.instagram"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Instagram
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <input
                  type="url"
                  name="socialMedia.instagram"
                  id="socialMedia.instagram"
                  className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.socialMedia?.instagram || ''}
                  onChange={handleChange}
                  placeholder="https://instagram.com/yourpharmacy"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/pharmacies')}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
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
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PharmacyForm;
