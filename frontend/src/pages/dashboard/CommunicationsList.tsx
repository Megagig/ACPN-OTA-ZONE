import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import communicationService from '../../services/communication.service';
import {
  Communication,
  CommunicationType,
  CommunicationStatus,
  RecipientType,
} from '../../types/communication.types';

const CommunicationsList = () => {
  const navigate = useNavigate();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '' as CommunicationType | '',
    status: '' as CommunicationStatus | '',
    search: '',
  });

  useEffect(() => {
    fetchCommunications();
  }, []);

  const fetchCommunications = async () => {
    setIsLoading(true);
    try {
      const data = await communicationService.getCommunications();
      setCommunications(data);
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this communication?')) {
      try {
        await communicationService.deleteCommunication(id);
        setCommunications(communications.filter((comm) => comm._id !== id));
      } catch (error) {
        console.error('Error deleting communication:', error);
      }
    }
  };

  const handleSend = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updatedComm = await communicationService.sendCommunication(id);
      setCommunications(
        communications.map((comm) =>
          comm._id === id ? { ...comm, ...updatedComm } : comm
        )
      );
    } catch (error) {
      console.error('Error sending communication:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter communications based on current filters
  const filteredCommunications = communications.filter((comm) => {
    const typeMatch = !filters.type || comm.type === filters.type;
    const statusMatch = !filters.status || comm.status === filters.status;
    const searchMatch =
      !filters.search ||
      comm.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      comm.content.toLowerCase().includes(filters.search.toLowerCase());

    return typeMatch && statusMatch && searchMatch;
  });

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let color = 'gray';

    switch (status) {
      case 'sent':
        color = 'green';
        break;
      case 'draft':
        color = 'yellow';
        break;
      case 'scheduled':
        color = 'blue';
        break;
      case 'failed':
        color = 'red';
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
      <span className="inline-flex items-center">
        <i className={`fas fa-${icon} mr-1`}></i>
        <span className="capitalize">{type.replace('_', ' ')}</span>
      </span>
    );
  };

  // Recipient type badge component
  const RecipientBadge = ({ type }: { type: RecipientType }) => {
    let label = type.replace('_', ' ');

    return (
      <span className="inline-flex items-center capitalize text-xs text-gray-700">
        <i className="fas fa-users mr-1"></i>
        {label}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Communications</h1>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow"
            onClick={() => navigate('/communications/compose')}
          >
            <i className="fas fa-paper-plane mr-2"></i>
            Compose New
          </button>
          <button
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm shadow"
            onClick={() => navigate('/communications/dashboard')}
          >
            <i className="fas fa-tachometer-alt mr-2"></i>
            Dashboard
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="type-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Type
            </label>
            <select
              id="type-filter"
              className="border border-gray-300 rounded-md shadow-sm p-2 w-full"
              value={filters.type}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  type: e.target.value as CommunicationType | '',
                })
              }
            >
              <option value="">All Types</option>
              <option value="announcement">Announcement</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="private_message">Private Message</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status-filter"
              className="border border-gray-300 rounded-md shadow-sm p-2 w-full"
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value as CommunicationStatus | '',
                })
              }
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="search-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <input
              id="search-filter"
              type="text"
              className="border border-gray-300 rounded-md shadow-sm p-2 w-full"
              placeholder="Search by title or content..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Communications List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse p-4 space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : filteredCommunications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {filters.type || filters.status || filters.search
              ? 'No communications match your filter criteria'
              : 'No communications available yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Title
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Recipients
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCommunications.map((communication) => (
                  <tr
                    key={communication._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      navigate(`/communications/${communication._id}`)
                    }
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {communication.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {communication.content.length > 100
                          ? `${communication.content.substring(0, 100)}...`
                          : communication.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        <TypeBadge type={communication.type} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RecipientBadge type={communication.recipientType} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={communication.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(
                        communication.sentAt ||
                          communication.updatedAt ||
                          communication.createdAt
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        {communication.status === 'draft' && (
                          <>
                            <button
                              onClick={(e) => handleSend(communication._id, e)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Send"
                            >
                              <i className="fas fa-paper-plane"></i>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/communications/${communication._id}/edit`
                                );
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => handleDelete(communication._id, e)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <i className="fas fa-trash-alt"></i>
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

export default CommunicationsList;
