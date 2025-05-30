import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import pharmacyService from '../../services/pharmacy.service';
import type { Pharmacy } from '../../types/pharmacy.types';
import type { AxiosError } from 'axios';
import { useTheme } from '../../context/ThemeContext';

interface ErrorResponse {
  message?: string;
}

const PharmacyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { theme } = useTheme();

  const fetchPharmacyDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!id) throw new Error('Pharmacy ID is required');
      const data = await pharmacyService.getPharmacy(id);
      setPharmacy(data);
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      setError(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch pharmacy details. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPharmacyDetails();
  }, [fetchPharmacyDetails]);

  const handleApprove = async () => {
    try {
      if (!id) return;
      setError(null);
      await pharmacyService.approvePharmacy(id);
      setSuccessMessage('Pharmacy has been successfully approved!');
      await fetchPharmacyDetails();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      setError(
        error.response?.data?.message ||
          error.message ||
          'Failed to approve pharmacy. Please try again later.'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 py-8 max-w-7xl">
      {/* Error Message */}
      {error && (
        <div className="mb-4">
          <div className="bg-destructive/10 border-l-4 border-destructive p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-circle text-destructive"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4">
          <div className="bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-check-circle text-green-500"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 dark:text-green-300">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!pharmacy ? (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-yellow-500"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Pharmacy not found. The pharmacy may have been deleted or you
                may not have permission to view it.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  to="/admin/pharmacies"
                  className="text-primary hover:text-primary/80 flex items-center mb-4"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back to Pharmacies
                </Link>
                <h1 className="text-2xl font-bold text-foreground">
                  {pharmacy.name}
                </h1>
              </div>
              {pharmacy.registrationStatus !== 'active' && (
                <button
                  onClick={handleApprove}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <i className="fas fa-check mr-2"></i>
                  Approve Pharmacy
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="bg-card shadow overflow-hidden sm:rounded-lg">
            {/* Basic Information */}
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-foreground">
                Basic Information
              </h3>
            </div>
            <div className="border-t border-border px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Registration Number
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {pharmacy.registrationNumber}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Registration Status
                  </dt>
                  <dd className="mt-1 text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        pharmacy.registrationStatus === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      }`}
                    >
                      {pharmacy.registrationStatus.charAt(0).toUpperCase() +
                        pharmacy.registrationStatus.slice(1)}
                    </span>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Email
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {pharmacy.email}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Phone Number
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {pharmacy.phone}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Year Established
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {pharmacy.yearEstablished || 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Location Information */}
            <div className="px-4 py-5 sm:px-6 bg-muted/50">
              <h3 className="text-lg leading-6 font-medium text-foreground">
                Location Information
              </h3>
            </div>
            <div className="border-t border-border px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Address
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {pharmacy.address}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Landmark
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {pharmacy.landmark}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Town/Area
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {pharmacy.townArea}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Registration & Personnel */}
            <div className="px-4 py-5 sm:px-6 bg-muted/50">
              <h3 className="text-lg leading-6 font-medium text-foreground">
                Registration & Personnel
              </h3>
            </div>
            <div className="border-t border-border px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    PCN License Number
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {pharmacy.pcnLicense}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    License Expiry Date
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {new Date(pharmacy.licenseExpiryDate).toLocaleDateString()}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Number of Staff
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {pharmacy.numberOfStaff || 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Personnel Information */}
            <div className="px-4 py-5 sm:px-6 bg-muted/50">
              <h3 className="text-lg leading-6 font-medium text-foreground">
                Personnel Information
              </h3>
            </div>
            <div className="border-t border-border px-4 py-5 sm:px-6">
              <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-8">
                {/* Superintendent Information */}
                <div>
                  <h4 className="text-md font-medium text-foreground mb-4">
                    Superintendent
                  </h4>
                  <dl className="grid grid-cols-1 gap-y-4">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Name
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        {pharmacy.superintendentName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        License Number
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        {pharmacy.superintendentLicenseNumber}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Phone
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        {pharmacy.superintendentPhone}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Photo
                      </dt>
                      <dd className="mt-1">
                        {pharmacy.superintendentPhoto && (
                          <img
                            src={pharmacy.superintendentPhoto}
                            alt="Superintendent"
                            className="h-32 w-32 object-cover rounded-lg"
                          />
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Director Information */}
                <div>
                  <h4 className="text-md font-medium text-foreground mb-4">
                    Director
                  </h4>
                  <dl className="grid grid-cols-1 gap-y-4">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Name
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        {pharmacy.directorName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Phone
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        {pharmacy.directorPhone}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Photo
                      </dt>
                      <dd className="mt-1">
                        {pharmacy.directorPhoto && (
                          <img
                            src={pharmacy.directorPhoto}
                            alt="Director"
                            className="h-32 w-32 object-cover rounded-lg"
                          />
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="px-4 py-5 sm:px-6 bg-muted/50">
              <h3 className="text-lg leading-6 font-medium text-foreground">
                Additional Information
              </h3>
            </div>
            <div className="border-t border-border px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Operating Hours
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {pharmacy.operatingHours || 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Website
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {pharmacy.websiteUrl ? (
                      <a
                        href={pharmacy.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        {pharmacy.websiteUrl}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </dd>
                </div>
                {pharmacy.socialMedia && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground mb-2">
                      Social Media
                    </dt>
                    <dd className="mt-1 space-y-2">
                      {pharmacy.socialMedia.facebookUrl && (
                        <div className="flex items-center">
                          <i className="fab fa-facebook text-blue-600 w-6"></i>
                          <a
                            href={pharmacy.socialMedia.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:text-primary/80 ml-2"
                          >
                            {pharmacy.socialMedia.facebookUrl}
                          </a>
                        </div>
                      )}
                      {pharmacy.socialMedia.twitterUrl && (
                        <div className="flex items-center">
                          <i className="fab fa-twitter text-blue-400 w-6"></i>
                          <a
                            href={pharmacy.socialMedia.twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:text-primary/80 ml-2"
                          >
                            {pharmacy.socialMedia.twitterUrl}
                          </a>
                        </div>
                      )}
                      {pharmacy.socialMedia.instagramUrl && (
                        <div className="flex items-center">
                          <i className="fab fa-instagram text-pink-600 w-6"></i>
                          <a
                            href={pharmacy.socialMedia.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:text-primary/80 ml-2"
                          >
                            {pharmacy.socialMedia.instagramUrl}
                          </a>
                        </div>
                      )}
                    </dd>
                  </div>
                )}
                {pharmacy.servicesOffered &&
                  pharmacy.servicesOffered.length > 0 && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-muted-foreground mb-2">
                        Services Offered
                      </dt>
                      <dd className="mt-1">
                        <div className="flex flex-wrap gap-2">
                          {pharmacy.servicesOffered.map((service, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </dd>
                    </div>
                  )}
              </dl>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PharmacyDetail;
