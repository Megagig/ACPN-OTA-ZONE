import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import financialService from '../../services/financial.service';
import type { Donation } from '../../types/financial.types';

const DonationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<Partial<Donation>>({
    title: '',
    description: '',
    amount: 0,
    donor: {
      name: '',
      email: '',
      phone: '',
      type: 'individual',
    },
    purpose: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    status: 'pending',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) {
      fetchDonation();
    }
  }, [id]);

  const fetchDonation = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const donation = await financialService.getDonationById(id);
      // Format date to YYYY-MM-DD for input[type="date"]
      const formattedDate = new Date(donation.date).toISOString().split('T')[0];

      setFormData({
        ...donation,
        date: formattedDate,
      });
    } catch (err) {
      console.error('Error fetching donation:', err);
      setError('Failed to load donation data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      // Handle nested properties (for donor object)
      const [parent, child] = name.split('.');

      // Create safe copy of the parent object with proper typing
      const parentObj =
        (formData[parent as keyof typeof formData] as Record<string, any>) ||
        {};

      setFormData({
        ...formData,
        [parent]: {
          ...parentObj,
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: name === 'amount' ? parseFloat(value) || 0 : value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isEditMode && id) {
        await financialService.updateDonation(id, formData);
        setSuccessMessage('Donation updated successfully!');
      } else {
        await financialService.createDonation(formData);
        setSuccessMessage('Donation created successfully!');
        // Reset form if creating new donation
        if (!isEditMode) {
          setFormData({
            title: '',
            description: '',
            amount: 0,
            donor: {
              name: '',
              email: '',
              phone: '',
              type: 'individual',
            },
            purpose: '',
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'cash',
            status: 'pending',
          });
        }
      }

      // Redirect after successful submission with a short delay
      setTimeout(() => {
        navigate('/finances/donations');
      }, 1500);
    } catch (err) {
      console.error('Error saving donation:', err);
      setError('Failed to save donation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {isEditMode ? 'Edit Donation' : 'Record New Donation'}
        </h1>
        <button
          className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-md text-sm"
          onClick={() => navigate('/finances/donations')}
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Donations
        </button>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 mb-6 rounded-md">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-4 mb-6 rounded-md">
          {successMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-lg shadow-md p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-border pb-2 mb-4">
              Donation Information
            </h2>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                required
                className="w-full border border-border rounded-md p-2 bg-background text-foreground"
                placeholder="Donation Title"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3}
                className="w-full border border-border rounded-md p-2 bg-background text-foreground"
                placeholder="Brief description of the donation"
              />
            </div>

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Amount (₦)*
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount || ''}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full border border-border rounded-md p-2 bg-background text-foreground"
                placeholder="0.00"
              />
            </div>

            <div>
              <label
                htmlFor="purpose"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Purpose
              </label>
              <input
                type="text"
                id="purpose"
                name="purpose"
                value={formData.purpose || ''}
                onChange={handleChange}
                className="w-full border border-border rounded-md p-2 bg-background text-foreground"
                placeholder="Purpose of donation"
              />
            </div>

            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Date*
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date || ''}
                onChange={handleChange}
                required
                className="w-full border border-border rounded-md p-2 bg-background text-foreground"
              />
            </div>

            <div>
              <label
                htmlFor="paymentMethod"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Payment Method*
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod || 'cash'}
                onChange={handleChange}
                required
                className="w-full border border-border rounded-md p-2 bg-background text-foreground"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="card">Card</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="online_payment">Online Payment</option>
                <option value="other">Other</option>
              </select>
            </div>

            {isEditMode && (
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Status*
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status || 'pending'}
                  onChange={handleChange}
                  required
                  className="w-full border border-border rounded-md p-2 bg-background text-foreground"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            )}
          </div>

          {/* Donor Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-border pb-2 mb-4">
              Donor Information
            </h2>

            <div>
              <label
                htmlFor="donor.type"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Donor Type*
              </label>
              <select
                id="donor.type"
                name="donor.type"
                value={formData.donor?.type || 'individual'}
                onChange={handleChange}
                required
                className="w-full border border-border rounded-md p-2 bg-background text-foreground"
              >
                <option value="member">Member</option>
                <option value="organization">Organization</option>
                <option value="individual">Individual</option>
                <option value="anonymous">Anonymous</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="donor.name"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Donor Name*
              </label>
              <input
                type="text"
                id="donor.name"
                name="donor.name"
                value={formData.donor?.name || ''}
                onChange={handleChange}
                required={formData.donor?.type !== 'anonymous'}
                disabled={formData.donor?.type === 'anonymous'}
                className="w-full border border-border rounded-md p-2 bg-background text-foreground"
                placeholder="Donor name"
              />
            </div>

            <div>
              <label
                htmlFor="donor.email"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Donor Email
              </label>
              <input
                type="email"
                id="donor.email"
                name="donor.email"
                value={formData.donor?.email || ''}
                onChange={handleChange}
                disabled={formData.donor?.type === 'anonymous'}
                className="w-full border border-border rounded-md p-2 bg-background text-foreground"
                placeholder="Donor email address"
              />
            </div>

            <div>
              <label
                htmlFor="donor.phone"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Donor Phone
              </label>
              <input
                type="tel"
                id="donor.phone"
                name="donor.phone"
                value={formData.donor?.phone || ''}
                onChange={handleChange}
                disabled={formData.donor?.type === 'anonymous'}
                className="w-full border border-border rounded-md p-2 bg-background text-foreground"
                placeholder="Donor phone number"
              />
            </div>

            <div className="pt-8">
              <label
                htmlFor="attachments"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Attachments (Coming soon)
              </label>
              <div className="border border-dashed border-border rounded-md p-6 flex flex-col items-center justify-center text-center">
                <i className="fas fa-file-upload text-3xl mb-2 text-muted-foreground"></i>
                <p className="text-sm text-muted-foreground mb-1">
                  Drag and drop files here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported file types: PDF, JPG, PNG (max 5MB each)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-md"
            onClick={() => navigate('/finances/donations')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-md"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                {isEditMode ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>{isEditMode ? 'Update Donation' : 'Save Donation'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Export the component
export default DonationForm;
