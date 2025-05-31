import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import financialService from '../../services/financial.service';
import type { Donation } from '../../types/financial.types';

const DonationsManagement = () => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await financialService.getDonations();
      setDonations(data);
    } catch (err) {
      console.error('Error fetching donations:', err);
      setError('Failed to load donations data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Donations Management
        </h1>
        <button
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm shadow"
          onClick={() => navigate('/finances/donations/new')}
        >
          <i className="fas fa-plus mr-2"></i>
          New Donation
        </button>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 mb-6 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-card rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-6 animate-pulse space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        ) : donations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mb-4 text-muted-foreground">
              <i className="fas fa-hand-holding-heart text-5xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">No donations yet</h3>
            <p className="text-muted-foreground mb-4">
              Start recording donations to keep track of all contributions.
            </p>
            <button
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm shadow"
              onClick={() => navigate('/finances/donations/new')}
            >
              <i className="fas fa-plus mr-2"></i>
              Record New Donation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {donations.map((donation) => (
                  <tr
                    key={donation._id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() =>
                      navigate(`/finances/donations/${donation._id}`)
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {donation.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {donation.donor.name}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({donation.donor.type})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(donation.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(donation.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          donation.status === 'approved'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : donation.status === 'pending'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}
                      >
                        {donation.status && typeof donation.status === 'string'
                          ? donation.status.charAt(0).toUpperCase() +
                            donation.status.slice(1)
                          : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-primary hover:text-primary/80 mr-3 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/finances/donations/${donation._id}`);
                        }}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/finances/donations/${donation._id}/edit`);
                        }}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonationsManagement;
