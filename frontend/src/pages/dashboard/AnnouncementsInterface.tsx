import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import communicationService from '../../services/communication.service';
import type { Communication } from '../../types/communication.types';

const AnnouncementsInterface = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Communication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Communication | null>(null);
  const [showComposeForm, setShowComposeForm] = useState(false);
  const [composeData, setComposeData] = useState({
    title: '',
    content: '',
    recipientType: 'all_members' as const,
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    scheduledFor: '',
  });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await communicationService.getCommunications({
        type: 'announcement',
        limit: 50,
      });
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!composeData.title.trim() || !composeData.content.trim()) {
      return;
    }

    setIsSending(true);
    try {
      const newAnnouncement = await communicationService.createCommunication({
        title: composeData.title,
        content: composeData.content,
        type: 'announcement',
        recipientType: composeData.recipientType as any,
        priority: composeData.priority,
        scheduledFor: composeData.scheduledFor || undefined,
      });

      // If not scheduled, send immediately
      if (!composeData.scheduledFor) {
        await communicationService.sendCommunication(newAnnouncement._id);
      }

      // Refresh announcements
      await fetchAnnouncements();

      // Reset form
      setComposeData({
        title: '',
        content: '',
        recipientType: 'all_members',
        priority: 'normal',
        scheduledFor: '',
      });
      setShowComposeForm(false);
    } catch (error) {
      console.error('Error sending announcement:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          colors[priority as keyof typeof colors] || colors.normal
        }`}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          colors[status as keyof typeof colors] || colors.draft
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const canCreateAnnouncements = () => {
    return user && ['admin', 'superadmin', 'secretary'].includes(user.role);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
        <div className="flex space-x-2">
          {canCreateAnnouncements() && (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow"
              onClick={() => setShowComposeForm(true)}
            >
              <i className="fas fa-bullhorn mr-2"></i>
              New Announcement
            </button>
          )}
          <button
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm shadow"
            onClick={() => navigate('/communications/dashboard')}
          >
            <i className="fas fa-tachometer-alt mr-2"></i>
            Dashboard
          </button>
        </div>
      </div>

      {/* Compose Form Modal */}
      {showComposeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">New Announcement</h3>
              <button
                onClick={() => setShowComposeForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md shadow-sm p-2 w-full"
                  placeholder="Announcement title"
                  value={composeData.title}
                  onChange={(e) =>
                    setComposeData({ ...composeData, title: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipients
                  </label>
                  <select
                    className="border border-gray-300 rounded-md shadow-sm p-2 w-full"
                    value={composeData.recipientType}
                    onChange={(e) =>
                      setComposeData({
                        ...composeData,
                        recipientType: e.target.value as any,
                      })
                    }
                  >
                    <option value="all_members">All Members</option>
                    <option value="active_members">Active Members Only</option>
                    <option value="admins_only">Administrators Only</option>
                    <option value="specific_roles">Specific Roles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    className="border border-gray-300 rounded-md shadow-sm p-2 w-full"
                    value={composeData.priority}
                    onChange={(e) =>
                      setComposeData({
                        ...composeData,
                        priority: e.target.value as
                          | 'low'
                          | 'normal'
                          | 'high'
                          | 'urgent',
                      })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule For (Optional)
                </label>
                <input
                  type="datetime-local"
                  className="border border-gray-300 rounded-md shadow-sm p-2 w-full"
                  value={composeData.scheduledFor}
                  onChange={(e) =>
                    setComposeData({
                      ...composeData,
                      scheduledFor: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={8}
                  className="border border-gray-300 rounded-md shadow-sm p-2 w-full"
                  placeholder="Write your announcement here..."
                  value={composeData.content}
                  onChange={(e) =>
                    setComposeData({ ...composeData, content: e.target.value })
                  }
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm"
                  onClick={() => setShowComposeForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                  onClick={handleSendAnnouncement}
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      {composeData.scheduledFor
                        ? 'Scheduling...'
                        : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-bullhorn mr-2"></i>
                      {composeData.scheduledFor ? 'Schedule' : 'Send Now'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse p-4 space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-gray-400 text-5xl mb-4">
              <i className="fas fa-bullhorn"></i>
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              No announcements yet
            </h3>
            <p className="text-gray-500">
              {canCreateAnnouncements()
                ? 'Create your first announcement to get started'
                : 'Check back later for new announcements'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {announcements.map((announcement) => (
              <div
                key={announcement._id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  selectedAnnouncement?._id === announcement._id
                    ? 'bg-blue-50'
                    : ''
                }`}
                onClick={() => setSelectedAnnouncement(announcement)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium text-gray-900 mr-3">
                        {announcement.title}
                      </h3>
                      {getPriorityBadge(announcement.priority || 'normal')}
                      <span className="ml-2">
                        {getStatusBadge(announcement.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {announcement.content}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>By {announcement.senderName}</span>
                      <span className="mx-2">•</span>
                      <span>
                        {formatDate(
                          announcement.sentAt || announcement.createdAt
                        )}
                      </span>
                      {announcement.scheduledFor && (
                        <>
                          <span className="mx-2">•</span>
                          <span>
                            Scheduled for{' '}
                            {formatDate(announcement.scheduledFor)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <i className="fas fa-chevron-right text-gray-400"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Announcement Detail */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedAnnouncement.title}
                </h2>
                <div className="flex items-center space-x-2 mb-2">
                  {getPriorityBadge(selectedAnnouncement.priority || 'normal')}
                  {getStatusBadge(selectedAnnouncement.status)}
                </div>
                <p className="text-sm text-gray-600">
                  By {selectedAnnouncement.senderName} •{' '}
                  {formatDate(
                    selectedAnnouncement.sentAt ||
                      selectedAnnouncement.createdAt
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="prose max-w-none mb-6">
              <div className="whitespace-pre-wrap text-gray-800">
                {selectedAnnouncement.content}
              </div>
            </div>

            {canCreateAnnouncements() && (
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                  onClick={() =>
                    navigate(`/communications/${selectedAnnouncement._id}/edit`)
                  }
                >
                  <i className="fas fa-edit mr-2"></i>
                  Edit
                </button>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                  onClick={() =>
                    navigate(
                      `/communications/${selectedAnnouncement._id}/details`
                    )
                  }
                >
                  <i className="fas fa-chart-line mr-2"></i>
                  View Stats
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsInterface;
