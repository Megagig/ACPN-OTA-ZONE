import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChartComponent from '../../components/common/ChartComponent';
import StatCard from '../../components/common/StatCard';
import financialService from '../../services/financial.service';
import type {
  FinancialSummary,
  FinancialRecord,
} from '../../types/financial.types';

const FinancialDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<
    FinancialRecord[]
  >([]);
  const [period, setPeriod] = useState<string>('month');

  useEffect(() => {
    const fetchFinancialData = async () => {
      setIsLoading(true);
      try {
        const summaryData = await financialService.getFinancialSummary(period);
        setSummary(summaryData);

        const transactions = await financialService.getFinancialRecords({
          limit: 5,
          sort: '-createdAt',
        });
        setRecentTransactions(transactions);
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancialData();
  }, [period]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  // Prepare chart data
  const getChartData = () => {
    if (!summary) return null;

    return {
      labels: summary.monthlyData.labels,
      datasets: [
        {
          label: 'Income',
          data: summary.monthlyData.income,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'Expenses',
          data: summary.monthlyData.expense,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare category chart data for doughnut charts
  const getIncomeCategoryData = () => {
    if (!summary) return null;

    const labels = Object.keys(summary.incomeByCategory);
    const data = Object.values(summary.incomeByCategory);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            '#4BC0C0',
            '#36A2EB',
            '#FFCE56',
            '#FF6384',
            '#9966FF',
            '#FF9F40',
          ],
          hoverBackgroundColor: [
            '#4BC0C0',
            '#36A2EB',
            '#FFCE56',
            '#FF6384',
            '#9966FF',
            '#FF9F40',
          ],
        },
      ],
    };
  };

  const getExpenseCategoryData = () => {
    if (!summary) return null;

    const labels = Object.keys(summary.expenseByCategory);
    const data = Object.values(summary.expenseByCategory);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
          ],
          hoverBackgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
          ],
        },
      ],
    };
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Financial Overview
        </h1>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <select
            className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground shadow-sm"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm shadow"
            onClick={() => navigate('/finances/transactions')}
          >
            <i className="fas fa-plus mr-2"></i>
            New Transaction
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Income"
          value={isLoading ? '-' : formatCurrency(summary?.totalIncome || 0)}
          icon={<i className="fas fa-arrow-up-right-dots"></i>}
          className="border-l-4 border-green-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Expenses"
          value={isLoading ? '-' : formatCurrency(summary?.totalExpense || 0)}
          icon={<i className="fas fa-arrow-down-right-dots"></i>}
          className="border-l-4 border-red-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Current Balance"
          value={isLoading ? '-' : formatCurrency(summary?.balance || 0)}
          icon={<i className="fas fa-wallet"></i>}
          className="border-l-4 border-blue-500"
          isLoading={isLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Main Chart - Income vs Expenses */}
        <div className="bg-card rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Income vs Expenses
          </h2>
          {isLoading ? (
            <div className="animate-pulse h-64 bg-muted rounded"></div>
          ) : (
            getChartData() && (
              <ChartComponent type="bar" data={getChartData()!} height={300} />
            )
          )}
        </div>

        {/* Category Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Income by Category */}
          <div className="bg-card rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              Income Categories
            </h2>
            {isLoading ? (
              <div className="animate-pulse h-64 bg-muted rounded"></div>
            ) : (
              getIncomeCategoryData() && (
                <ChartComponent
                  type="doughnut"
                  data={getIncomeCategoryData()!}
                  height={200}
                />
              )
            )}
          </div>

          {/* Expenses by Category */}
          <div className="bg-card rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              Expense Categories
            </h2>
            {isLoading ? (
              <div className="animate-pulse h-64 bg-muted rounded"></div>
            ) : (
              getExpenseCategoryData() && (
                <ChartComponent
                  type="doughnut"
                  data={getExpenseCategoryData()!}
                  height={200}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Transactions
          </h2>
          <button
            className="text-primary hover:text-primary/80 text-sm"
            onClick={() => navigate('/finances/transactions')}
          >
            View All
          </button>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-sm text-muted-foreground"
                    >
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((transaction) => (
                    <tr
                      key={transaction._id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() =>
                        navigate(`/finances/transactions/${transaction._id}`)
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {transaction.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === 'income'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {transaction.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {transaction.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          transaction.type === 'income'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.status === 'approved'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {transaction.status.charAt(0).toUpperCase() +
                            transaction.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          className="bg-card hover:bg-muted text-primary font-medium py-4 px-4 rounded-lg shadow flex items-center justify-center transition-colors duration-150"
          onClick={() => navigate('/finances/dues')}
        >
          <i className="fas fa-calendar-check mr-2"></i>
          Manage Dues
        </button>
        <button
          className="bg-card hover:bg-muted text-purple-600 dark:text-purple-400 font-medium py-4 px-4 rounded-lg shadow flex items-center justify-center transition-colors duration-150"
          onClick={() => navigate('/finances/donations')}
        >
          <i className="fas fa-hand-holding-heart mr-2"></i>
          Donations
        </button>
        <button
          className="bg-card hover:bg-muted text-foreground font-medium py-4 px-4 rounded-lg shadow flex items-center justify-center transition-colors duration-150"
          onClick={() => navigate('/finances/reports')}
        >
          <i className="fas fa-chart-pie mr-2"></i>
          Financial Reports
        </button>
      </div>
    </div>
  );
};

export default FinancialDashboard;
