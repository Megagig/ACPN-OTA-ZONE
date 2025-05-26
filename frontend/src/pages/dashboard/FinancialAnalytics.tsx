import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import financialService from '../../services/financial.service';
import type { PaymentSubmission } from '../../types/pharmacy.types';

interface AnalyticsData {
  monthlyCollections: { month: string; amount: number; count: number }[];
  paymentStatusDistribution: { name: string; value: number; color: string }[];
  dueTypeDistribution: { name: string; amount: number; count: number }[];
  stateWiseCollection: { state: string; amount: number; count: number }[];
  topPayingPharmacies: { name: string; amount: number; payments: number }[];
  collectionTrends: { date: string; cumulative: number; daily: number }[];
}

interface SummaryStats {
  totalCollected: number;
  totalOutstanding: number;
  totalPharmacies: number;
  averagePayment: number;
  collectionRate: number;
  monthlyGrowth: number;
}

const FinancialAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    monthlyCollections: [],
    paymentStatusDistribution: [],
    dueTypeDistribution: [],
    stateWiseCollection: [],
    topPayingPharmacies: [],
    collectionTrends: [],
  });

  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalCollected: 0,
    totalOutstanding: 0,
    totalPharmacies: 0,
    averagePayment: 0,
    collectionRate: 0,
    monthlyGrowth: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [selectedChart, setSelectedChart] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [payments, dues, pharmacies, dueAnalytics] = await Promise.all([
        financialService.getAllPayments({ status: 'all' }),
        financialService.getDues(),
        financialService.getAllPharmacies(),
        financialService.getDueAnalytics(),
      ]);

      const paymentsData = payments.data || [];
      const currentDate = new Date();
      const periodMonths =
        selectedPeriod === '12months'
          ? 12
          : selectedPeriod === '6months'
          ? 6
          : 3;

      // Filter payments based on selected period
      const filteredPayments = paymentsData.filter(
        (payment: PaymentSubmission) => {
          const paymentDate = new Date(payment.submittedAt);
          const monthsAgo = new Date();
          monthsAgo.setMonth(monthsAgo.getMonth() - periodMonths);
          return paymentDate >= monthsAgo;
        }
      );

      // Process analytics data
      const processedData = processAnalyticsData(
        filteredPayments,
        dues,
        pharmacies,
        dueAnalytics
      );
      setAnalyticsData(processedData);

      // Calculate summary stats
      const approvedPayments = filteredPayments.filter(
        (p: PaymentSubmission) => p.status === 'approved'
      );
      const totalCollected = approvedPayments.reduce(
        (sum: number, p: PaymentSubmission) => sum + p.amount,
        0
      );
      const totalOutstanding = dueAnalytics.totalOutstanding || 0;
      const averagePayment =
        approvedPayments.length > 0
          ? totalCollected / approvedPayments.length
          : 0;
      const collectionRate =
        (totalCollected / (totalCollected + totalOutstanding)) * 100;

      setSummaryStats({
        totalCollected,
        totalOutstanding,
        totalPharmacies: pharmacies.length,
        averagePayment,
        collectionRate,
        monthlyGrowth: calculateMonthlyGrowth(approvedPayments),
      });
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (
    payments: PaymentSubmission[],
    dues: any[],
    pharmacies: any[],
    dueAnalytics: any
  ): AnalyticsData => {
    // Monthly collections
    const monthlyData = new Map();
    payments.forEach((payment: PaymentSubmission) => {
      if (payment.status === 'approved') {
        const month = new Date(payment.submittedAt).toLocaleDateString(
          'en-US',
          { year: 'numeric', month: 'short' }
        );
        const existing = monthlyData.get(month) || {
          month,
          amount: 0,
          count: 0,
        };
        monthlyData.set(month, {
          month,
          amount: existing.amount + payment.amount,
          count: existing.count + 1,
        });
      }
    });

    // Payment status distribution
    const statusData = [
      {
        name: 'Approved',
        value: payments.filter((p) => p.status === 'approved').length,
        color: '#10B981',
      },
      {
        name: 'Pending',
        value: payments.filter((p) => p.status === 'pending').length,
        color: '#F59E0B',
      },
      {
        name: 'Rejected',
        value: payments.filter((p) => p.status === 'rejected').length,
        color: '#EF4444',
      },
    ];

    // State-wise collection
    const stateData = new Map();
    payments.forEach((payment: PaymentSubmission) => {
      if (payment.status === 'approved') {
        const pharmacy = pharmacies.find((p) => p._id === payment.pharmacyId);
        const state = pharmacy?.address?.state || 'Unknown';
        const existing = stateData.get(state) || { state, amount: 0, count: 0 };
        stateData.set(state, {
          state,
          amount: existing.amount + payment.amount,
          count: existing.count + 1,
        });
      }
    });

    // Top paying pharmacies
    const pharmacyData = new Map();
    payments.forEach((payment: PaymentSubmission) => {
      if (payment.status === 'approved') {
        const pharmacy = pharmacies.find((p) => p._id === payment.pharmacyId);
        const name = pharmacy?.businessName || 'Unknown';
        const existing = pharmacyData.get(payment.pharmacyId) || {
          name,
          amount: 0,
          payments: 0,
        };
        pharmacyData.set(payment.pharmacyId, {
          name,
          amount: existing.amount + payment.amount,
          payments: existing.payments + 1,
        });
      }
    });

    // Collection trends
    const trendsData = new Map();
    let cumulative = 0;
    payments
      .filter((p) => p.status === 'approved')
      .sort(
        (a, b) =>
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      )
      .forEach((payment: PaymentSubmission) => {
        const date = new Date(payment.submittedAt).toISOString().split('T')[0];
        const existing = trendsData.get(date) || { date, daily: 0 };
        existing.daily += payment.amount;
        cumulative += payment.amount;
        existing.cumulative = cumulative;
        trendsData.set(date, existing);
      });

    return {
      monthlyCollections: Array.from(monthlyData.values()).sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      ),
      paymentStatusDistribution: statusData,
      dueTypeDistribution: [], // TODO: Implement if due type data is available
      stateWiseCollection: Array.from(stateData.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10),
      topPayingPharmacies: Array.from(pharmacyData.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10),
      collectionTrends: Array.from(trendsData.values()).slice(-30), // Last 30 days
    };
  };

  const calculateMonthlyGrowth = (payments: PaymentSubmission[]): number => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const thisMonth = payments
      .filter((p) => {
        const date = new Date(p.submittedAt);
        return (
          date.getMonth() === currentMonth && date.getFullYear() === currentYear
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const lastMonth = payments
      .filter((p) => {
        const date = new Date(p.submittedAt);
        const lastMonthDate = new Date(currentYear, currentMonth - 1);
        return (
          date.getMonth() === lastMonthDate.getMonth() &&
          date.getFullYear() === lastMonthDate.getFullYear()
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);

    return lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-NG').format(num);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Financial Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive financial insights and performance metrics
            </p>
          </div>
          <div className="flex space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
            </select>
            <button
              onClick={fetchAnalyticsData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summaryStats.totalCollected)}
              </p>
              <p className="text-gray-600">Total Collected</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summaryStats.totalOutstanding)}
              </p>
              <p className="text-gray-600">Outstanding</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(summaryStats.totalPharmacies)}
              </p>
              <p className="text-gray-600">Total Pharmacies</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summaryStats.averagePayment)}
              </p>
              <p className="text-gray-600">Average Payment</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {summaryStats.collectionRate.toFixed(1)}%
              </p>
              <p className="text-gray-600">Collection Rate</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-2xl font-bold ${
                  summaryStats.monthlyGrowth >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {summaryStats.monthlyGrowth >= 0 ? '+' : ''}
                {summaryStats.monthlyGrowth.toFixed(1)}%
              </p>
              <p className="text-gray-600">Monthly Growth</p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                summaryStats.monthlyGrowth >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              <svg
                className={`w-6 h-6 ${
                  summaryStats.monthlyGrowth >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={
                    summaryStats.monthlyGrowth >= 0
                      ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                      : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
                  }
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex space-x-4 border-b border-gray-200 pb-4 mb-6">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'trends', label: 'Collection Trends' },
            { key: 'distribution', label: 'Status Distribution' },
            { key: 'geographic', label: 'Geographic Analysis' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedChart(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedChart === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="h-96">
          {selectedChart === 'overview' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.monthlyCollections}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    'Amount',
                  ]}
                />
                <Legend />
                <Bar dataKey="amount" fill="#3B82F6" name="Collection Amount" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {selectedChart === 'trends' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.collectionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    'Amount',
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Cumulative"
                />
                <Line
                  type="monotone"
                  dataKey="daily"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Daily"
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {selectedChart === 'distribution' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.paymentStatusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.paymentStatusDistribution.map(
                    (entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    )
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}

          {selectedChart === 'geographic' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analyticsData.stateWiseCollection}
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <YAxis dataKey="state" type="category" width={100} />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    'Amount',
                  ]}
                />
                <Bar dataKey="amount" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Paying Pharmacies */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Top Paying Pharmacies</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pharmacy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.topPayingPharmacies.map((pharmacy, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {pharmacy.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(pharmacy.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pharmacy.payments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(pharmacy.amount / pharmacy.payments)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalytics;
