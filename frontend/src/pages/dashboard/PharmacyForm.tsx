import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import pharmacyService from '../../services/pharmacy.service';
import type { PharmacyFormData } from '../../types/pharmacy.types';
import { useTheme } from '../../context/ThemeContext';

const PharmacyForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = location.pathname.includes('/edit');
  const { theme } = useTheme();

  const initialFormData: PharmacyFormData = {
    name: '',
    email: '',
    phone: '',
    yearEstablished: undefined,
    address: '',
    landmark: '',
    townArea: '',
    pcnLicense: '',
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentService, setCurrentService] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (isEdit) {
        try {
          setLoading(true);
          const data = await pharmacyService.getPharmacyByUser();
          if (data) {
            setFormData({
              ...data,
              superintendentPhoto: data.superintendentPhoto || undefined,
              directorPhoto: data.directorPhoto || undefined,
            });
          }
        } catch (err) {
          setError('Failed to load pharmacy data');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [isEdit]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (name.startsWith('socialMedia.')) {
      const [, key] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        socialMedia: {
          ...(prev.socialMedia || {}),
          [key]: value,
        },
      }));
      return;
    }

    if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? undefined : Number(value),
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    }
  };

  const handleAddService = () => {
    if (
      currentService.trim() &&
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
      servicesOffered:
        prev.servicesOffered?.filter(
          (service) => service !== serviceToRemove
        ) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();

      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'superintendentPhoto' || key === 'directorPhoto') {
          if (value instanceof File) {
            formDataToSend.append(key, value);
          }
        } else if (key === 'socialMedia' && value) {
          formDataToSend.append(key, JSON.stringify(value));
        } else if (key === 'servicesOffered' && Array.isArray(value)) {
          formDataToSend.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          formDataToSend.append(key, String(value));
        }
      });

      if (isEdit && formData._id) {
        await pharmacyService.updatePharmacy(formData._id, formDataToSend);
      } else {
        await pharmacyService.createPharmacy(formDataToSend);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/my-pharmacy');
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save pharmacy');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            to="/my-pharmacy"
            className="text-primary hover:text-primary/80 mb-2 inline-block"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Pharmacy Profile
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? 'Edit Pharmacy Profile' : 'Register New Pharmacy'}
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 border-l-4 border-destructive/20 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-destructive"
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
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-200 dark:border-green-800 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-500 dark:text-green-400"
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
              <p className="text-sm text-green-700 dark:text-green-400">
                Pharmacy successfully {isEdit ? 'updated' : 'created'}!
                Redirecting...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg shadow border border-border p-6">
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Pharmacy Name<span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email Address<span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phone Number<span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Year Established
                </label>
                <input
                  type="number"
                  name="yearEstablished"
                  value={formData.yearEstablished || ''}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Address Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Street Address<span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Landmark<span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Town/Area<span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="townArea"
                  value={formData.townArea}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>

          {/* Registration & Personnel */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Registration & Personnel
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  PCN License Number<span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="pcnLicense"
                  value={formData.pcnLicense}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  License Expiry Date<span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  name="licenseExpiryDate"
                  value={formData.licenseExpiryDate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Number of Staff
                </label>
                <input
                  type="number"
                  name="numberOfStaff"
                  value={formData.numberOfStaff || ''}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Superintendent Name<span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="superintendentName"
                  value={formData.superintendentName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Superintendent License Number
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="superintendentLicenseNumber"
                  value={formData.superintendentLicenseNumber}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Superintendent Photo
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="file"
                  name="superintendentPhoto"
                  onChange={handleFileChange}
                  accept="image/*"
                  required={!isEdit || !formData.superintendentPhoto}
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Superintendent Phone
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  name="superintendentPhone"
                  value={formData.superintendentPhone}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Director Name<span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="directorName"
                  value={formData.directorName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Director Photo<span className="text-destructive">*</span>
                </label>
                <input
                  type="file"
                  name="directorPhoto"
                  onChange={handleFileChange}
                  accept="image/*"
                  required={!isEdit || !formData.directorPhoto}
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Director Phone<span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  name="directorPhone"
                  value={formData.directorPhone}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Additional Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Operating Hours
                </label>
                <input
                  type="text"
                  name="operatingHours"
                  value={formData.operatingHours}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                  placeholder="e.g., Mon-Fri: 9am-5pm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Social Media Links
                </label>
                <input
                  type="url"
                  name="socialMedia.facebookUrl"
                  value={formData.socialMedia?.facebookUrl}
                  onChange={handleChange}
                  placeholder="Facebook URL"
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
                <input
                  type="url"
                  name="socialMedia.twitterUrl"
                  value={formData.socialMedia?.twitterUrl}
                  onChange={handleChange}
                  placeholder="Twitter URL"
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
                <input
                  type="url"
                  name="socialMedia.instagramUrl"
                  value={formData.socialMedia?.instagramUrl}
                  onChange={handleChange}
                  placeholder="Instagram URL"
                  className="w-full rounded-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Services Offered
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentService}
                    onChange={(e) => setCurrentService(e.target.value)}
                    className="flex-1 rounded-l-md border border-input bg-background text-foreground shadow-sm px-4 py-2 focus:outline-none focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                    placeholder="Add a service"
                  />
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-r-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.servicesOffered?.map((service, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center bg-muted/50 rounded-full px-3 py-1"
                    >
                      <span className="text-sm text-foreground">{service}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(service)}
                        className="ml-2 text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Link
              to="/my-pharmacy"
              className="px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
            >
              {loading
                ? 'Saving...'
                : isEdit
                ? 'Update Pharmacy'
                : 'Create Pharmacy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PharmacyForm;
