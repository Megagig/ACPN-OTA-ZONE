import React, { useState, useEffect } from 'react';
import type {
  DueType,
  Pharmacy as PharmacyType,
} from '../../types/pharmacy.types';
import financialService from '../../services/financial.service';

interface FormData {
  pharmacyId: string;
  dueTypeId: string;
  amount: number;
  dueDate: string;
  description: string;
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'annually';
}

interface Pharmacy {
  _id: string;
  name: string; // Changed from businessName to name to match the actual API response
  registrationNumber: string;
  owner: {
    firstName: string;
    lastName: string;
  };
}

const DueAssignment: React.FC = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [dueTypes, setDueTypes] = useState<DueType[]>([]);
  const [formData, setFormData] = useState<FormData>({
    pharmacyId: '',
    dueTypeId: '',
    amount: 0,
    dueDate: '',
    description: '',
    isRecurring: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDueTypes();
    fetchPharmacies();
  }, []);

  const fetchDueTypes = async () => {
    try {
      const response = await financialService.getDueTypes();
      setDueTypes(response);
    } catch (err) {
      console.error('Failed to fetch due types:', err);
      setError('Failed to load due types');
    }
  };

  const fetchPharmacies = async () => {
    try {
      const pharmaciesData = await financialService.getAllPharmacies();

      // Map the API response to match our local Pharmacy interface structure
      const mappedPharmacies = (pharmaciesData || []).map(
        (pharmacy: PharmacyType) => ({
          _id: pharmacy._id,
          name: pharmacy.name || '', // Use name or empty string as fallback
          registrationNumber: pharmacy.registrationNumber || '',
          owner: {
            firstName: pharmacy.superintendentName?.split(' ')[0] || '',
            lastName: pharmacy.superintendentName?.split(' ')[1] || '',
          },
        })
      );

      setPharmacies(mappedPharmacies);
    } catch (err) {
      console.error('Failed to fetch pharmacies:', err);
      setError('Failed to load pharmacies');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : name === 'amount' // Specifically check for the amount field
          ? parseFloat(value) || 0 // Parse to float, fallback to 0 if NaN
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await financialService.assignDue(formData.pharmacyId, {
        dueTypeId: formData.dueTypeId,
        amount: formData.amount,
        dueDate: formData.dueDate,
        description: formData.description,
        isRecurring: formData.isRecurring,
        recurringFrequency: formData.recurringFrequency,
      });

      setSuccess('Due assigned successfully!');
      setFormData({
        pharmacyId: '',
        dueTypeId: '',
        amount: 0,
        dueDate: '',
        description: '',
        isRecurring: false,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to assign due';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredPharmacies = pharmacies.filter(
    (pharmacy) =>
      pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.registrationNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      `${pharmacy.owner.firstName} ${pharmacy.owner.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const selectedDueType = dueTypes.find((dt) => dt._id === formData.dueTypeId);

  // Effect to update amount when dueType changes
  useEffect(() => {
    if (selectedDueType) {
      const newDefaultAmountFromSelectedType =
        Number(selectedDueType.defaultAmount) || 0;
      setFormData((prev) => {
        const isPrevAmountZero = prev.amount === 0;
        const doesPrevAmountMatchAnyDefault = dueTypes.some(
          // Compare prev.amount (number) with dt.defaultAmount (number | undefined)
          // A dueType's defaultAmount might be undefined, in which case it won't match a numeric prev.amount unless prev.amount is also NaN (which it shouldn't be).
          // If dt.defaultAmount is a number, it's a direct comparison.
          (dt) => dt.defaultAmount === prev.amount
        );

        // If current amount is 0, or it matches any known default amount (meaning it was likely auto-set),
        // then update it to the default of the newly selected type.
        if (isPrevAmountZero || doesPrevAmountMatchAnyDefault) {
          // Only update if the amount actually needs to change, to prevent unnecessary re-renders.
          if (prev.amount !== newDefaultAmountFromSelectedType) {
            return { ...prev, amount: newDefaultAmountFromSelectedType };
          }
        }
        // If the amount was manually entered by the user (i.e., it's not 0 and not a known default),
        // do not change it.
        return prev;
      });
    } else {
      // This block executes if no due type is selected (e.g., user clears the selection).
      setFormData((prev) => {
        // Check if the current amount was a default from a previously selected type.
        const isPrevAmountADefault =
          prev.amount !== 0 && // Ensure it's not already zero
          dueTypes.some((dt) => dt.defaultAmount === prev.amount); // And it matches a known default

        if (isPrevAmountADefault) {
          // If so, reset the amount to 0, as there's no longer a selected due type to define it.
          return { ...prev, amount: 0 };
        }
        // Otherwise (e.g., it was 0 already, or a custom user-entered amount), leave it as is.
        return prev;
      });
    }
  }, [selectedDueType, dueTypes]); // Dependencies: effect runs if selectedDueType or dueTypes change.

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assign Due</h1>
        <p className="text-gray-600">
          Assign dues to individual pharmacies with optional recurring settings
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Assignment Form */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Due Assignment Form
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Pharmacy Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Pharmacy *
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Search pharmacies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <select
                    name="pharmacyId"
                    value={formData.pharmacyId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a pharmacy</option>
                    {filteredPharmacies.map((pharmacy) => (
                      <option key={pharmacy._id} value={pharmacy._id}>
                        {pharmacy.name} - {pharmacy.registrationNumber} (
                        {pharmacy.owner.firstName} {pharmacy.owner.lastName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Type *
                </label>
                <select
                  name="dueTypeId"
                  value={formData.dueTypeId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select due type</option>
                  {dueTypes.map((dueType) => (
                    <option key={dueType._id} value={dueType._id}>
                      {dueType.name} - ₦
                      {dueType.defaultAmount?.toLocaleString() || '0'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₦) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount} // formData.amount is now managed as a number
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                />
                {selectedDueType && (
                  <p className="mt-1 text-sm text-gray-500">
                    Default amount: ₦
                    {selectedDueType.defaultAmount?.toLocaleString() || '0'}
                  </p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description for this due assignment"
                />
              </div>

              {/* Recurring Options */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isRecurring"
                    checked={formData.isRecurring}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Make this a recurring due
                  </label>
                </div>

                {formData.isRecurring && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recurring Frequency *
                    </label>
                    <select
                      name="recurringFrequency"
                      value={formData.recurringFrequency || ''}
                      onChange={handleInputChange}
                      required={formData.isRecurring}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select frequency</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  {loading ? 'Assigning Due...' : 'Assign Due'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Assignment Summary
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {formData.pharmacyId && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Pharmacy:</p>
                  <p className="text-sm text-gray-600">
                    {pharmacies.find((p) => p._id === formData.pharmacyId)
                      ?.name || 'Not selected'}
                  </p>
                </div>
              )}

              {selectedDueType && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Due Type:</p>
                  <p className="text-sm text-gray-600">
                    {selectedDueType.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedDueType.description}
                  </p>
                </div>
              )}

              {formData.amount > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Amount:</p>
                  <p className="text-lg font-semibold text-green-600">
                    ₦{Number(formData.amount).toLocaleString()}
                  </p>
                </div>
              )}

              {formData.dueDate && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Due Date:</p>
                  <p className="text-sm text-gray-600">
                    {new Date(formData.dueDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {formData.isRecurring && formData.recurringFrequency && (
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Recurring:
                  </p>
                  <p className="text-sm text-blue-600 capitalize">
                    {formData.recurringFrequency}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Quick Actions
            </h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  (window.location.href = '/dashboard/bulk-assign-dues')
                }
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition duration-200"
              >
                Bulk Assign Dues
              </button>
              <button
                type="button"
                onClick={() => (window.location.href = '/dashboard/due-types')}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition duration-200"
              >
                Manage Due Types
              </button>
              <button
                type="button"
                onClick={() =>
                  (window.location.href = '/dashboard/admin-payment-review')
                }
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition duration-200"
              >
                Review Payments
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DueAssignment;
