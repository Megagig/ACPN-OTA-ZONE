import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import electionService from '../../services/election.service';
import type { Election, ElectionStatus } from '../../types/election.types';

const ElectionsList = () => {
  const navigate = useNavigate();
  const [elections, setElections] = useState<Election[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '' as ElectionStatus | '',
    search: '',
  });

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    setIsLoading(true);
    try {
      const data = await electionService.getElections();
      setElections(data);
    } catch (error) {
      console.error('Error fetching elections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this election?')) {
      try {
        await electionService.deleteElection(id);
        setElections(elections.filter((election) => election._id !== id));
      } catch (error) {
        console.error('Error deleting election:', error);
      }
    }
  };

  const handleStartElection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to start this election now?')) {
      try {
        const updatedElection = await electionService.startElection(id);
        setElections(
          elections.map((election) =>
            election._id === id ? { ...election, ...updatedElection } : election
          )
        );
      } catch (error) {
        console.error('Error starting election:', error);
      }
    }
  };

  const handleEndElection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to end this election now?')) {
      try {
        const updatedElection = await electionService.endElection(id);
        setElections(
          elections.map((election) =>
            election._id === id ? { ...election, ...updatedElection } : election
          )
        );
      } catch (error) {
        console.error('Error ending election:', error);
      }
    }
  };

  const handlePublishElection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to publish this election?')) {
      try {
        const updatedElection = await electionService.publishElection(id);
        setElections(
          elections.map((election) =>
            election._id === id ? { ...election, ...updatedElection } : election
          )
        );
      } catch (error) {
        console.error('Error publishing election:', error);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter elections based on current filters
  const filteredElections = elections.filter((election) => {
    const statusMatch = !filters.status || election.status === filters.status;
    const searchMatch =
      !filters.search ||
      election.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      election.description.toLowerCase().includes(filters.search.toLowerCase());

    return statusMatch && searchMatch;
  });

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let badgeClasses = '';

    switch (status) {
      case 'upcoming':
        badgeClasses =
          'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
        break;
      case 'ongoing':
        badgeClasses =
          'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        break;
      case 'ended':
        badgeClasses = 'bg-muted text-muted-foreground';
        break;
      case 'cancelled':
        badgeClasses =
          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        break;
      case 'draft':
        badgeClasses =
          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
        break;
      default:
        badgeClasses = 'bg-muted text-muted-foreground';
    }

    return (
      <span
        className={`${badgeClasses} text-xs font-medium px-2.5 py-0.5 rounded-full capitalize`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Elections</h1>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm shadow"
            onClick={() => navigate('/elections/create')}
          >
            <i className="fas fa-plus mr-2"></i>
            Create Election
          </button>
          <button
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md text-sm shadow"
            onClick={() => navigate('/elections/dashboard')}
          >
            <i className="fas fa-tachometer-alt mr-2"></i>
            Dashboard
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Status
            </label>
            <select
              id="status-filter"
              className="border border-border rounded-md shadow-sm p-2 w-full"
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value as ElectionStatus | '',
                })
              }
            >
              <option value="">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="ended">Ended</option>
              <option value="cancelled">Cancelled</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="search-filter"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Search
            </label>
            <input
              id="search-filter"
              type="text"
              className="border border-border rounded-md shadow-sm p-2 w-full"
              placeholder="Search by title or description..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Elections List */}
      <div className="bg-card rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse p-4 space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        ) : filteredElections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {filters.status || filters.search
              ? 'No elections match your filter criteria'
              : 'No elections available yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
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
                    Start Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    End Date
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
                    Voters
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredElections.map((election) => (
                  <tr
                    key={election._id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/elections/${election._id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">
                        {election.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">
                        {election.description.length > 100
                          ? `${election.description.substring(0, 100)}...`
                          : election.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(election.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(election.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={election.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {election.votesSubmitted} / {election.totalVoters}
                      <span className="text-xs ml-1">
                        (
                        {election.totalVoters > 0
                          ? (
                              (election.votesSubmitted / election.totalVoters) *
                              100
                            ).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        {election.status === 'upcoming' && (
                          <button
                            onClick={(e) =>
                              handleStartElection(election._id, e)
                            }
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                            title="Start Election"
                          >
                            <i className="fas fa-play"></i>
                          </button>
                        )}

                        {election.status === 'ongoing' && (
                          <button
                            onClick={(e) => handleEndElection(election._id, e)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            title="End Election"
                          >
                            <i className="fas fa-stop"></i>
                          </button>
                        )}

                        {election.status === 'draft' && (
                          <>
                            <button
                              onClick={(e) =>
                                handlePublishElection(election._id, e)
                              }
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              title="Publish"
                            >
                              <i className="fas fa-upload"></i>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/elections/${election._id}/edit`);
                              }}
                              className="text-primary hover:text-primary/80"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          </>
                        )}

                        {['draft', 'upcoming'].includes(election.status) && (
                          <button
                            onClick={(e) => handleDelete(election._id, e)}
                            className="text-destructive hover:text-destructive/80"
                            title="Delete"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        )}

                        {election.status === 'ended' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/elections/${election._id}/results`);
                            }}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                            title="View Results"
                          >
                            <i className="fas fa-chart-bar"></i>
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/elections/${election._id}`);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
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

export default ElectionsList;
