import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import electionService from '../../services/election.service';
import type { Election, Candidate } from '../../types/election.types';
import StatCard from '../../components/common/StatCard';

const ElectionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchElectionData = async () => {
      if (!id) {
        setError('Election ID is required');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        // Fetch election data which includes candidates
        const electionData = await electionService.getElectionById(id);
        setElection(electionData);

        // Extract candidates from the election data
        if (electionData.candidatesByPosition) {
          const allCandidates: Candidate[] = [];
          Object.values(electionData.candidatesByPosition).forEach(positionCandidates => {
            allCandidates.push(...positionCandidates);
          });
          setCandidates(allCandidates);
        }
      } catch (error) {
        console.error('Error fetching election data:', error);
        setError('Failed to load election data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchElectionData();
  }, [id]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getBadgeClasses = (status: string) => {
      switch (status) {
        case 'upcoming':
          return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
        case 'ongoing':
          return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        case 'ended':
          return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
        case 'cancelled':
          return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        case 'draft':
          return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
        default:
          return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
      }
    };

    return (
      <span
        className={`${getBadgeClasses(
          status
        )} text-xs font-medium px-2.5 py-0.5 rounded-full capitalize`}
      >
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8 text-muted-foreground">
          Election not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {election.title}
          </h1>
          <p className="text-muted-foreground">{election.description}</p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <StatusBadge status={election.status} />
          {election.status === 'ongoing' && !election.isUserCandidate && (
            <button
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm shadow"
              onClick={() => navigate(`/elections/${election._id}/vote`)}
            >
              <i className="fas fa-vote-yea mr-2"></i>
              Vote Now
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Start Date"
          value={formatDate(election.startDate)}
          icon={<i className="fas fa-calendar-alt"></i>}
          className="border-l-4 border-blue-500"
        />
        <StatCard
          title="End Date"
          value={formatDate(election.endDate)}
          icon={<i className="fas fa-calendar-check"></i>}
          className="border-l-4 border-green-500"
        />
        <StatCard
          title="Positions"
          value={Object.keys(election.candidatesByPosition || {}).length.toString()}
          icon={<i className="fas fa-users"></i>}
          className="border-l-4 border-purple-500"
        />
        <StatCard
          title="Votes Cast"
          value={`${election.voteCount || 0} / ${election.totalVoters || 0}`}
          icon={<i className="fas fa-vote-yea"></i>}
          className="border-l-4 border-indigo-500"
        />
      </div>

      {/* Positions and Candidates */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Positions & Candidates
        </h2>
        <div className="space-y-6">
          {Object.entries(election.candidatesByPosition || {}).map(([positionId, positionCandidates]) => (
            <div key={positionId} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-medium text-foreground mb-4">
                {positionCandidates[0]?.positionName || 'Position'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {positionCandidates.map((candidate) => (
                  <div
                    key={candidate._id}
                    className="bg-muted/50 rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-4">
                      {candidate.photoUrl ? (
                        <img
                          src={candidate.photoUrl}
                          alt={candidate.fullName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <i className="fas fa-user text-2xl text-primary"></i>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-foreground">
                          {candidate.fullName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {candidate.bio || 'No bio available'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ElectionDetails; 