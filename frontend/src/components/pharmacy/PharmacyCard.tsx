import React from 'react';
import { Link } from 'react-router-dom';
import type { Pharmacy } from '../../types/pharmacy.types';

interface PharmacyCardProps {
  pharmacy: Pharmacy;
  showControls?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onApprove?: (id: string) => void;
}

const PharmacyCard: React.FC<PharmacyCardProps> = ({
  pharmacy,
  showControls = false,
  onEdit,
  onDelete,
  onApprove,
}) => {
  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) onEdit(pharmacy._id);
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) onDelete(pharmacy._id);
  };

  const handleApprove = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onApprove) onApprove(pharmacy._id);
  };

  return (
    <div className="bg-card overflow-hidden shadow rounded-lg transition hover:shadow-md">
      {/* Card Header */}
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 truncate">
            <h3 className="text-lg font-medium text-foreground truncate">
              {pharmacy.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {pharmacy.address}, {pharmacy.townArea}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            {(() => {
              switch (pharmacy.registrationStatus) {
                case 'active':
                  return (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      Active
                    </span>
                  );
                case 'pending':
                  return (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                      Pending
                    </span>
                  );
                case 'expired':
                  return (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                      Expired
                    </span>
                  );
                case 'suspended':
                  return (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300">
                      Suspended
                    </span>
                  );
                default:
                  return null;
              }
            })()}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="border-t border-border px-4 py-4 sm:px-6">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <dt className="text-xs font-medium text-muted-foreground">
              Registration Number
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {pharmacy.registrationNumber}
            </dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-xs font-medium text-muted-foreground">
              License Expiry
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {new Date(pharmacy.licenseExpiryDate).toLocaleDateString()}
            </dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-xs font-medium text-muted-foreground">
              Contact
            </dt>
            <dd className="mt-1 text-sm text-foreground">{pharmacy.phone}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-xs font-medium text-muted-foreground">
              Status
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  pharmacy.registrationStatus === 'active'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : pharmacy.registrationStatus === 'pending'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    : pharmacy.registrationStatus === 'expired'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
                }`}
              >
                {pharmacy.registrationStatus.charAt(0).toUpperCase() +
                  pharmacy.registrationStatus.slice(1)}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* Card Footer */}
      <div className="bg-muted/50 px-4 py-4 sm:px-6">
        <div className="flex justify-between items-center">
          <Link
            to={`/pharmacies/${pharmacy._id}`}
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            View Details
          </Link>

          {showControls && (
            <div className="flex space-x-2">
              {pharmacy.registrationStatus === 'pending' && (
                <button
                  onClick={handleApprove}
                  className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                >
                  Approve
                </button>
              )}
              <button
                onClick={handleEdit}
                className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacyCard;
