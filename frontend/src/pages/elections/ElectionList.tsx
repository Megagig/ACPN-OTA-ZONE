import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import electionService from '../../services/election.service';
import type { Election, Position } from '../../types/election.types';
import { Button } from '../../components/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shadcn/card';
import { Badge } from '../../components/shadcn/badge';
import { Skeleton } from '../../components/shadcn/skeleton';
import { format } from 'date-fns';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Badge className={`${getStatusColor(status)} px-2 py-1 rounded-full text-xs font-medium`}>
      {status}
    </Badge>
  );
};

const ElectionList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [elections, setElections] = useState<Election[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const data = await electionService.getElections();
        setElections(data);
      } catch (error) {
        console.error('Error fetching elections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, []);

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Elections</h1>
        <Button onClick={() => navigate('/elections/create')}>
          Create Election
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {elections.map((election) => (
          <Card key={election._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold">
                  {election.title}
                </CardTitle>
                <StatusBadge status={election.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Start Date:</span>{' '}
                  {formatDate(election.startDate)}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">End Date:</span>{' '}
                  {formatDate(election.endDate)}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Positions:</span>{' '}
                  {election.positions?.length || 0}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Candidates:</span>{' '}
                  {election.positions?.reduce(
                    (acc: number, pos: Position) => acc + (pos.candidates?.length || 0),
                    0
                  ) || 0}
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/elections/${election._id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ElectionList; 