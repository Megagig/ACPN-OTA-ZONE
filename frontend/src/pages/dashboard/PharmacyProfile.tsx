import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import pharmacyService from '../../services/pharmacy.service';
import type { Pharmacy } from '../../types/pharmacy.types';
import { useAuth } from '../../context/AuthContext';

const PharmacyProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
          <div className="spinner-border text-indigo-500" role="status">
            <i className="fas fa-circle-notch fa-spin text-3xl"></i>
          </div>
          <p className="mt-2 text-gray-600">Loading pharmacy profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
        role="alert"
      >
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <div className="mt-4">
          <button
            onClick={() => window.location.reload()}
            className="text-red-700 hover:text-red-900 underline"
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
          <div className="bg-white rounded-lg shadow p-6">
            <i className="fas fa-store text-gray-400 text-5xl mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No Pharmacy Profile Found
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't registered a pharmacy yet. Create a pharmacy profile
              to manage your pharmacy details.
            </p>
            <Link
              to="/my-pharmacy/create"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
        <h1 className="text-2xl font-bold text-gray-800">Pharmacy Profile</h1>
        <Link
          to="/my-pharmacy/edit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <i className="fas fa-edit mr-2"></i>
          Edit Profile
        </Link>
      </div>

      {/* Approval Status */}
      {!pharmacy.isApproved && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-yellow-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Awaiting Approval:</strong> Your pharmacy profile is
                pending approval by the administrator. Some features may be
                limited until your pharmacy is approved.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Pharmacy Header */}
        <div className="p-6 bg-indigo-50 border-b border-gray-200">
          <div className="flex flex-col md:flex-row">
            <div className="flex-shrink-0 flex items-center justify-center h-24 w-24 rounded-full bg-indigo-100 text-indigo-600 text-3xl mb-4 md:mb-0">
              <i className="fas fa-store"></i>
            </div>
            <div className="md:ml-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                {pharmacy.name}
              </h2>
              <p className="text-gray-600 mt-1">{pharmacy.address}</p>
              <p className="text-gray-600">
                {pharmacy.city}, {pharmacy.state}
              </p>
              <div className="mt-2">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    pharmacy.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {pharmacy.isActive ? 'Active' : 'Inactive'}
                </span>
                <span
                  className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    pharmacy.isApproved
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {pharmacy.isApproved ? 'Approved' : 'Pending Approval'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pharmacy Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Registration Details
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500 block">
                    Registration Number
                  </span>
                  <span className="text-gray-800">
                    {pharmacy.registrationNumber}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 block">
                    License Number
                  </span>
                  <span className="text-gray-800">
                    {pharmacy.licenseNumber}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 block">
                    License Expiry Date
                  </span>
                  <span className="text-gray-800">
                    {formatDate(pharmacy.licenseExpiryDate)}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 block">
                    Owner
                  </span>
                  <span className="text-gray-800">{pharmacy.ownerName}</span>
                </div>
                {pharmacy.superintendentPharmacist && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">
                      Superintendent Pharmacist
                    </span>
                    <span className="text-gray-800">
                      {pharmacy.superintendentPharmacist}
                    </span>
                  </div>
                )}
                {pharmacy.superintendentLicenseNumber && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">
                      Superintendent License Number
                    </span>
                    <span className="text-gray-800">
                      {pharmacy.superintendentLicenseNumber}
                    </span>
                  </div>
                )}
                {pharmacy.staffCount !== undefined && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">
                      Staff Count
                    </span>
                    <span className="text-gray-800">{pharmacy.staffCount}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500 block">
                    Phone Number
                  </span>
                  <span className="text-gray-800">{pharmacy.phone}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 block">
                    Email
                  </span>
                  <span className="text-gray-800">{pharmacy.email}</span>
                </div>
                {pharmacy.additionalInfo?.website && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">
                      Website
                    </span>
                    <a
                      href={pharmacy.additionalInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {pharmacy.additionalInfo.website}
                    </a>
                  </div>
                )}
                {pharmacy.additionalInfo?.socialMedia && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 block mb-1">
                      Social Media
                    </span>
                    <div className="flex space-x-2">
                      {pharmacy.additionalInfo.socialMedia.facebook && (
                        <a
                          href={pharmacy.additionalInfo.socialMedia.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <i className="fab fa-facebook-square text-xl"></i>
                        </a>
                      )}
                      {pharmacy.additionalInfo.socialMedia.twitter && (
                        <a
                          href={pharmacy.additionalInfo.socialMedia.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-600"
                        >
                          <i className="fab fa-twitter-square text-xl"></i>
                        </a>
                      )}
                      {pharmacy.additionalInfo.socialMedia.instagram && (
                        <a
                          href={pharmacy.additionalInfo.socialMedia.instagram}
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
          {pharmacy.additionalInfo && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pharmacy.additionalInfo.establishedYear && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">
                      Established Year
                    </span>
                    <span className="text-gray-800">
                      {pharmacy.additionalInfo.establishedYear}
                    </span>
                  </div>
                )}
                {pharmacy.additionalInfo.operatingHours && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">
                      Operating Hours
                    </span>
                    <span className="text-gray-800">
                      {pharmacy.additionalInfo.operatingHours}
                    </span>
                  </div>
                )}
                {pharmacy.additionalInfo.services &&
                  pharmacy.additionalInfo.services.length > 0 && (
                    <div className="col-span-1 md:col-span-2">
                      <span className="text-sm font-medium text-gray-500 block mb-2">
                        Services Offered
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {pharmacy.additionalInfo.services.map(
                          (service, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs"
                            >
                              {service}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Location Map */}
          {pharmacy.location && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Location
              </h3>
              <div className="h-64 bg-gray-200 rounded-md">
                {/* In a real app, we would integrate a map component here using the coordinates */}
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">
                    Map would be displayed here using coordinates:{' '}
                    {pharmacy.location.coordinates.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/my-documents"
          className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center hover:bg-gray-50 transition duration-200"
        >
          <i className="fas fa-file-alt text-indigo-500 text-3xl mb-3"></i>
          <h3 className="text-lg font-medium text-gray-800 mb-1">
            My Documents
          </h3>
          <p className="text-gray-600 text-sm">
            Access and manage pharmacy-related documents
          </p>
        </Link>

        <Link
          to="/payments"
          className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center hover:bg-gray-50 transition duration-200"
        >
          <i className="fas fa-credit-card text-green-500 text-3xl mb-3"></i>
          <h3 className="text-lg font-medium text-gray-800 mb-1">
            Dues & Payments
          </h3>
          <p className="text-gray-600 text-sm">View and pay outstanding dues</p>
        </Link>

        <Link
          to="/events"
          className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center hover:bg-gray-50 transition duration-200"
        >
          <i className="fas fa-calendar-alt text-orange-500 text-3xl mb-3"></i>
          <h3 className="text-lg font-medium text-gray-800 mb-1">Events</h3>
          <p className="text-gray-600 text-sm">
            Register for upcoming events and trainings
          </p>
        </Link>
      </div>
    </div>
  );
};

export default PharmacyProfile;
