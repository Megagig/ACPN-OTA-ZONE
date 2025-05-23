import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import pharmacyService from '../../services/pharmacy.service';
import { PharmacyFormData, Pharmacy } from '../../types/pharmacy.types';
import { useAuth } from '../../context/AuthContext';

const PharmacyForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = location.pathname.includes('/edit');

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
    staffCount: undefined,
    phone: '',
    email: '',
    establishedYear: undefined,
    services: [],
    operatingHours: '',
    website: '',
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
    },
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [fetchLoading, setFetchLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [serviceInput, setServiceInput] = useState<string>('');

  useEffect(() => {
    if (isEdit) {
      fetchPharmacy();
    }
  }, [isEdit]);

  const fetchPharmacy = async () => {
    try {
      setFetchLoading(true);
      const data = await pharmacyService.getPharmacyByUser();

      if (data) {
        // Transform Pharmacy object to PharmacyFormData
        setFormData({
          name: data.name,
          address: data.address,
          city: data.city,
          state: data.state,
          registrationNumber: data.registrationNumber,
          licenseNumber: data.licenseNumber,
          licenseExpiryDate: data.licenseExpiryDate
            ? data.licenseExpiryDate.split('T')[0]
            : '',
          superintendentPharmacist: data.superintendentPharmacist || '',
          superintendentLicenseNumber: data.superintendentLicenseNumber || '',
          staffCount: data.staffCount,
          phone: data.phone,
          email: data.email,
          establishedYear: data.additionalInfo?.establishedYear,
          services: data.additionalInfo?.services || [],
          operatingHours: data.additionalInfo?.operatingHours || '',
          website: data.additionalInfo?.website || '',
          socialMedia: {
            facebook: data.additionalInfo?.socialMedia?.facebook || '',
            twitter: data.additionalInfo?.socialMedia?.twitter || '',
            instagram: data.additionalInfo?.socialMedia?.instagram || '',
          },
        });
      }
    } catch (err) {
      setError('Failed to load pharmacy data');
      console.error(err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

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
    } else if (type === 'number') {
      // Handle number inputs
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? undefined : Number(value),
      }));
    } else {
      // Handle regular inputs
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleServiceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServiceInput(e.target.value);
  };

  const addService = () => {
    if (
      serviceInput.trim() !== '' &&
      !formData.services?.includes(serviceInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        services: [...(prev.services || []), serviceInput.trim()],
      }));
      setServiceInput('');
    }
  };

  const removeService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services?.filter((s) => s !== service) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (isEdit) {
        // Update existing pharmacy
        await pharmacyService.updatePharmacy(formData._id!, formData);
        setSuccess(true);

        // Redirect to profile after a short delay
        setTimeout(() => {
          navigate('/my-pharmacy');
        }, 1500);
      } else {
        // Create new pharmacy
        await pharmacyService.createPharmacy(formData);
        setSuccess(true);

        // Redirect to profile after a short delay
        setTimeout(() => {
          navigate('/my-pharmacy');
        }, 1500);
      }
    } catch (err) {
      setError(
        `Failed to ${
          isEdit ? 'update' : 'create'
        } pharmacy profile. Please try again.`
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner-border text-indigo-500" role="status">
            <i className="fas fa-circle-notch fa-spin text-3xl"></i>
          </div>
          <p className="mt-2 text-gray-600">Loading pharmacy data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            to="/my-pharmacy"
            className="text-indigo-600 hover:text-indigo-800 mb-2 inline-block"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Pharmacy Profile
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Edit Pharmacy Profile' : 'Register New Pharmacy'}
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
            Pharmacy profile {isEdit ? 'updated' : 'created'} successfully.
            Redirecting to profile...
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pharmacy Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter pharmacy name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number*
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label
                  htmlFor="establishedYear"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Year Established
                </label>
                <input
                  type="number"
                  id="establishedYear"
                  name="establishedYear"
                  value={formData.establishedYear || ''}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter year established"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Address Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Street Address*
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter street address"
                />
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  City*
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  State*
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter state"
                />
              </div>
            </div>
          </div>

          {/* Registration Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Registration Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="registrationNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Registration Number*
                </label>
                <input
                  type="text"
                  id="registrationNumber"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter registration number"
                />
              </div>

              <div>
                <label
                  htmlFor="licenseNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  License Number*
                </label>
                <input
                  type="text"
                  id="licenseNumber"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter license number"
                />
              </div>

              <div>
                <label
                  htmlFor="licenseExpiryDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  License Expiry Date*
                </label>
                <input
                  type="date"
                  id="licenseExpiryDate"
                  name="licenseExpiryDate"
                  value={formData.licenseExpiryDate}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="staffCount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Number of Staff
                </label>
                <input
                  type="number"
                  id="staffCount"
                  name="staffCount"
                  value={formData.staffCount || ''}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter number of staff"
                />
              </div>

              <div>
                <label
                  htmlFor="superintendentPharmacist"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Superintendent Pharmacist
                </label>
                <input
                  type="text"
                  id="superintendentPharmacist"
                  name="superintendentPharmacist"
                  value={formData.superintendentPharmacist || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter superintendent pharmacist name"
                />
              </div>

              <div>
                <label
                  htmlFor="superintendentLicenseNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Superintendent License Number
                </label>
                <input
                  type="text"
                  id="superintendentLicenseNumber"
                  name="superintendentLicenseNumber"
                  value={formData.superintendentLicenseNumber || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter superintendent license number"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Additional Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="operatingHours"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Operating Hours
                </label>
                <input
                  type="text"
                  id="operatingHours"
                  name="operatingHours"
                  value={formData.operatingHours || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="E.g., Mon-Fri: 8AM-6PM, Sat: 9AM-3PM"
                />
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter website URL"
                />
              </div>

              <div>
                <label
                  htmlFor="socialMedia.facebook"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Facebook Page
                </label>
                <input
                  type="url"
                  id="socialMedia.facebook"
                  name="socialMedia.facebook"
                  value={formData.socialMedia?.facebook || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter Facebook page URL"
                />
              </div>

              <div>
                <label
                  htmlFor="socialMedia.twitter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Twitter Profile
                </label>
                <input
                  type="url"
                  id="socialMedia.twitter"
                  name="socialMedia.twitter"
                  value={formData.socialMedia?.twitter || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter Twitter profile URL"
                />
              </div>

              <div>
                <label
                  htmlFor="socialMedia.instagram"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Instagram Profile
                </label>
                <input
                  type="url"
                  id="socialMedia.instagram"
                  name="socialMedia.instagram"
                  value={formData.socialMedia?.instagram || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter Instagram profile URL"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Services Offered
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={serviceInput}
                    onChange={handleServiceInputChange}
                    className="flex-1 rounded-l-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Add a service (e.g., Prescription Dispensing, Consultations)"
                  />
                  <button
                    type="button"
                    onClick={addService}
                    className="rounded-r-md border border-l-0 border-gray-300 px-4 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.services?.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                    >
                      <span className="text-sm">{service}</span>
                      <button
                        type="button"
                        onClick={() => removeService(service)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <i className="fas fa-times-circle"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Link
              to="/my-pharmacy"
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
                  Saving...
                </>
              ) : success ? (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Saved
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  {isEdit ? 'Update Pharmacy' : 'Register Pharmacy'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PharmacyForm;
