import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaPlus,
  FaPoll,
  FaCheckCircle,
  FaEdit,
  FaRegClock,
  FaChartBar,
} from 'react-icons/fa';
import ChartComponent from '../../components/common/ChartComponent';
import type { Poll, PollSummary } from '../../types/poll.types';
import pollService from '../../services/poll.service';

// Import Shadcn UI components
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  StatCard,
  Skeleton,
} from '../../components/shadcn';

const PollDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<PollSummary | null>(null);
  const [recentPolls, setRecentPolls] = useState<Poll[]>([]);
  const [activePolls, setActivePolls] = useState<Poll[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const summaryData = await pollService.getPollSummary();
        setSummary(summaryData);
        setRecentPolls(summaryData.recentPolls);

        // Fetch active polls
        const allPolls = await pollService.getPolls();
        setActivePolls(allPolls.filter((poll) => poll.status === 'active'));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Mock data for charts
  const responsesOverTimeData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Poll Responses',
        data: [12, 19, 15, 28, 22, 35],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const participationByTypeData = {
    labels: ['Satisfaction', 'Opinion', 'Preference', 'Feedback'],
    datasets: [
      {
        label: 'Participation Rate (%)',
        data: [78, 65, 84, 72],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Polls & Surveys Dashboard</h1>
        <Button onClick={() => navigate('/polls/create')}>
          <FaPlus className="mr-2" /> Create New Poll
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Polls"
              value={summary?.total || 0}
              icon={<FaPoll className="h-5 w-5" />}
              trend="up"
            />
            <StatCard
              title="Active Polls"
              value={summary?.active || 0}
              icon={<FaCheckCircle className="h-5 w-5" />}
              variant="success"
              trend="up"
            />
            <StatCard
              title="Completed Polls"
              value={summary?.closed || 0}
              icon={<FaChartBar className="h-5 w-5" />}
              variant="info"
              trend="neutral"
            />
            <StatCard
              title="Draft Polls"
              value={summary?.draft || 0}
              icon={<FaEdit className="h-5 w-5" />}
              variant="primary"
              trend="down"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Responses Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ChartComponent type="line" data={responsesOverTimeData} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Participation by Poll Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ChartComponent type="bar" data={participationByTypeData} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Active Polls</h2>
              {activePolls.length > 0 ? (
                activePolls.map((poll) => (
                  <Card
                    key={poll._id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="space-y-2">
                          <h3 className="font-medium">{poll.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {poll.description}
                          </p>
                          <div className="flex items-center space-x-3 mt-2">
                            <Badge>
                              {poll.status.toUpperCase()}
                            </Badge>
                            <span className="text-xs">
                              Responses: {poll.responseCount || 0}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => navigate(`/polls/${poll._id}/respond`)}
                        >
                          Respond
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">
                      No active polls at the moment
                    </p>
                  </CardContent>
                </Card>
              )}
              <Button
                className="mt-4"
                onClick={() => navigate('/polls/list')}
              >
                View All Polls <FaPoll className="ml-2" />
              </Button>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Polls</h2>
              {recentPolls.length > 0 ? (
                <div className="space-y-4">
                  {recentPolls.map((poll) => (
                    <Card
                      key={poll._id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="space-y-2">
                            <h3 className="font-medium">{poll.title}</h3>
                            <div className="flex items-center space-x-3">
                              <Badge>
                                {poll.status.toUpperCase()}
                              </Badge>
                              <div className="flex items-center text-xs text-gray-500">
                                <FaRegClock className="mr-1" />
                                {new Date(poll.endDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => navigate(`/polls/${poll._id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No recent polls</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PollDashboard;
