import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import financialService from '../../services/financial.service';

interface CollectionData {
  period: string;
  collected: number;
  target: number;
  percentage: number;
}

interface StateCollectionData {
  state: string;
  collected: number;
  outstanding: number;
  pharmacyCount: number;
}

const CollectionReports: React.FC = () => {
  const [collectionData, setCollectionData] = useState<CollectionData[]>([]);
  const [stateData, setStateData] = useState<StateCollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewType, setViewType] = useState<'monthly' | 'quarterly' | 'yearly'>(
    'monthly'
  );

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const processCollectionData = useCallback(
    (analytics: Record<string, unknown>): CollectionData[] => {
      if (viewType === 'monthly') {
        return (
          (analytics.monthlyData as Record<string, unknown>[])?.map(
            (item: Record<string, unknown>, index: number) => ({
              period: (item.month as string) || `Month ${index + 1}`,
              collected: (item.amount as number) || 0,
              target: 500000, // Mock target
              percentage: (((item.amount as number) || 0) / 500000) * 100,
            })
          ) || []
        );
      } else if (viewType === 'quarterly') {
        // Mock quarterly data
        return [
          {
            period: 'Q1',
            collected: 1500000,
            target: 1500000,
            percentage: 100,
          },
          {
            period: 'Q2',
            collected: 1800000,
            target: 1500000,
            percentage: 120,
          },
          { period: 'Q3', collected: 1200000, target: 1500000, percentage: 80 },
          {
            period: 'Q4',
            collected: 1600000,
            target: 1500000,
            percentage: 107,
          },
        ];
      } else {
        // Yearly data
        return years.map((year) => ({
          period: year.toString(),
          collected: Math.floor(Math.random() * 5000000) + 3000000,
          target: 6000000,
          percentage: Math.floor(Math.random() * 40) + 60,
        }));
      }
    },
    [viewType, years]
  );

  const fetchCollectionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch analytics data
      const analytics = await financialService.getDueAnalytics(selectedYear);

      // Process collection data based on view type
      const processedData = processCollectionData(analytics);
      setCollectionData(processedData);

      // Mock state-wise data for now
      const mockStateData: StateCollectionData[] = [
        {
          state: 'Lagos',
          collected: 2500000,
          outstanding: 500000,
          pharmacyCount: 150,
        },
        {
          state: 'Abuja',
          collected: 1800000,
          outstanding: 300000,
          pharmacyCount: 85,
        },
        {
          state: 'Kano',
          collected: 1200000,
          outstanding: 400000,
          pharmacyCount: 70,
        },
        {
          state: 'Rivers',
          collected: 1000000,
          outstanding: 200000,
          pharmacyCount: 60,
        },
        {
          state: 'Oyo',
          collected: 800000,
          outstanding: 250000,
          pharmacyCount: 55,
        },
      ];
      setStateData(mockStateData);
    } catch (err) {
      setError('Failed to fetch collection data');
      console.error('Error fetching collection data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, processCollectionData]);

  useEffect(() => {
    fetchCollectionData();
  }, [fetchCollectionData]);

  const exportReport = () => {
    const csvContent = [
      ['Collection Reports Summary'],
      ['Year:', selectedYear.toString()],
      ['View Type:', viewType],
      [''],
      ['Period-wise Collections'],
      ['Period', 'Collected', 'Target', 'Percentage'],
      ...collectionData.map((item) => [
        item.period,
        `₦${item.collected.toLocaleString()}`,
        `₦${item.target.toLocaleString()}`,
        `${item.percentage.toFixed(1)}%`,
      ]),
      [''],
      ['State-wise Collections'],
      ['State', 'Collected', 'Outstanding', 'Pharmacy Count'],
      ...stateData.map((item) => [
        item.state,
        `₦${item.collected.toLocaleString()}`,
        `₦${item.outstanding.toLocaleString()}`,
        item.pharmacyCount.toString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-reports-${selectedYear}-${viewType}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalCollected = collectionData.reduce(
    (sum, item) => sum + item.collected,
    0
  );
  const totalTarget = collectionData.reduce(
    (sum, item) => sum + item.target,
    0
  );
  const overallPercentage =
    totalTarget > 0 ? (totalCollected / totalTarget) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchCollectionData}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Collection Reports</h1>
        <button
          onClick={exportReport}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            View Type
          </label>
          <select
            value={viewType}
            onChange={(e) =>
              setViewType(e.target.value as 'monthly' | 'quarterly' | 'yearly')
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Collected</h3>
          <p className="text-2xl font-bold text-green-600">
            ₦{totalCollected.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Target</h3>
          <p className="text-2xl font-bold text-blue-600">
            ₦{totalTarget.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Achievement Rate
          </h3>
          <p className="text-2xl font-bold text-purple-600">
            {overallPercentage.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active States</h3>
          <p className="text-2xl font-bold text-gray-900">{stateData.length}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collection vs Target Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Collection vs Target ({viewType})
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={collectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis
                tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `₦${value.toLocaleString()}`,
                  name === 'collected' ? 'Collected' : 'Target',
                ]}
              />
              <Legend />
              <Bar dataKey="collected" fill="#10b981" name="collected" />
              <Bar dataKey="target" fill="#3b82f6" name="target" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Achievement Percentage Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Achievement Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={collectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toFixed(1)}%`,
                  'Achievement',
                ]}
              />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#8b5cf6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* State-wise Collections */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            State-wise Collections
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="state" />
              <YAxis
                tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `₦${value.toLocaleString()}`,
                  name === 'collected' ? 'Collected' : 'Outstanding',
                ]}
              />
              <Legend />
              <Bar dataKey="collected" fill="#10b981" name="collected" />
              <Bar dataKey="outstanding" fill="#f59e0b" name="outstanding" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* State-wise Details Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            State-wise Collection Details
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outstanding
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pharmacies
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collection Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stateData.map((state) => {
                const total = state.collected + state.outstanding;
                const rate = total > 0 ? (state.collected / total) * 100 : 0;

                return (
                  <tr key={state.state}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {state.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      ₦{state.collected.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                      ₦{state.outstanding.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {state.pharmacyCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${Math.min(rate, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CollectionReports;
