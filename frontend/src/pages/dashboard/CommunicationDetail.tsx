import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
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
      console.log('Fetching communication details for ID:', commId);

      // Fetch communication with cache-busting query param to ensure fresh data
      const timestamp = new Date().getTime();
      const commData = await communicationService.getCommunicationById(
        `${commId}?_t=${timestamp}`
      );
      console.log('Fetched communication data:', commData);
      setCommunication(commData);

      // Fetch recipients
      console.log('Fetching recipients for communication ID:', commId);
      const recipientsData =
        await communicationService.getCommunicationRecipients(commId);
      console.log('Received recipient data:', recipientsData);

      // Transform recipient data to match expected structure
      const transformedRecipients = recipientsData.map((recipient: any) => {
        // Backend sends 'userId' but our frontend type expects 'user'
        const userData = recipient.userId || recipient.user;
        return {
          _id: recipient._id,
          communication:
            recipient.communicationId || recipient.communication || '',
          user: userData?._id?.toString() || userData?.toString() || '',
          userName:
            userData && typeof userData !== 'string'
              ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
              : 'Unknown User',
          email:
            userData && typeof userData !== 'string'
              ? userData.email
              : undefined,
          phone:
            userData && typeof userData !== 'string'
              ? userData.phone
              : undefined,
          deliveryStatus: recipient.deliveryStatus || 'delivered', // Default to delivered if not provided
          readStatus: recipient.readStatus || false,
          readAt: recipient.readTime || recipient.readAt,
          deliveredAt: recipient.deliveredAt || undefined,
          createdAt: recipient.createdAt || undefined,
          updatedAt: recipient.updatedAt || undefined,
        };
      }) as CommunicationRecipient[];

      console.log('Transformed recipients:', transformedRecipients);
      setRecipients(transformedRecipients);

      // Calculate stats
      const total = transformedRecipients.length;
      const delivered = transformedRecipients.filter(
        (r) => r.deliveryStatus === 'delivered'
      ).length;
      const read = transformedRecipients.filter((r) => r.readStatus).length;
      const failed = transformedRecipients.filter(
        (r) => r.deliveryStatus === 'failed'
      ).length;
      const pending = transformedRecipients.filter(
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
    const toastId = toast.info(
      <div>
        <p>Are you sure you want to delete this communication?</p>
        <div className="mt-2 flex justify-end space-x-2">
          <button
            onClick={() => {
              toast.dismiss(toastId);
              performDelete();
            }}
            className="bg-red-600 text-white px-2 py-1 rounded text-sm"
          >
            Yes, Delete
          </button>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeButton: false,
        closeOnClick: false,
      }
    );
  };

  const performDelete = async () => {
    try {
      await communicationService.deleteCommunication(id!);
      toast.success('Communication deleted successfully!');
      navigate('/communications/list');
    } catch (error) {
      console.error('Error deleting communication:', error);
      toast.error('Failed to delete communication. Please try again.');
    }
  };

  const handleSend = async () => {
    if (!id || !communication) return;

    const toastId = toast.info(
      <div>
        <p>Are you sure you want to send this communication now?</p>
        <div className="mt-2 flex justify-end space-x-2">
          <button
            onClick={() => {
              toast.dismiss(toastId);
              performSend();
            }}
            className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
          >
            Yes, Send
          </button>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeButton: false,
        closeOnClick: false,
      }
    );
  };

  const performSend = async () => {
    setIsSending(true);
    try {
      console.log('Sending communication with id:', id);
      const updatedComm = await communicationService.sendCommunication(id!);
      console.log('Response from send communication:', updatedComm);

      // Force refresh the communication details
      await fetchCommunicationDetails(id!);

      toast.success('Communication sent successfully!');
    } catch (error) {
      console.error('Error sending communication:', error);
      toast.error('Failed to send communication. Please try again.');
    } finally {
      setIsSending(false);
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
    // Normalize status to handle any case variations
    const normalizedStatus = status?.toLowerCase() || 'draft';
    let colorClasses = '';

    switch (normalizedStatus) {
      case 'sent':
        colorClasses =
          'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        break;
      case 'draft':
        colorClasses =
          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
        break;
      case 'scheduled':
        colorClasses =
          'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
        break;
      case 'failed':
        colorClasses =
          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        break;
      default:
        colorClasses = 'bg-muted text-muted-foreground';
    }

    return (
      <span
        className={`${colorClasses} text-xs font-medium px-2.5 py-0.5 rounded-full capitalize`}
      >
        {normalizedStatus}
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

  // Recipient type badge component
  const RecipientBadge = ({ type }: { type: string }) => {
    let label = type.replace('_', ' ');

    return (
      <span className="inline-flex items-center capitalize text-muted-foreground">
        <i className="fas fa-users mr-1"></i>
        {label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!communication) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          <p>Communication not found or was deleted.</p>
        </div>
        <div className="mt-4">
          <button
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm"
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
            <h1 className="text-2xl font-bold text-foreground mr-3">
              {communication.title}
            </h1>
            <StatusBadge status={communication.status} />
          </div>
          <p className="text-muted-foreground">
            Sent by {communication.senderName || 'Unknown'} on{' '}
            {formatDate(communication.sentAt || communication.createdAt)}
          </p>
        </div>

        <div className="flex space-x-2 mt-4 md:mt-0">
          {communication.status === 'draft' && (
            <>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-background"
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
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:focus:ring-offset-background"
                onClick={() => navigate(`/communications/${id}/edit`)}
              >
                <i className="fas fa-edit mr-2"></i>
                Edit
              </button>
            </>
          )}

          <button
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-background"
            onClick={handleDelete}
          >
            <i className="fas fa-trash-alt mr-2"></i>
            Delete
          </button>

          <button
            className="bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:focus:ring-offset-background"
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
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">
                  <TypeBadge type={communication.type} />
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Recipients</p>
                <p className="font-medium">
                  <RecipientBadge type={communication.recipientType} />
                </p>
              </div>

              {communication.status === 'scheduled' &&
                communication.scheduledFor && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Scheduled For
                    </p>
                    <p className="font-medium text-foreground">
                      {formatDate(communication.scheduledFor)}
                    </p>
                  </div>
                )}

              {communication.status === 'sent' && communication.sentAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Sent At</p>
                  <p className="font-medium text-foreground">
                    {formatDate(communication.sentAt)}
                  </p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                Content
              </h3>
              <div className="bg-muted p-4 rounded border border-border whitespace-pre-wrap text-foreground">
                {communication.content}
              </div>
            </div>

            {communication.attachments &&
              communication.attachments.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    Attachments
                  </h3>
                  <div className="space-y-2">
                    {communication.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-muted p-2 rounded-md border border-border"
                      >
                        <i className="fas fa-file-alt text-muted-foreground mr-2"></i>
                        <span className="text-sm text-foreground truncate flex-1">
                          {attachment || `Attachment ${index + 1}`}
                        </span>
                        <button
                          type="button"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-background rounded"
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
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Delivery Statistics
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Recipients</span>
                <span className="font-semibold text-foreground">
                  {stats.total}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Delivered</span>
                <div className="flex items-center">
                  <span className="font-semibold mr-2 text-foreground">
                    {stats.delivered}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    (
                    {stats.total > 0
                      ? Math.round((stats.delivered / stats.total) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Read</span>
                <div className="flex items-center">
                  <span className="font-semibold mr-2 text-foreground">
                    {stats.read}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    (
                    {stats.total > 0
                      ? Math.round((stats.read / stats.total) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Failed</span>
                <div className="flex items-center">
                  <span className="font-semibold text-red-600 dark:text-red-400 mr-2">
                    {stats.failed}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    (
                    {stats.total > 0
                      ? Math.round((stats.failed / stats.total) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pending</span>
                <div className="flex items-center">
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400 mr-2">
                    {stats.pending}
                  </span>
                  <span className="text-sm text-muted-foreground">
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
              <div className="w-full bg-muted rounded-full h-2.5 border border-border">
                <div
                  className="bg-green-600 dark:bg-green-500 h-2.5 rounded-full"
                  style={{ width: `${(stats.delivered / stats.total) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
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
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Recipients
              </h3>
              {recipients.length > 10 && (
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-background rounded">
                  View All
                </button>
              )}
            </div>

            {recipients.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No recipient data available
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recipients.slice(0, 10).map((recipient) => (
                  <div
                    key={recipient._id}
                    className="flex items-start border-b border-border pb-2"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mr-3">
                      {recipient.userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {recipient.userName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {recipient.email ||
                          recipient.phone ||
                          'No contact info'}
                      </p>
                    </div>
                    <div>
                      {recipient.deliveryStatus === 'delivered' ? (
                        <span
                          className="text-green-600 dark:text-green-400"
                          title="Delivered"
                        >
                          <i className="fas fa-check-circle"></i>
                          {recipient.readStatus && (
                            <i className="fas fa-eye ml-1" title="Read"></i>
                          )}
                        </span>
                      ) : recipient.deliveryStatus === 'failed' ? (
                        <span
                          className="text-red-600 dark:text-red-400"
                          title="Failed"
                        >
                          <i className="fas fa-times-circle"></i>
                        </span>
                      ) : (
                        <span
                          className="text-yellow-600 dark:text-yellow-400"
                          title="Pending"
                        >
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
