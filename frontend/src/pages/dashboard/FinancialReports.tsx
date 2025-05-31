import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import financialService from '../../services/financial.service';
import type { FinancialReport } from '../../types/financial.types';

const FinancialReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState('yearly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    fetchReports();
  }, [reportType, year, month, startDate, endDate]);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await financialService.getFinancialReports();
      setReports(data);
    } catch (err) {
      console.error('Error fetching financial reports:', err);
      setError('Failed to load reports data. Please try again.');
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

  // Generate years for dropdown
  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  // Generate months for dropdown
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // Format date
  const formatDate = (dateString: string | Date) => {
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
          Financial Reports
        </h1>
        <div className="flex space-x-2">
          <button
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm shadow"
            onClick={() => window.print()}
          >
            <i className="fas fa-print mr-2"></i>
            Print Report
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm shadow"
            onClick={() => alert('Export feature coming soon!')}
          >
            <i className="fas fa-file-export mr-2"></i>
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 mb-6 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-card rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Report Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Report Type
            </label>
            <select
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="yearly">Yearly Report</option>
              <option value="monthly">Monthly Report</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {reportType === 'yearly' && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Year
              </label>
              <select
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'monthly' && (
            <>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Year
                </label>
                <select
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Month
                </label>
                <select
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {reportType === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-4">
          <button
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm shadow"
            onClick={fetchReports}
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-2">Total Income</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              formatCurrency(12345678) // This would be actual data from API
            )}
          </p>
        </div>
        <div className="bg-card rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              formatCurrency(5678901) // This would be actual data from API
            )}
          </p>
        </div>
        <div className="bg-card rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-2">Net Balance</h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              formatCurrency(6666777) // This would be actual data from API
            )}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Detailed Reports</h2>
        </div>

        {isLoading ? (
          <div className="p-6 animate-pulse space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mb-4 text-muted-foreground">
              <i className="fas fa-chart-line text-5xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">No reports available</h3>
            <p className="text-muted-foreground">
              Try changing the report criteria or date range.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Report Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Generated At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground capitalize">
                      {report.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {report.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {formatCurrency(report.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(report.generatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-primary hover:text-primary/80 mr-3 transition-colors"
                        onClick={() => {
                          // View details logic
                          alert('View details coming soon!');
                        }}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 mr-3 transition-colors"
                        onClick={() => {
                          // Download logic
                          alert('Download feature coming soon!');
                        }}
                      >
                        <i className="fas fa-download"></i>
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

export default FinancialReports;
