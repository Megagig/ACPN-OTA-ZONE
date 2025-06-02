import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import financialService from '../../services/financial.service';
import type { DueType, Pharmacy } from '../../types/pharmacy.types';

interface FormData {
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  dueTypeId: string;
  pharmacyId: string;
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'annually';
  isRecurring: boolean;
  year?: number;
  assignmentType?: 'individual' | 'bulk';
  assignedBy?: string;
  assignedAt?: Date;
}

const DueForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dueTypes, setDueTypes] = useState<DueType[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    amount: 0,
    dueDate: '',
    dueTypeId: '',
    pharmacyId: '',
    frequency: 'one-time',
    isRecurring: false,
  });

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
      const response = await financialService.getAllPharmacies();
      setPharmacies(response);
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

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Set year from due date
      const dueYear = new Date(formData.dueDate).getFullYear();

      const dueData = {
        ...formData,
        year: dueYear,
        assignmentType: 'individual' as const,
        assignedAt: new Date(),
        // Convert amount to number
        amount: Number(formData.amount),
      };

      const response = await financialService.assignDue(
        formData.pharmacyId,
        dueData
      );

      if (response) {
        navigate('/finances/dues');
      }
    } catch (err: any) {
      console.error('Error creating due:', err);
      setError(err.message || 'Failed to create due');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Create New Due
        </h1>
        <p className="text-muted-foreground">
          Create a new due for assignment to pharmacies
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-card shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Due Details</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Pharmacy Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Pharmacy *
            </label>
            <select
              name="pharmacyId"
              value={formData.pharmacyId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            >
              <option value="">Select a pharmacy</option>
              {pharmacies.map((pharmacy) => (
                <option key={pharmacy._id} value={pharmacy._id}>
                  {pharmacy.name} ({pharmacy.registrationNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Due Type Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Due Type *
            </label>
            <select
              name="dueTypeId"
              value={formData.dueTypeId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            >
              <option value="">Select a due type</option>
              {dueTypes.map((dueType) => (
                <option key={dueType._id} value={dueType._id}>
                  {dueType.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="Enter due title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="Enter due description"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Amount *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="Enter amount"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Due Date *
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
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
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <label className="ml-2 block text-sm text-foreground">
                Make this a recurring due
              </label>
            </div>

            {formData.isRecurring && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Frequency
                </label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/finances/dues')}
              className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating...' : 'Create Due'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DueForm;
