import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import electionService from '../../services/election.service';
import { ElectionSummary, Election } from '../../types/election.types';
import ChartComponent from '../../components/common/ChartComponent';
import StatCard from '../../components/common/StatCard';

const ElectionDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<ElectionSummary | null>(null);

  useEffect(() => {
    const fetchElectionData = async () => {
      setIsLoading(true);
      try {
        const summaryData = await electionService.getElectionSummary();
        setSummary(summaryData);
      } catch (error) {
        console.error('Error fetching election data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchElectionData();
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get election status chart data
  const getElectionStatusChartData = () => {
    if (!summary) return null;

    return {
      labels: ['Upcoming', 'Ongoing', 'Ended', 'Draft'],
      datasets: [
        {
          data: [
            summary.upcoming,
            summary.ongoing,
            summary.ended,
            summary.draft,
          ],
          backgroundColor: ['#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'],
          hoverBackgroundColor: ['#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'],
        },
      ],
    };
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let color = 'gray';

    switch (status) {
      case 'upcoming':
        color = 'blue';
        break;
      case 'ongoing':
        color = 'green';
        break;
      case 'ended':
        color = 'gray';
        break;
      case 'cancelled':
        color = 'red';
        break;
      case 'draft':
        color = 'yellow';
        break;
    }

    return (
      <span
        className={`bg-${color}-100 text-${color}-800 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize`}
      >
        {status}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <i className="fas fa-clock text-blue-500"></i>;
      case 'ongoing':
        return <i className="fas fa-vote-yea text-green-500"></i>;
      case 'ended':
        return <i className="fas fa-check-circle text-gray-500"></i>;
      case 'cancelled':
        return <i className="fas fa-ban text-red-500"></i>;
      case 'draft':
        return <i className="fas fa-pencil-alt text-yellow-500"></i>;
      default:
        return <i className="fas fa-question-circle text-gray-500"></i>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Elections Overview</h1>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow"
            onClick={() => navigate('/elections/create')}
          >
            <i className="fas fa-plus mr-2"></i>
            Create Election
          </button>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm shadow"
            onClick={() => navigate('/elections/list')}
          >
            <i className="fas fa-list mr-2"></i>
            View All Elections
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Elections"
          value={isLoading ? '-' : summary?.total.toString() || '0'}
          icon={<i className="fas fa-poll"></i>}
          className="border-l-4 border-blue-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Upcoming Elections"
          value={isLoading ? '-' : summary?.upcoming.toString() || '0'}
          icon={<i className="fas fa-hourglass-start"></i>}
          className="border-l-4 border-green-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Ongoing Elections"
          value={isLoading ? '-' : summary?.ongoing.toString() || '0'}
          icon={<i className="fas fa-vote-yea"></i>}
          className="border-l-4 border-purple-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Votes Cast"
          value={isLoading ? '-' : summary?.totalVotes.toString() || '0'}
          icon={<i className="fas fa-ballot-check"></i>}
          className="border-l-4 border-indigo-500"
          isLoading={isLoading}
        />
      </div>

      {/* Active Election Section */}
      {summary?.activeElection && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Active Election</h2>
            <StatusBadge status={summary.activeElection.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {summary.activeElection.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {summary.activeElection.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">
                    {formatDate(summary.activeElection.startDate)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTime(summary.activeElection.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">
                    {formatDate(summary.activeElection.endDate)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTime(summary.activeElection.endDate)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Positions</p>
                  <p className="font-medium">
                    {summary.activeElection.positions.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Candidates</p>
                  <p className="font-medium">
                    {summary.activeElection.candidates.length}
                  </p>
                </div>
              </div>

              <div className="space-x-2">
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                  onClick={() =>
                    navigate(`/elections/${summary.activeElection?._id}/vote`)
                  }
                >
                  <i className="fas fa-vote-yea mr-2"></i>
                  Vote Now
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                  onClick={() =>
                    navigate(`/elections/${summary.activeElection?._id}`)
                  }
                >
                  <i className="fas fa-info-circle mr-2"></i>
                  View Details
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Voting Progress</h4>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Votes Cast</span>
                  <span>
                    {summary.activeElection.votesSubmitted} /{' '}
                    {summary.activeElection.totalVoters}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{
                      width: `${
                        summary.activeElection.totalVoters > 0
                          ? (summary.activeElection.votesSubmitted /
                              summary.activeElection.totalVoters) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.activeElection.totalVoters > 0
                    ? (
                        (summary.activeElection.votesSubmitted /
                          summary.activeElection.totalVoters) *
                        100
                      ).toFixed(1)
                    : 0}
                  % voter turnout so far
                </p>
              </div>

              <h4 className="font-semibold mb-2">Positions & Candidates</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {summary.activeElection.positions.map((position) => (
                  <div
                    key={position._id}
                    className="bg-white p-2 rounded shadow-sm"
                  >
                    <p className="font-medium">{position.name}</p>
                    <p className="text-xs text-gray-500">
                      {summary.activeElection?.candidates.filter(
                        (c) => c.position === position._id
                      ).length || 0}{' '}
                      candidates
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Election Status Distribution */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">
            Election Status Distribution
          </h2>
          {isLoading ? (
            <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
          ) : (
            getElectionStatusChartData() && (
              <ChartComponent
                type="doughnut"
                data={getElectionStatusChartData()!}
                height={300}
              />
            )
          )}
        </div>

        {/* Recent Elections */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Elections</h2>
            <button
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              onClick={() => navigate('/elections/list')}
            >
              View All
            </button>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : summary?.recentElections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No elections available yet
            </div>
          ) : (
            <div className="space-y-4">
              {summary?.recentElections.map((election) => (
                <div
                  key={election._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/elections/${election._id}`)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mr-4">
                      {getStatusIcon(election.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {election.title}
                        </p>
                        <StatusBadge status={election.status} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {election.description}
                      </p>
                      <div className="flex mt-2 text-xs text-gray-500">
                        <span className="mr-3">
                          <i className="fas fa-calendar-alt mr-1"></i>
                          {formatDate(election.startDate)}
                        </span>
                        <span>
                          <i className="fas fa-users mr-1"></i>
                          {election.votesSubmitted} / {election.totalVoters}{' '}
                          votes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:bg-gray-50"
          onClick={() => navigate('/elections/create')}
        >
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600 mb-4">
            <i className="fas fa-plus text-lg"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Create Election</h3>
          <p className="mt-2 text-sm text-gray-500">
            Set up a new election with positions and configure eligibility rules
          </p>
        </div>

        <div
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:bg-gray-50"
          onClick={() => navigate('/elections/candidates')}
        >
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-100 text-green-600 mb-4">
            <i className="fas fa-user-tie text-lg"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Manage Candidates
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Review applications and manage candidates for elections
          </p>
        </div>

        <div
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:bg-gray-50"
          onClick={() => navigate('/elections/results')}
        >
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600 mb-4">
            <i className="fas fa-chart-bar text-lg"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900">View Results</h3>
          <p className="mt-2 text-sm text-gray-500">
            Access results and analytics for past elections
          </p>
        </div>
      </div>
    </div>
  );
};

export default ElectionDashboard;
