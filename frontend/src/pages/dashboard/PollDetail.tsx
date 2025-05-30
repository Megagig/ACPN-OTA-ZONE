import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaChartBar,
  FaUsers,
  FaRegClock,
  FaEdit,
  FaTrash,
} from 'react-icons/fa';
import ChartComponent from '../../components/common/ChartComponent';
import { Alert, Card, CardBody } from '../../components/ui/chakra-components';
import { AlertIcon } from '../../components/ui/chakra-components';
import { useToast } from '../../hooks/useToast';
import type {
  Poll,
  PollResults,
  AnswerStatistics,
  PollQuestion,
  PollOption,
} from '../../types/poll.types';
import pollService from '../../services/poll.service';

interface OptionStatistic {
  optionId: string;
  optionText: string; // Keep the original field name
  count: number;
  percentage: number;
}

const PollDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    const fetchPollData = async () => {
      try {
        if (id) {
          setLoading(true);
          const pollData = await pollService.getPollById(id);
          setPoll(pollData);

          // If poll is closed or allow viewing results, fetch results
          if (pollData.status === 'closed' || pollData.allowResultViewing) {
            const resultsData = await pollService.getPollResults(id);
            setResults(resultsData);
          }
        }
      } catch (error: any) {
        toast({
          title: 'Error loading poll data',
          description: 'Unable to load poll details or results',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPollData();
  }, [id, toast]);

  const getPollStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderQuestionResults = (answerStats: AnswerStatistics) => {
    switch (answerStats.questionType) {
      case 'single_choice':
      case 'multiple_choice': {
        const chartLabels =
          answerStats.options?.map((opt: OptionStatistic) => opt.optionText) ||
          [];
        const chartData =
          answerStats.options?.map((opt: OptionStatistic) => opt.count) || [];

        return (
          <div>
            <div className="h-64 mb-4">
              <ChartComponent
                type="bar"
                data={{
                  labels: chartLabels,
                  datasets: [
                    {
                      label: 'Responses',
                      data: chartData,
                      backgroundColor: 'rgba(75, 192, 192, 0.6)',
                      borderColor: 'rgba(75, 192, 192, 1)',
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y',
                  scales: {
                    x: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Number of Responses',
                      },
                    },
                  },
                }}
              />
            </div>

            <div className="space-y-3">
              {answerStats.options?.map((option: OptionStatistic) => (
                <div key={option.optionId}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">{option.optionText}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold">{option.count}</span>
                      <span className="text-sm text-gray-500">
                        ({option.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${option.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'rating': {
        return (
          <div>
            <div className="mb-4 text-center">
              <div className="text-sm text-gray-600">Average Rating</div>
              <div className="text-3xl font-bold">
                {answerStats.averageRating?.toFixed(1) || 0}
              </div>
              <div className="text-sm text-gray-500">out of 5</div>
            </div>

            <div className="h-48">
              <ChartComponent
                type="bar"
                data={{
                  labels: ['1', '2', '3', '4', '5'],
                  datasets: [
                    {
                      label: 'Number of Responses',
                      data:
                        answerStats.options?.map(
                          (opt: OptionStatistic) => opt.count
                        ) || [],
                      backgroundColor: 'rgba(54, 162, 235, 0.6)',
                      borderColor: 'rgba(54, 162, 235, 1)',
                      borderWidth: 1,
                    },
                  ],
                }}
              />
            </div>
          </div>
        );
      }

      case 'boolean': {
        const yesCount =
          answerStats.options?.find(
            (opt: OptionStatistic) => opt.optionText === 'Yes'
          )?.count || 0;
        const noCount =
          answerStats.options?.find(
            (opt: OptionStatistic) => opt.optionText === 'No'
          )?.count || 0;

        return (
          <div>
            <div className="h-48">
              <ChartComponent
                type="pie"
                data={{
                  labels: ['Yes', 'No'],
                  datasets: [
                    {
                      data: [yesCount, noCount],
                      backgroundColor: [
                        'rgba(34, 197, 94, 0.6)',
                        'rgba(239, 68, 68, 0.6)',
                      ],
                      borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(239, 68, 68, 1)',
                      ],
                      borderWidth: 1,
                    },
                  ],
                }}
              />
            </div>
          </div>
        );
      }

      case 'text': {
        return (
          <div>
            <Alert status="info" className="mb-4">
              <AlertIcon status="info" />
              <div>
                Text responses are not visualized. View individual responses in
                the responses tab.
              </div>
            </Alert>
          </div>
        );
      }

      default:
        return (
          <div>
            <Alert status="warning">
              <AlertIcon status="warning" />
              <div>Unsupported question type for visualization.</div>
            </Alert>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!poll) {
    return (
      <Alert status="error">
        <AlertIcon status="error" />
        <div>
          <div className="font-bold">Poll not found</div>
          <div>
            The requested poll could not be found or you don't have access to
            it.
          </div>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{poll.title}</h1>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getPollStatusColor(
                poll.status
              )}`}
            >
              {poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
            </span>
          </div>
          <p className="text-gray-600 text-lg">{poll.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/dashboard/polls/${poll._id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaEdit />
            Edit Poll
          </button>
          <button
            onClick={() => {
              // Handle delete poll
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <FaTrash />
            Delete
          </button>
        </div>
      </div>

      {/* Poll Information */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardBody className="text-center">
            <FaUsers className="mx-auto text-3xl text-blue-500 mb-2" />
            <div className="text-2xl font-bold">
              {results?.totalResponses || 0}
            </div>
            <div className="text-sm text-gray-600">Total Responses</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <FaChartBar className="mx-auto text-3xl text-green-500 mb-2" />
            <div className="text-2xl font-bold">{poll.questions.length}</div>
            <div className="text-sm text-gray-600">Questions</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <FaRegClock className="mx-auto text-3xl text-orange-500 mb-2" />
            <div className="text-sm text-gray-600">Created</div>
            <div className="font-medium">{formatDate(poll.createdAt)}</div>
          </CardBody>
        </Card>
      </div>

      {/* Poll Details and Results */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab(0)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 0
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Questions
            </button>
            {(poll.status === 'closed' || poll.allowResultViewing) && (
              <button
                onClick={() => setActiveTab(1)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 1
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Results
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Poll Questions</h3>
              {poll.questions.map((question: PollQuestion, index: number) => (
                <Card key={question._id}>
                  <CardBody>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium text-lg">
                          {index + 1}. {question.text}
                        </h4>
                        <span className="text-sm text-gray-500 capitalize">
                          {question.type.replace('_', ' ')}
                        </span>
                      </div>
                      {question.required && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Required
                        </span>
                      )}
                    </div>

                    {question.options && question.options.length > 0 && (
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Options:
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {question.options.map((option: PollOption) => (
                            <li key={option._id}>{option.text}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 1 && results && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Poll Results</h3>
              {results.answersStatistics.map(
                (questionResult, index: number) => (
                  <Card key={questionResult.questionId}>
                    <CardBody>
                      <h4 className="font-medium text-lg mb-4">
                        {index + 1}. {questionResult.questionText}
                      </h4>
                      <div className="text-sm text-gray-600 mb-4">
                        {questionResult.totalResponses} response(s)
                      </div>
                      {renderQuestionResults(questionResult)}
                    </CardBody>
                  </Card>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/dashboard/polls')}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Back to Polls
        </button>
        {poll.status === 'active' && (
          <button
            onClick={() => navigate(`/dashboard/polls/${poll._id}/respond`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Take Poll
          </button>
        )}
      </div>
    </div>
  );
};

export default PollDetail;
