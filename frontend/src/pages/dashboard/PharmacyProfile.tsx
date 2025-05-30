import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import pharmacyService from '../../services/pharmacy.service';
import type { Pharmacy } from '../../types/pharmacy.types';
import { useTheme } from '../../context/ThemeContext';

const PharmacyProfile: React.FC = () => {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchPharmacy = async () => {
      try {
        setLoading(true);
        const data = await pharmacyService.getPharmacyByUser();
        setPharmacy(data);
      } catch (err) {
        setError('Failed to load pharmacy profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacy();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <i className="fas fa-circle-notch fa-spin text-3xl"></i>
          </div>
          <p className="mt-2 text-muted-foreground">
            Loading pharmacy profile...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-destructive/15 border-l-4 border-destructive/20 text-destructive p-4"
        role="alert"
      >
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <div className="mt-4">
          <button
            onClick={() => window.location.reload()}
            className="text-destructive hover:text-destructive/80 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <div className="bg-card rounded-lg shadow p-6">
            <i className="fas fa-store text-muted-foreground text-5xl mb-4"></i>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No Pharmacy Profile Found
            </h2>
            <p className="text-muted-foreground mb-6">
              You haven't registered a pharmacy yet. Create a pharmacy profile
              to manage your pharmacy details.
            </p>
            <Link
              to="/my-pharmacy/create"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <i className="fas fa-plus-circle mr-2"></i>
              Register Pharmacy
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Pharmacy Profile</h1>
        <Link
          to="/my-pharmacy/edit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <i className="fas fa-edit mr-2"></i>
          Edit Profile
        </Link>
      </div>

      {/* Approval Status */}
      {pharmacy.registrationStatus === 'pending' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-yellow-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Awaiting Approval:</strong> Your pharmacy profile is
                pending approval by the administrator. Some features may be
                limited until your pharmacy is approved.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg shadow overflow-hidden">
        {/* Pharmacy Header */}
        <div className="p-6 bg-primary/10 border-b border-border">
          <div className="flex flex-col md:flex-row">
            <div className="flex-shrink-0 flex items-center justify-center h-24 w-24 rounded-full bg-primary/20 text-primary text-3xl mb-4 md:mb-0">
              <i className="fas fa-store"></i>
            </div>
            <div className="md:ml-6">
              <h2 className="text-2xl font-semibold text-foreground">
                {pharmacy.name}
              </h2>
              <p className="text-muted-foreground mt-1">{pharmacy.address}</p>
              <p className="text-muted-foreground">
                {pharmacy.landmark}, {pharmacy.townArea}
              </p>
              <div className="mt-2">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    pharmacy.registrationStatus === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
                  }`}
                >
                  {pharmacy.registrationStatus === 'active'
                    ? 'Active'
                    : 'Inactive'}
                </span>
                <span
                  className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    pharmacy.registrationStatus === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                  }`}
                >
                  {pharmacy.registrationStatus === 'active'
                    ? 'Approved'
                    : 'Pending Approval'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pharmacy Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Registration Details
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground block">
                    Registration Number
                  </span>
                  <span className="text-foreground">
                    {pharmacy.registrationNumber}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground block">
                    PCN License Number
                  </span>
                  <span className="text-foreground">{pharmacy.pcnLicense}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground block">
                    License Expiry Date
                  </span>
                  <span className="text-foreground">
                    {formatDate(pharmacy.licenseExpiryDate)}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground block">
                    Director
                  </span>
                  <span className="text-foreground">
                    {pharmacy.directorName}
                  </span>
                </div>
                {pharmacy.superintendentName && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground block">
                      Superintendent Pharmacist
                    </span>
                    <span className="text-foreground">
                      {pharmacy.superintendentName}
                    </span>
                  </div>
                )}
                {pharmacy.superintendentLicenseNumber && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground block">
                      Superintendent License Number
                    </span>
                    <span className="text-foreground">
                      {pharmacy.superintendentLicenseNumber}
                    </span>
                  </div>
                )}
                {pharmacy.numberOfStaff !== undefined && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground block">
                      Staff Count
                    </span>
                    <span className="text-foreground">
                      {pharmacy.numberOfStaff}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground block">
                    Phone Number
                  </span>
                  <span className="text-foreground">{pharmacy.phone}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground block">
                    Email
                  </span>
                  <span className="text-foreground">{pharmacy.email}</span>
                </div>
                {pharmacy.websiteUrl && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground block">
                      Website
                    </span>
                    <a
                      href={pharmacy.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      {pharmacy.websiteUrl}
                    </a>
                  </div>
                )}
                {pharmacy.socialMedia && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground block mb-1">
                      Social Media
                    </span>
                    <div className="flex space-x-2">
                      {pharmacy.socialMedia.facebookUrl && (
                        <a
                          href={pharmacy.socialMedia.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <i className="fab fa-facebook-square text-xl"></i>
                        </a>
                      )}
                      {pharmacy.socialMedia.twitterUrl && (
                        <a
                          href={pharmacy.socialMedia.twitterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-600"
                        >
                          <i className="fab fa-twitter-square text-xl"></i>
                        </a>
                      )}
                      {pharmacy.socialMedia.instagramUrl && (
                        <a
                          href={pharmacy.socialMedia.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:text-pink-800"
                        >
                          <i className="fab fa-instagram-square text-xl"></i>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(pharmacy.yearEstablished ||
            pharmacy.operatingHours ||
            (pharmacy.servicesOffered &&
              pharmacy.servicesOffered.length > 0)) && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pharmacy.yearEstablished && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground block">
                      Established Year
                    </span>
                    <span className="text-foreground">
                      {pharmacy.yearEstablished}
                    </span>
                  </div>
                )}
                {pharmacy.operatingHours && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground block">
                      Operating Hours
                    </span>
                    <span className="text-foreground">
                      {pharmacy.operatingHours}
                    </span>
                  </div>
                )}
                {pharmacy.servicesOffered &&
                  pharmacy.servicesOffered.length > 0 && (
                    <div className="col-span-1 md:col-span-2">
                      <span className="text-sm font-medium text-muted-foreground block mb-2">
                        Services Offered
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {pharmacy.servicesOffered.map((service, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/my-documents"
          className="bg-card rounded-lg shadow p-6 flex flex-col items-center text-center hover:bg-muted/50 transition duration-200"
        >
          <i className="fas fa-file-alt text-primary text-3xl mb-3"></i>
          <h3 className="text-lg font-medium text-foreground mb-1">
            My Documents
          </h3>
          <p className="text-muted-foreground text-sm">
            Access and manage pharmacy-related documents
          </p>
        </Link>

        <Link
          to="/payments"
          className="bg-card rounded-lg shadow p-6 flex flex-col items-center text-center hover:bg-muted/50 transition duration-200"
        >
          <i className="fas fa-credit-card text-green-500 text-3xl mb-3"></i>
          <h3 className="text-lg font-medium text-foreground mb-1">
            Dues & Payments
          </h3>
          <p className="text-muted-foreground text-sm">
            View and pay outstanding dues
          </p>
        </Link>

        <Link
          to="/events"
          className="bg-card rounded-lg shadow p-6 flex flex-col items-center text-center hover:bg-muted/50 transition duration-200"
        >
          <i className="fas fa-calendar-alt text-orange-500 text-3xl mb-3"></i>
          <h3 className="text-lg font-medium text-foreground mb-1">Events</h3>
          <p className="text-muted-foreground text-sm">
            Register for upcoming events and trainings
          </p>
        </Link>
      </div>
    </div>
  );
};

export default PharmacyProfile;
