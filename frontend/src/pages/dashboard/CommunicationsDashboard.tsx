import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import communicationService from '../../services/communication.service';
import ChartComponent from '../../components/common/ChartComponent';
import StatCard from '../../components/common/StatCard';
import type {
  Communication,
  CommunicationSummary,
  CommunicationType,
} from '../../types/communication.types';

const CommunicationsDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<CommunicationSummary | null>(null);
  const [recentCommunications, setRecentCommunications] = useState<
    Communication[]
  >([]);

  useEffect(() => {
    const fetchCommunicationData = async () => {
      setIsLoading(true);
      try {
        const summaryData =
          await communicationService.getCommunicationSummary();
        setSummary(summaryData);

        const communications = await communicationService.getCommunications();
        // Get most recent communications
        const recent = [...communications]
          .sort((a, b) => {
            const dateA = a.updatedAt || a.createdAt || '';
            const dateB = b.updatedAt || b.createdAt || '';
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          })
          .slice(0, 5);

        setRecentCommunications(recent);
      } catch (error) {
        console.error('Error fetching communication data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunicationData();
  }, []);

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get communication type chart data
  const getCommunicationTypeChartData = () => {
    if (!summary) return null;

    const labels = Object.keys(summary.byType).filter(
      (type) => summary.byType[type as CommunicationType] > 0
    );
    const data = labels.map(
      (type) => summary.byType[type as CommunicationType]
    );

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#4BC0C0', '#36A2EB', '#FFCE56', '#FF6384'],
          hoverBackgroundColor: ['#4BC0C0', '#36A2EB', '#FFCE56', '#FF6384'],
        },
      ],
    };
  };

  // Get communication status chart data
  const getCommunicationStatusChartData = () => {
    if (!summary) return null;

    return {
      labels: ['Sent', 'Draft', 'Scheduled'],
      datasets: [
        {
          data: [summary.sent, summary.draft, summary.scheduled],
          backgroundColor: ['#4BC0C0', '#FFCE56', '#36A2EB'],
          hoverBackgroundColor: ['#4BC0C0', '#FFCE56', '#36A2EB'],
        },
      ],
    };
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let colorClasses = '';

    switch (status) {
      case 'sent':
        colorClasses =
          'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
        break;
      case 'draft':
        colorClasses =
          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
        break;
      case 'scheduled':
        colorClasses =
          'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
        break;
      case 'failed':
        colorClasses =
          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
        break;
      default:
        colorClasses = 'bg-muted text-muted-foreground';
    }

    return (
      <span
        className={`${colorClasses} text-xs font-medium px-2.5 py-0.5 rounded-full capitalize`}
      >
        {status}
      </span>
    );
  };

  // Type badge component
  const TypeBadge = ({ type }: { type: string }) => {
    let icon = 'envelope';

    switch (type) {
      case 'announcement':
        icon = 'bullhorn';
        break;
      case 'email':
        icon = 'envelope';
        break;
      case 'sms':
        icon = 'sms';
        break;
      case 'private_message':
        icon = 'comment';
        break;
    }

    return (
      <span className="inline-flex items-center text-muted-foreground">
        <i className={`fas fa-${icon} mr-1`}></i>
        <span className="capitalize">{type.replace('_', ' ')}</span>
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Communications Overview
        </h1>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm shadow"
            onClick={() => navigate('/communications/compose')}
          >
            <i className="fas fa-paper-plane mr-2"></i>
            Compose New
          </button>
          <button
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md text-sm shadow"
            onClick={() => navigate('/communications/messages')}
          >
            <i className="fas fa-comment mr-2"></i>
            Messages
          </button>
          <button
            className="bg-accent hover:bg-accent/80 text-accent-foreground px-4 py-2 rounded-md text-sm shadow"
            onClick={() => navigate('/communications/announcements')}
          >
            <i className="fas fa-bullhorn mr-2"></i>
            Announcements
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Communications"
          value={isLoading ? '-' : summary?.total.toString() || '0'}
          icon={<i className="fas fa-envelope"></i>}
          className="border-l-4 border-blue-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Sent"
          value={isLoading ? '-' : summary?.sent.toString() || '0'}
          icon={<i className="fas fa-check-circle"></i>}
          className="border-l-4 border-green-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Draft"
          value={isLoading ? '-' : summary?.draft.toString() || '0'}
          icon={<i className="fas fa-file-alt"></i>}
          className="border-l-4 border-yellow-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Scheduled"
          value={isLoading ? '-' : summary?.scheduled.toString() || '0'}
          icon={<i className="fas fa-clock"></i>}
          className="border-l-4 border-purple-500"
          isLoading={isLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Communication Types Distribution */}
        <div className="bg-card rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Communication Types
          </h2>
          {isLoading ? (
            <div className="animate-pulse h-64 bg-muted rounded"></div>
          ) : (
            getCommunicationTypeChartData() && (
              <ChartComponent
                type="doughnut"
                data={getCommunicationTypeChartData()!}
                height={300}
              />
            )
          )}
        </div>

        {/* Communication Status Distribution */}
        <div className="bg-card rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Communication Status
          </h2>
          {isLoading ? (
            <div className="animate-pulse h-64 bg-muted rounded"></div>
          ) : (
            getCommunicationStatusChartData() && (
              <ChartComponent
                type="pie"
                data={getCommunicationStatusChartData()!}
                height={300}
              />
            )
          )}
        </div>
      </div>

      {/* Recent Communications */}
      <div className="bg-card rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Communications
          </h2>
          <button
            className="text-primary hover:text-primary/80 text-sm font-medium"
            onClick={() => navigate('/communications/list')}
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
        ) : recentCommunications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No communications available yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Title
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Sender
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {recentCommunications.map((communication) => (
                  <tr
                    key={communication._id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() =>
                      navigate(`/communications/${communication._id}`)
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">
                        {communication.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <TypeBadge type={communication.type} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={communication.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(
                        communication.sentAt ||
                          communication.updatedAt ||
                          communication.createdAt
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {communication.senderName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className="bg-card rounded-lg shadow-md p-6 cursor-pointer hover:bg-muted/50"
          onClick={() => navigate('/communications/compose?type=announcement')}
        >
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/15 text-primary mb-4">
            <i className="fas fa-bullhorn text-lg"></i>
          </div>
          <h3 className="text-lg font-medium text-foreground">
            Create Announcement
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Send important announcements to all members or specific groups
          </p>
        </div>

        <div
          className="bg-card rounded-lg shadow-md p-6 cursor-pointer hover:bg-muted/50"
          onClick={() => navigate('/communications/compose?type=email')}
        >
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
            <i className="fas fa-envelope text-lg"></i>
          </div>
          <h3 className="text-lg font-medium text-foreground">Send Email</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Send emails to individual members or groups
          </p>
        </div>

        <div
          className="bg-card rounded-lg shadow-md p-6 cursor-pointer hover:bg-muted/50"
          onClick={() => navigate('/communications/compose?type=sms')}
        >
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
            <i className="fas fa-sms text-lg"></i>
          </div>
          <h3 className="text-lg font-medium text-foreground">Send SMS</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Send SMS messages for urgent communications
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommunicationsDashboard;
