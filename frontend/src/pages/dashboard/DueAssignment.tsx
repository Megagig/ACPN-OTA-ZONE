import React, { useState, useEffect } from 'react';
import type { DueType } from '../../types/pharmacy.types';
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
  businessName: string;
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
      // This would need to be implemented in the financial service
      // For now, we'll use a placeholder
      const response = await fetch('/api/pharmacies', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPharmacies(data.data || []);
      }
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
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
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
      pharmacy.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.registrationNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      `${pharmacy.owner.firstName} ${pharmacy.owner.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const selectedDueType = dueTypes.find((dt) => dt._id === formData.dueTypeId);

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
                        {pharmacy.businessName} - {pharmacy.registrationNumber}{' '}
                        ({pharmacy.owner.firstName} {pharmacy.owner.lastName})
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
                      {dueType.name} - ₦{dueType.defaultAmount.toLocaleString()}
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
                  value={
                    formData.amount || selectedDueType?.defaultAmount || ''
                  }
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
                    {selectedDueType.defaultAmount.toLocaleString()}
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
                      ?.businessName || 'Not selected'}
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
                    ₦{formData.amount.toLocaleString()}
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
