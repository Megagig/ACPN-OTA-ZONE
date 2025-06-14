import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import messageService, {
  type MessageThread,
  type ThreadMessage,
} from '../../services/message.service';
import socketService from '../../services/socket.service';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const MessagingInterface = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, fetchNotifications, markAsRead } =
    useNotification();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(
    null
  );
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newThreadData, setNewThreadData] = useState({
    recipient: '',
    subject: '',
    message: '',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchThreads();
    fetchNotifications(); // Fetch recent notifications
  }, []);

  useEffect(() => {
    // Scroll to the bottom of the messages when they change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedThread?.messages]);

  const fetchThreads = async () => {
    setIsLoading(true);
    try {
      const data = await messageService.getThreads();
      setThreads(data);

      // Select the first thread by default if any exist
      if (data.length > 0 && !selectedThread) {
        await selectThread(data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectThread = async (threadId: string) => {
    try {
      const thread = await messageService.getThread(threadId);
      setSelectedThread(thread);

      // Mark thread as read
      await messageService.markThreadAsRead(threadId);

      // Update unread count in threads list
      setThreads((prev) =>
        prev.map((t) => (t._id === threadId ? { ...t, unreadCount: 0 } : t))
      );
    } catch (error) {
      console.error('Error fetching thread:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    setIsSending(true);
    try {
      const sentMessage = await messageService.sendMessage(selectedThread._id, {
        content: newMessage,
        messageType: 'text',
      });

      // Update the thread with the new message
      setSelectedThread((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          messages: [...(prev.messages || []), sentMessage],
          lastMessage: newMessage,
          lastMessageAt: sentMessage.createdAt,
        };
      });

      // Update threads list
      setThreads((prev) =>
        prev.map((t) =>
          t._id === selectedThread._id
            ? {
                ...t,
                lastMessage: newMessage,
                lastMessageAt: sentMessage.createdAt,
              }
            : t
        )
      );

      // Clear input
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateThread = async () => {
    if (
      !newThreadData.recipient.trim() ||
      !newThreadData.subject.trim() ||
      !newThreadData.message.trim()
    ) {
      return;
    }

    setIsSending(true);
    try {
      const newThread = await messageService.createThread({
        subject: newThreadData.subject,
        participants: [newThreadData.recipient],
        message: newThreadData.message,
        threadType: 'direct',
      });

      // Add the new thread to the list
      setThreads((prev) => [newThread, ...prev]);

      // Select the new thread
      setSelectedThread(newThread);

      // Reset form and hide it
      setNewThreadData({
        recipient: '',
        subject: '',
        message: '',
      });
      setShowNewThreadForm(false);
    } catch (error) {
      console.error('Error creating thread:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle user search for recipient
  const handleSearchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await messageService.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // If it's today, show time only
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    // If it's yesterday, show "Yesterday"
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    // If it's this year, show month and day
    if (messageDate.getFullYear() === today.getFullYear()) {
      return messageDate.toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
      });
    }

    // Otherwise show full date
    return messageDate.toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get the other participant's name
  const getOtherParticipantName = (thread: MessageThread) => {
    if (!user) return 'Unknown';

    // Find the participant that's not the current user
    const otherParticipant = thread.participantDetails?.find(
      (participant) => participant._id !== user._id
    );

    if (otherParticipant) {
      return `${otherParticipant.firstName} ${otherParticipant.lastName}`;
    }

    // Fallback to participant IDs if details not populated
    const otherParticipantId = thread.participants.find(
      (participantId) => participantId !== user._id
    );

    return otherParticipantId || 'Unknown User';
  };

  // Socket.io integration
  useEffect(() => {
    const initializeSocket = async () => {
      if (user && socketService.getConnectionStatus()) {
        // Setup real-time message listener
        socketService.onNewMessage(handleNewMessage);

        // Setup typing indicators
        socketService.onUserTyping(handleUserTyping);
        socketService.onUserStoppedTyping(handleUserStoppedTyping);
      } else {
        console.log(
          'Socket not connected or user not authenticated in Messaging Interface'
        );
      }
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      socketService.offNewMessage(handleNewMessage);
      socketService.offUserTyping(handleUserTyping);
      socketService.offUserStoppedTyping(handleUserStoppedTyping);
      socketService.disconnect();
    };
  }, [user]);

  // Join thread room when thread is selected
  useEffect(() => {
    if (selectedThread && socketService.getConnectionStatus()) {
      socketService.joinThread(selectedThread._id);

      return () => {
        socketService.leaveThread(selectedThread._id);
      };
    }
  }, [selectedThread]);

  // Real-time message handler
  const handleNewMessage = useCallback(
    (data: any) => {
      const { message, threadId } = data;

      // Update the selected thread if it matches
      if (selectedThread && selectedThread._id === threadId) {
        setSelectedThread((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...(prev.messages || []), message],
            lastMessage: message.content,
            lastMessageAt: message.createdAt,
          };
        });
      }

      // Update threads list
      setThreads((prev) =>
        prev.map((t) =>
          t._id === threadId
            ? {
                ...t,
                lastMessage: message.content,
                lastMessageAt: message.createdAt,
                unreadCount:
                  selectedThread?._id === threadId
                    ? 0
                    : (t.unreadCount || 0) + 1,
              }
            : t
        )
      );
    },
    [selectedThread]
  );

  // Typing indicator handlers
  const handleUserTyping = useCallback((data: any) => {
    // Implement typing indicator UI
    console.log('User typing:', data);
  }, []);

  const handleUserStoppedTyping = useCallback((data: any) => {
    // Implement typing indicator UI
    console.log('User stopped typing:', data);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Communications</h1>
        <div className="flex space-x-2">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow"
            onClick={() => navigate('/notifications')}
          >
            <i className="fas fa-bell mr-2"></i>
            View All Notifications
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow"
            onClick={() => setShowNewThreadForm(true)}
          >
            <i className="fas fa-plus mr-2"></i>
            New Message
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

      {/* Recent Notifications Section */}
      {notifications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-blue-800">
              <i className="fas fa-bell mr-2"></i>
              Recent Notifications
            </h3>
            <button
              onClick={() => navigate('/notifications')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <div
                key={notification._id}
                className={`p-3 rounded-md border ${
                  notification.isRead
                    ? 'bg-white border-gray-200'
                    : 'bg-blue-100 border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="ml-3 text-blue-600 hover:text-blue-800 text-xs"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Thread Form Modal */}
      {showNewThreadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">New Message</h3>
              <button
                onClick={() => setShowNewThreadForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <label
                  htmlFor="recipient"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Recipient <span className="text-red-500">*</span>
                </label>
                <input
                  id="recipient"
                  type="text"
                  className="border border-gray-300 rounded-md shadow-sm p-2 w-full"
                  placeholder="Search for users..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearchUsers(e.target.value);
                  }}
                />

                {/* Search Results Dropdown */}
                {searchQuery && (searchResults.length > 0 || isSearching) && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-3 text-center text-gray-500">
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Searching...
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <div
                          key={user._id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            setNewThreadData({
                              ...newThreadData,
                              recipient: user._id,
                            });
                            setSearchQuery(
                              `${user.firstName} ${user.lastName}`
                            );
                            setSearchResults([]);
                          }}
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-3">
                              {user.firstName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500">
                        No users found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  className="border border-gray-300 rounded-md shadow-sm p-2 w-full"
                  placeholder="Message subject"
                  value={newThreadData.subject}
                  onChange={(e) =>
                    setNewThreadData({
                      ...newThreadData,
                      subject: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="border border-gray-300 rounded-md shadow-sm p-2 w-full"
                  placeholder="Type your message here..."
                  value={newThreadData.message}
                  onChange={(e) =>
                    setNewThreadData({
                      ...newThreadData,
                      message: e.target.value,
                    })
                  }
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm"
                  onClick={() => setShowNewThreadForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                  onClick={handleCreateThread}
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
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex h-[calc(75vh-4rem)]">
          {/* Threads Sidebar */}
          <div className="w-1/3 border-r overflow-y-auto">
            <div className="p-4 border-b">
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Search messages..."
              />
            </div>

            {isLoading ? (
              <div className="animate-pulse p-4 space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No messages yet
              </div>
            ) : (
              <div>
                {threads.map((thread) => (
                  <div
                    key={thread._id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedThread?._id === thread._id ? 'bg-indigo-50' : ''
                    }`}
                    onClick={() => selectThread(thread._id)}
                  >
                    <div className="flex items-center mb-1">
                      <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mr-3">
                        {getOtherParticipantName(thread).charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getOtherParticipantName(thread)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(
                              thread.lastMessageAt || thread.updatedAt
                            )}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {thread.subject}
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      <p className="text-sm text-gray-600 truncate flex-1">
                        {thread.lastMessage}
                      </p>
                      {thread.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="w-2/3 flex flex-col">
            {selectedThread ? (
              <>
                {/* Thread Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {getOtherParticipantName(selectedThread)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedThread.subject}
                    </p>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {selectedThread.messages?.map((message: ThreadMessage) => (
                    <div
                      key={message._id}
                      className={`flex mb-4 ${
                        user && message.senderId === user._id
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
                          user && message.senderId === user._id
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(message.createdAt)}
                          {message.readBy.length > 0 &&
                            user &&
                            message.senderId === user._id && (
                              <span className="ml-2 text-blue-500">
                                <i className="fas fa-check-double"></i>
                              </span>
                            )}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef}></div>
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === 'Enter' && handleSendMessage()
                      }
                    />
                    <button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                      onClick={handleSendMessage}
                      disabled={isSending || !newMessage.trim()}
                    >
                      {isSending ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-paper-plane"></i>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 text-5xl mb-4">
                    <i className="fas fa-comments"></i>
                  </div>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    No conversation selected
                  </h3>
                  <p className="text-gray-500">
                    Select a conversation from the sidebar or start a new one
                  </p>
                  <button
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm"
                    onClick={() => setShowNewThreadForm(true)}
                  >
                    <i className="fas fa-plus mr-2"></i>
                    New Message
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingInterface;
