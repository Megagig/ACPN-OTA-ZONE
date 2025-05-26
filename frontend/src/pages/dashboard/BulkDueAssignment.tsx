import React, { useState, useEffect } from 'react';
import financialService from '../../services/financial.service';
import type { Pharmacy, DueType } from '../../types/pharmacy.types';

interface BulkAssignmentForm {
  dueTypeId: string;
  amount: number;
  dueDate: string;
  description: string;
  isRecurring: boolean;
  recurringFrequency: 'monthly' | 'quarterly' | 'annually';
  recurringEndDate?: string;
  selectedPharmacies: string[];
  filterCriteria: {
    status: string;
    state: string;
    lga: string;
    registrationYear: string;
  };
}

const BulkDueAssignment: React.FC = () => {
  const [form, setForm] = useState<BulkAssignmentForm>({
    dueTypeId: '',
    amount: 0,
    dueDate: '',
    description: '',
    isRecurring: false,
    recurringFrequency: 'annually',
    selectedPharmacies: [],
    filterCriteria: {
      status: '',
      state: '',
      lga: '',
      registrationYear: '',
    },
  });

  const [dueTypes, setDueTypes] = useState<DueType[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);

  // Unique values for filters
  const [states, setStates] = useState<string[]>([]);
  const [lgas, setLgas] = useState<string[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    // Use a function reference inside useEffect to avoid dependency on filterPharmacies
    const applyFilters = () => {
      let filtered = [...pharmacies];

      if (form.filterCriteria.status) {
        filtered = filtered.filter(
          (p) => p.registrationStatus === form.filterCriteria.status
        );
      }

      if (form.filterCriteria.state) {
        filtered = filtered.filter(
          (p) => p.townArea === form.filterCriteria.state
        );
      }

      if (form.filterCriteria.lga) {
        filtered = filtered.filter(
          (p) => p.landmark === form.filterCriteria.lga
        );
      }

      if (form.filterCriteria.registrationYear) {
        filtered = filtered.filter((p) => {
          const regYear = new Date(p.registrationDate).getFullYear().toString();
          return regYear === form.filterCriteria.registrationYear;
        });
      }

      setFilteredPharmacies(filtered);
    };

    applyFilters();
  }, [form.filterCriteria, pharmacies]);

  useEffect(() => {
    if (selectAll) {
      setForm((prev) => ({
        ...prev,
        selectedPharmacies: filteredPharmacies.map((p) => p._id),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        selectedPharmacies: [],
      }));
    }
  }, [selectAll, filteredPharmacies]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [dueTypesRes, pharmaciesRes] = await Promise.all([
        financialService.getDueTypes(),
        financialService.getAllPharmacies(),
      ]);

      setDueTypes(dueTypesRes);
      setPharmacies(pharmaciesRes);

      // Extract unique areas and town areas (since address is a string, we'll use townArea for filtering)
      const uniqueStates = Array.from(
        new Set(pharmaciesRes.map((p: Pharmacy) => p.townArea).filter(Boolean))
      );
      const uniqueLgas = Array.from(
        new Set(pharmaciesRes.map((p: Pharmacy) => p.landmark).filter(Boolean))
      );

      setStates(uniqueStates);
      setLgas(uniqueLgas);
    } catch {
      // Error is caught but not used
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (
    field: keyof BulkAssignmentForm,
    value: string | number | boolean | string[]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleFilterChange = (
    field: keyof BulkAssignmentForm['filterCriteria'],
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      filterCriteria: { ...prev.filterCriteria, [field]: value },
    }));
  };

  const togglePharmacySelection = (pharmacyId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedPharmacies: prev.selectedPharmacies.includes(pharmacyId)
        ? prev.selectedPharmacies.filter((id) => id !== pharmacyId)
        : [...prev.selectedPharmacies, pharmacyId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.selectedPharmacies.length === 0) {
      setError('Please select at least one pharmacy');
      return;
    }

    if (!form.dueTypeId || !form.amount || !form.dueDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const bulkAssignmentData = {
        dueTypeId: form.dueTypeId,
        amount: form.amount,
        dueDate: form.dueDate,
        description: form.description,
        pharmacyIds: form.selectedPharmacies,
      };

      await financialService.bulkAssignDues(bulkAssignmentData);

      setSuccess(
        `Successfully assigned dues to ${form.selectedPharmacies.length} pharmacies`
      );

      // Reset form
      setForm({
        dueTypeId: '',
        amount: 0,
        dueDate: '',
        description: '',
        isRecurring: false,
        recurringFrequency: 'annually',
        selectedPharmacies: [],
        filterCriteria: {
          status: '',
          state: '',
          lga: '',
          registrationYear: '',
        },
      });
      setSelectAll(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign dues');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Bulk Due Assignment
        </h1>
        <p className="text-gray-600 mt-2">
          Assign dues to multiple pharmacies at once using filters and selection
          criteria
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Due Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Type *
              </label>
              <select
                value={form.dueTypeId}
                onChange={(e) => handleFormChange('dueTypeId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select due type</option>
                {dueTypes.map((type) => (
                  <option key={type._id} value={type._id}>
                    {type.name} - ₦{type.defaultAmount.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₦) *
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) =>
                  handleFormChange('amount', Number(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => handleFormChange('dueDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  handleFormChange('description', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional description"
              />
            </div>
          </div>

          {/* Recurring Options */}
          <div className="mt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) =>
                  handleFormChange('isRecurring', e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">
                Make this a recurring due
              </span>
            </label>

            {form.isRecurring && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={form.recurringFrequency}
                    onChange={(e) =>
                      handleFormChange('recurringFrequency', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={form.recurringEndDate || ''}
                    onChange={(e) =>
                      handleFormChange('recurringEndDate', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pharmacy Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Filter Pharmacies</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Status
              </label>
              <select
                value={form.filterCriteria.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <select
                value={form.filterCriteria.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All States</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LGA
              </label>
              <select
                value={form.filterCriteria.lga}
                onChange={(e) => handleFilterChange('lga', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All LGAs</option>
                {lgas.map((lga) => (
                  <option key={lga} value={lga}>
                    {lga}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Year
              </label>
              <select
                value={form.filterCriteria.registrationYear}
                onChange={(e) =>
                  handleFilterChange('registrationYear', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Years</option>
                {Array.from(
                  new Set(
                    pharmacies.map((p) =>
                      new Date(p.registrationDate).getFullYear()
                    )
                  )
                )
                  .sort((a, b) => b - a)
                  .map((year) => (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pharmacy Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Select Pharmacies ({filteredPharmacies.length} found)
            </h2>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => setSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Select All</span>
            </label>
          </div>

          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              {form.selectedPharmacies.length} of {filteredPharmacies.length}{' '}
              pharmacies selected
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 gap-2 p-4">
              {filteredPharmacies.map((pharmacy) => (
                <label
                  key={pharmacy._id}
                  className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.selectedPharmacies.includes(pharmacy._id)}
                    onChange={() => togglePharmacySelection(pharmacy._id)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {pharmacy.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {pharmacy.townArea}, {pharmacy.landmark}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          pharmacy.registrationStatus === 'active'
                            ? 'bg-green-100 text-green-800'
                            : pharmacy.registrationStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {pharmacy.registrationStatus}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || form.selectedPharmacies.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? 'Assigning...'
              : `Assign to ${form.selectedPharmacies.length} Pharmacies`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BulkDueAssignment;
