import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import communicationService from '../../services/communication.service';
import type {
  Communication,
  CommunicationRecipient,
} from '../../types/communication.types';

const CommunicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [communication, setCommunication] = useState<Communication | null>(
    null
  );
  const [recipients, setRecipients] = useState<CommunicationRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    pending: 0,
  });

  useEffect(() => {
    if (id) {
      fetchCommunicationDetails(id);
    }
  }, [id]);

  const fetchCommunicationDetails = async (commId: string) => {
    setIsLoading(true);
    try {
      // Fetch communication
      const commData = await communicationService.getCommunicationById(commId);
      setCommunication(commData);

      // Fetch recipients
      const recipientsData =
        await communicationService.getCommunicationRecipients(commId);
      setRecipients(recipientsData);

      // Calculate stats
      const total = recipientsData.length;
      const delivered = recipientsData.filter(
        (r) => r.deliveryStatus === 'delivered'
      ).length;
      const read = recipientsData.filter((r) => r.readStatus).length;
      const failed = recipientsData.filter(
        (r) => r.deliveryStatus === 'failed'
      ).length;
      const pending = recipientsData.filter(
        (r) => r.deliveryStatus === 'pending'
      ).length;

      setStats({
        total,
        delivered,
        read,
        failed,
        pending,
      });
    } catch (error) {
      console.error('Error fetching communication details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this communication?')) {
      try {
        await communicationService.deleteCommunication(id!);
        navigate('/communications/list');
      } catch (error) {
        console.error('Error deleting communication:', error);
      }
    }
  };

  const handleSend = async () => {
    if (
      window.confirm('Are you sure you want to send this communication now?')
    ) {
      setIsSending(true);
      try {
        const result = await communicationService.sendCommunication(id!);
        setCommunication((prev) => (prev ? { ...prev, ...result } : null));
      } catch (error) {
        console.error('Error sending communication:', error);
      } finally {
        setIsSending(false);
      }
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
  const RecipientBadge = ({ type }: { type: string }) => {
    let label = type.replace('_', ' ');

    return (
      <span className="inline-flex items-center capitalize">
        <i className="fas fa-users mr-1"></i>
        {label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!communication) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Communication not found or was deleted.</p>
        </div>
        <div className="mt-4">
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm"
            onClick={() => navigate('/communications/list')}
          >
            Back to Communications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center mb-2">
            <h1 className="text-2xl font-bold text-gray-800 mr-3">
              {communication.title}
            </h1>
            <StatusBadge status={communication.status} />
          </div>
          <p className="text-gray-600">
            Sent by {communication.senderName} on{' '}
            {formatDate(communication.sentAt || communication.createdAt)}
          </p>
        </div>

        <div className="flex space-x-2 mt-4 md:mt-0">
          {communication.status === 'draft' && (
            <>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow"
                onClick={handleSend}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Send Now
                  </>
                )}
              </button>

              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm shadow"
                onClick={() => navigate(`/communications/${id}/edit`)}
              >
                <i className="fas fa-edit mr-2"></i>
                Edit
              </button>
            </>
          )}

          <button
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm shadow"
            onClick={handleDelete}
          >
            <i className="fas fa-trash-alt mr-2"></i>
            Delete
          </button>

          <button
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm shadow"
            onClick={() => navigate('/communications/list')}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Communication Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Communication Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">
                  <TypeBadge type={communication.type} />
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Recipients</p>
                <p className="font-medium">
                  <RecipientBadge type={communication.recipientType} />
                </p>
              </div>

              {communication.status === 'scheduled' &&
                communication.scheduledFor && (
                  <div>
                    <p className="text-sm text-gray-500">Scheduled For</p>
                    <p className="font-medium">
                      {formatDate(communication.scheduledFor)}
                    </p>
                  </div>
                )}

              {communication.status === 'sent' && communication.sentAt && (
                <div>
                  <p className="text-sm text-gray-500">Sent At</p>
                  <p className="font-medium">
                    {formatDate(communication.sentAt)}
                  </p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Content</h3>
              <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap">
                {communication.content}
              </div>
            </div>

            {communication.attachments &&
              communication.attachments.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {communication.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-gray-50 p-2 rounded-md"
                      >
                        <i className="fas fa-file-alt text-gray-500 mr-2"></i>
                        <span className="text-sm text-gray-700 truncate flex-1">
                          Attachment {index + 1}
                        </span>
                        <button
                          type="button"
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => window.open(attachment, '_blank')}
                        >
                          <i className="fas fa-download"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Right Column - Delivery Stats */}
        <div className="space-y-6">
          {/* Delivery Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Delivery Statistics</h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Recipients</span>
                <span className="font-semibold">{stats.total}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Delivered</span>
                <div className="flex items-center">
                  <span className="font-semibold mr-2">{stats.delivered}</span>
                  <span className="text-sm text-gray-500">
                    (
                    {stats.total > 0
                      ? Math.round((stats.delivered / stats.total) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Read</span>
                <div className="flex items-center">
                  <span className="font-semibold mr-2">{stats.read}</span>
                  <span className="text-sm text-gray-500">
                    (
                    {stats.total > 0
                      ? Math.round((stats.read / stats.total) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Failed</span>
                <div className="flex items-center">
                  <span className="font-semibold text-red-600 mr-2">
                    {stats.failed}
                  </span>
                  <span className="text-sm text-gray-500">
                    (
                    {stats.total > 0
                      ? Math.round((stats.failed / stats.total) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <div className="flex items-center">
                  <span className="font-semibold text-yellow-600 mr-2">
                    {stats.pending}
                  </span>
                  <span className="text-sm text-gray-500">
                    (
                    {stats.total > 0
                      ? Math.round((stats.pending / stats.total) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{ width: `${(stats.delivered / stats.total) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>
                  Delivery Rate:{' '}
                  {stats.total > 0
                    ? Math.round((stats.delivered / stats.total) * 100)
                    : 0}
                  %
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Recipients List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recipients</h3>
              {recipients.length > 10 && (
                <button className="text-indigo-600 hover:text-indigo-800 text-sm">
                  View All
                </button>
              )}
            </div>

            {recipients.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No recipient data available
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recipients.slice(0, 10).map((recipient) => (
                  <div
                    key={recipient._id}
                    className="flex items-start border-b border-gray-100 pb-2"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mr-3">
                      {recipient.userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {recipient.userName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {recipient.email ||
                          recipient.phone ||
                          'No contact info'}
                      </p>
                    </div>
                    <div>
                      {recipient.deliveryStatus === 'delivered' ? (
                        <span className="text-green-500" title="Delivered">
                          <i className="fas fa-check-circle"></i>
                          {recipient.readStatus && (
                            <i className="fas fa-eye ml-1" title="Read"></i>
                          )}
                        </span>
                      ) : recipient.deliveryStatus === 'failed' ? (
                        <span className="text-red-500" title="Failed">
                          <i className="fas fa-times-circle"></i>
                        </span>
                      ) : (
                        <span className="text-yellow-500" title="Pending">
                          <i className="fas fa-clock"></i>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationDetail;
