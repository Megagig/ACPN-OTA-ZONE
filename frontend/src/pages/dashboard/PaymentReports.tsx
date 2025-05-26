import React, { useState, useEffect, useCallback } from 'react';
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
} from 'recharts';
import financialService from '../../services/financial.service';
import type { Payment } from '../../types/financial.types';

interface PaymentReportData {
  totalPayments: number;
  totalAmount: number;
  approvedPayments: number;
  pendingPayments: number;
  rejectedPayments: number;
  monthlyPayments: Array<{ month: string; count: number; amount: number }>;
  paymentMethods: Array<{ method: string; count: number; amount: number }>;
  stateWisePayments: Array<{ state: string; count: number; amount: number }>;
}

const PaymentReports: React.FC = () => {
  const [reportData, setReportData] = useState<PaymentReportData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  const fetchPaymentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      const response = await financialService.getAllPayments(params);
      const paymentsData = response.payments || [];
      setPayments(paymentsData);

      // Process data for reports
      const processedData = processPaymentData(paymentsData);
      setReportData(processedData);
    } catch (err) {
      setError('Failed to fetch payment data');
      console.error('Error fetching payment data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, selectedStatus]);

  const processPaymentData = (paymentsData: Payment[]): PaymentReportData => {
    const totalPayments = paymentsData.length;
    const totalAmount = paymentsData.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const approvedPayments = paymentsData.filter(
      (p) => p.status === 'approved'
    ).length;
    const pendingPayments = paymentsData.filter(
      (p) => p.status === 'pending'
    ).length;
    const rejectedPayments = paymentsData.filter(
      (p) => p.status === 'rejected'
    ).length;

    // Monthly payments data
    const monthlyData: { [key: string]: { count: number; amount: number } } =
      {};
    paymentsData.forEach((payment) => {
      const month = new Date(payment.paymentDate).toLocaleString('default', {
        month: 'short',
      });
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, amount: 0 };
      }
      monthlyData[month].count++;
      monthlyData[month].amount += payment.amount;
    });

    const monthlyPayments = Object.entries(monthlyData).map(
      ([month, data]) => ({
        month,
        count: data.count,
        amount: data.amount,
      })
    );

    // Mock payment methods and state data for now
    const paymentMethods = [
      {
        method: 'Bank Transfer',
        count: Math.floor(totalPayments * 0.6),
        amount: totalAmount * 0.6,
      },
      {
        method: 'Cash',
        count: Math.floor(totalPayments * 0.25),
        amount: totalAmount * 0.25,
      },
      {
        method: 'Card',
        count: Math.floor(totalPayments * 0.15),
        amount: totalAmount * 0.15,
      },
    ];

    const stateWisePayments = [
      {
        state: 'Lagos',
        count: Math.floor(totalPayments * 0.4),
        amount: totalAmount * 0.4,
      },
      {
        state: 'Abuja',
        count: Math.floor(totalPayments * 0.3),
        amount: totalAmount * 0.3,
      },
      {
        state: 'Kano',
        count: Math.floor(totalPayments * 0.3),
        amount: totalAmount * 0.3,
      },
    ];

    return {
      totalPayments,
      totalAmount,
      approvedPayments,
      pendingPayments,
      rejectedPayments,
      monthlyPayments,
      paymentMethods,
      stateWisePayments,
    };
  };

  const exportReport = () => {
    if (!reportData) return;

    const csvContent = [
      ['Payment Reports Summary'],
      [''],
      ['Total Payments', reportData.totalPayments.toString()],
      ['Total Amount', `₦${reportData.totalAmount.toLocaleString()}`],
      ['Approved Payments', reportData.approvedPayments.toString()],
      ['Pending Payments', reportData.pendingPayments.toString()],
      ['Rejected Payments', reportData.rejectedPayments.toString()],
      [''],
      ['Monthly Breakdown'],
      ['Month', 'Count', 'Amount'],
      ...reportData.monthlyPayments.map((item) => [
        item.month,
        item.count.toString(),
        `₦${item.amount.toLocaleString()}`,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payment-reports.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
          onClick={fetchPaymentData}
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
        <h1 className="text-3xl font-bold text-gray-900">Payment Reports</h1>
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
            Period
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Time</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">
                Total Payments
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.totalPayments}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">
                Total Amount
              </h3>
              <p className="text-2xl font-bold text-green-600">
                ₦{reportData.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Approved</h3>
              <p className="text-2xl font-bold text-green-600">
                {reportData.approvedPayments}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Pending</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {reportData.pendingPayments}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Payments Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Monthly Payments
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.monthlyPayments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === 'amount')
                        return [`₦${value.toLocaleString()}`, 'Amount'];
                      return [value, 'Count'];
                    }}
                  />
                  <Bar dataKey="count" fill="#8884d8" name="count" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Payment Methods Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Payment Methods
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.paymentMethods}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ method, count }) => `${method}: ${count}`}
                  >
                    {reportData.paymentMethods.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* State-wise Payments */}
            <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                State-wise Payments
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.stateWisePayments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="state" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === 'amount')
                        return [`₦${value.toLocaleString()}`, 'Amount'];
                      return [value, 'Count'];
                    }}
                  />
                  <Bar dataKey="amount" fill="#82ca9d" name="amount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Payments Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Payments
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.slice(0, 10).map((payment) => (
                    <tr key={payment._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment._id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₦{payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentReports;
