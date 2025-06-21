import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Heading,
  Avatar,
  Badge,
  Divider,
  IconButton,
  Container,
  VStack,
  HStack,
  Spinner,
  useToast,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Textarea,
  FormControl,
  FormLabel,
  Tooltip,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Icon
} from '@chakra-ui/react';
import {
  SearchIcon,
  BellIcon,
  ChatIcon,
  CheckIcon,
  AddIcon,
  ChevronRightIcon,
} from '@chakra-ui/icons';
import { FaPaperPlane, FaComments } from 'react-icons/fa';
import messageService, {
  type MessageThread,
  type ThreadMessage,
} from '../../services/message.service';
import SocketService from '../../services/socket.service';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import DashboardLayout from '../../components/layout/DashboardLayout';

const MessagingInterface = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { notifications, unreadCount, fetchNotifications, markAsRead } = useNotification();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
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
  const socketService = useRef(new SocketService());

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const inputBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const senderMsgBg = useColorModeValue('blue.50', 'blue.800');
  const recipientMsgBg = useColorModeValue('gray.100', 'gray.700');
  const notificationBg = useColorModeValue('blue.50', 'blue.900');
  const notificationBorder = useColorModeValue('blue.200', 'blue.700');

  useEffect(() => {
    fetchThreads();
    fetchNotifications();
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
      toast({
        title: 'Error loading messages',
        description: 'There was a problem fetching your messages. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
      toast({
        title: 'Error loading conversation',
        description: 'There was a problem fetching this conversation. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
      toast({
        title: 'Error sending message',
        description: 'Your message could not be sent. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
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
      
      toast({
        title: 'Message sent',
        description: 'Your new conversation has been created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating thread:', error);
      toast({
        title: 'Error starting conversation',
        description: 'Your message could not be sent. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
      toast({
        title: 'Search error',
        description: 'Could not search for users. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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
    }    // If it's this year, show month and day
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
    if (user && socketService.current.isConnected()) {
      socketService.current.onMessage(handleNewMessage);
      socketService.current.onTyping(handleUserTyping);
    }

    return () => {
      socketService.current.offMessage(handleNewMessage);
      socketService.current.offTyping(handleUserTyping);
    };
  }, [user]);

  // Join thread room when thread is selected
  useEffect(() => {
    if (selectedThread && socketService.current.isConnected()) {
      socketService.current.joinThread(selectedThread._id);
    }

    return () => {
      if (selectedThread) {
        socketService.current.leaveThread(selectedThread._id);
      }
    };
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
  return (
    <DashboardLayout>
      <Container maxW="container.xl" p={{ base: 2, md: 4 }}>
        {/* Page Header */}
        <Flex 
          justify="space-between" 
          align={{ base: "start", md: "center" }} 
          mb={6}
          direction={{ base: "column", md: "row" }}
          gap={{ base: 4, md: 0 }}
        >
          <Box>
            <Heading as="h1" size="xl" fontWeight="bold">
              Messaging
            </Heading>
            <Text color={mutedTextColor} mt={1}>
              Communicate with other members and administrators
            </Text>
          </Box>
          <HStack spacing={3}>
            <Button
              leftIcon={<BellIcon />}
              colorScheme="blue"
              variant="outline"
              size="md"
              onClick={() => navigate('/notifications')}
            >
              Notifications
              {unreadCount > 0 && (
                <Badge ml={2} colorScheme="red" borderRadius="full">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              size="md"
              onClick={() => setShowNewThreadForm(true)}
            >
              New Message
            </Button>
          </HStack>
        </Flex>

        {/* Recent Notifications Section */}
        {notifications.length > 0 && (
          <Card bg={notificationBg} borderColor={notificationBorder} mb={6} variant="outline">
            <CardHeader py={3} px={4}>
              <Flex justify="space-between" align="center">
                <Heading size="sm" display="flex" alignItems="center">
                  <BellIcon mr={2} />
                  Recent Notifications
                </Heading>
                <Button 
                  size="sm" 
                  variant="link" 
                  rightIcon={<ChevronRightIcon />}
                  onClick={() => navigate('/notifications')}
                >
                  View All
                </Button>
              </Flex>
            </CardHeader>
            <CardBody pt={0} px={4} pb={4}>
              <SimpleGrid spacing={3}>
                {notifications.slice(0, 3).map((notification) => (
                  <Box
                    key={notification._id}
                    p={3}
                    borderRadius="md"
                    bg={notification.isRead ? 'white' : 'blue.100'}
                    _dark={{
                      bg: notification.isRead ? 'gray.700' : 'blue.800',
                    }}
                    borderWidth="1px"
                    borderColor={notification.isRead ? borderColor : 'blue.300'}
                  >
                    <Flex justify="space-between" align="flex-start">
                      <Box>
                        <Text fontWeight="medium">{notification.title}</Text>
                        <Text fontSize="sm" mt={1}>{notification.message}</Text>
                        <Text fontSize="xs" color={mutedTextColor} mt={2}>
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </Text>
                      </Box>
                      {!notification.isRead && (
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => markAsRead(notification._id)}
                        >
                          Mark read
                        </Button>
                      )}
                    </Flex>
                  </Box>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>
        )}

        {/* Main Messaging Interface */}
        <Card 
          bg={cardBg} 
          shadow="md" 
          borderRadius="lg" 
          overflow="hidden"
          height={{ base: 'auto', md: '75vh' }}
        >
          <Flex 
            direction={{ base: 'column', md: 'row' }} 
            h={{ base: 'auto', md: '100%' }}
          >
            {/* Threads Sidebar */}
            <Box 
              width={{ base: '100%', md: '35%', lg: '30%' }} 
              borderRight="1px" 
              borderColor={borderColor}
              overflowY="auto"
              height={{ base: 'auto', md: '100%' }}
              maxHeight={{ base: '300px', md: '100%' }}
            >
              <Box p={3} borderBottom="1px" borderColor={borderColor}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input 
                    placeholder="Search messages..." 
                    bg={inputBg}
                    borderColor={borderColor}
                  />
                </InputGroup>
              </Box>

              {isLoading ? (
                <VStack py={10} spacing={4}>
                  <Spinner size="lg" color="blue.500" thickness="3px" />
                  <Text color={mutedTextColor}>Loading conversations...</Text>
                </VStack>              ) : threads.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Icon as={FaComments} boxSize={10} color="gray.400" mb={3} />
                  <Text fontWeight="medium" fontSize="lg">No messages yet</Text>
                  <Text color={mutedTextColor} mb={4}>Start a new conversation to begin messaging</Text>
                  <Button
                    colorScheme="blue"
                    leftIcon={<AddIcon />}
                    onClick={() => setShowNewThreadForm(true)}
                  >
                    New Message
                  </Button>
                </Box>
              ) : (
                <VStack spacing={0} align="stretch" divider={<Divider />}>
                  {threads.map((thread) => (
                    <Box
                      key={thread._id}
                      p={3}
                      cursor="pointer"
                      bg={selectedThread?._id === thread._id ? selectedBg : 'transparent'}
                      _hover={{ bg: selectedThread?._id === thread._id ? selectedBg : hoverBg }}
                      transition="background 0.2s"
                      onClick={() => selectThread(thread._id)}
                    >
                      <Flex align="center" mb={1}>
                        <Avatar 
                          size="sm" 
                          name={getOtherParticipantName(thread)} 
                          mr={3}
                          bg="blue.500"
                        />
                        <Box flex="1" minW={0}>
                          <Flex justify="space-between" align="center">
                            <Text fontWeight="medium" noOfLines={1}>
                              {getOtherParticipantName(thread)}
                            </Text>
                            <Text fontSize="xs" color={mutedTextColor}>
                              {formatDate(thread.lastMessageAt || thread.updatedAt)}
                            </Text>
                          </Flex>
                          <Text fontSize="xs" color={mutedTextColor} noOfLines={1}>
                            {thread.subject}
                          </Text>
                        </Box>
                      </Flex>
                      <Flex align="center">
                        <Text fontSize="sm" color={mutedTextColor} noOfLines={1} flex="1">
                          {thread.lastMessage}
                        </Text>
                        {thread.unreadCount > 0 && (
                          <Badge 
                            colorScheme="blue" 
                            borderRadius="full" 
                            ml={2}
                          >
                            {thread.unreadCount}
                          </Badge>
                        )}
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>

            {/* Messages Area */}
            <Box 
              width={{ base: '100%', md: '65%', lg: '70%' }} 
              display="flex" 
              flexDirection="column"
              height={{ base: 'auto', md: '100%' }}
            >
              {selectedThread ? (
                <>
                  {/* Thread Header */}
                  <Flex 
                    align="center" 
                    p={4} 
                    borderBottom="1px" 
                    borderColor={borderColor}
                  >
                    <Avatar 
                      size="sm" 
                      name={getOtherParticipantName(selectedThread)} 
                      mr={3}
                      bg="blue.500"
                    />
                    <Box>
                      <Text fontWeight="medium">
                        {getOtherParticipantName(selectedThread)}
                      </Text>
                      <Text fontSize="sm" color={mutedTextColor}>
                        {selectedThread.subject}
                      </Text>
                    </Box>
                  </Flex>

                  {/* Messages Container */}
                  <Box 
                    flex="1" 
                    p={4} 
                    overflowY="auto"
                    maxHeight={{ base: '300px', md: '60vh' }}
                  >
                    <VStack spacing={4} align="stretch">
                      {selectedThread.messages?.map((message: ThreadMessage) => (
                        <Flex
                          key={message._id}
                          justifyContent={user && message.senderId === user._id ? 'flex-end' : 'flex-start'}
                        >
                          <Box
                            maxW={{ base: '80%', md: '70%' }}
                            bg={user && message.senderId === user._id ? senderMsgBg : recipientMsgBg}
                            borderRadius="lg"
                            p={3}
                          >
                            <Text fontSize="sm">{message.content}</Text>
                            <Flex justify="flex-end" align="center" mt={1}>
                              <Text fontSize="xs" color={mutedTextColor} mr={1}>
                                {formatDate(message.createdAt)}
                              </Text>
                              {message.readBy.length > 0 && user && message.senderId === user._id && (
                                <CheckIcon color="blue.500" boxSize={3} />
                              )}
                            </Flex>
                          </Box>
                        </Flex>
                      ))}
                      <Box ref={messagesEndRef}></Box>
                    </VStack>
                  </Box>

                  {/* Message Input */}
                  <Flex 
                    p={3} 
                    borderTop="1px" 
                    borderColor={borderColor}
                    align="center"
                  >
                    <Input
                      placeholder="Type a message..."
                      mr={2}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      bg={inputBg}
                    />
                    <Tooltip label="Send message">
                      <IconButton
                        aria-label="Send message"
                        icon={isSending ? <Spinner size="sm" /> : <FaPaperPlane />}
                        colorScheme="blue"
                        isDisabled={isSending || !newMessage.trim()}
                        onClick={handleSendMessage}
                      />
                    </Tooltip>
                  </Flex>
                </>
              ) : (                <Flex
                  justify="center"
                  align="center"
                  height="100%"
                  p={8}
                >
                  <Box textAlign="center">
                    <Icon as={ChatIcon} boxSize={10} color="gray.400" mb={3} />
                    <Heading size="md" mb={2}>No conversation selected</Heading>
                    <Text color={mutedTextColor} mb={4}>
                      Select a conversation from the sidebar or start a new one
                    </Text>
                    <Button
                      colorScheme="blue"
                      leftIcon={<AddIcon />}
                      onClick={() => setShowNewThreadForm(true)}
                    >
                      New Message
                    </Button>
                  </Box>
                </Flex>
              )}
            </Box>
          </Flex>
        </Card>
      </Container>

      {/* New Thread Form Modal */}
      <Modal isOpen={showNewThreadForm} onClose={() => setShowNewThreadForm(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New Message</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Recipient</FormLabel>
                <Box position="relative">
                  <Input
                    placeholder="Search for users..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearchUsers(e.target.value);
                    }}
                  />
                  {searchQuery && (searchResults.length > 0 || isSearching) && (
                    <Box 
                      position="absolute" 
                      zIndex={1} 
                      width="100%" 
                      bg={cardBg}
                      border="1px" 
                      borderColor={borderColor} 
                      borderRadius="md" 
                      shadow="md" 
                      mt={1}
                      maxH="200px"
                      overflowY="auto"
                    >
                      {isSearching ? (
                        <Flex p={3} justify="center" align="center">
                          <Spinner size="sm" mr={2} />
                          <Text>Searching...</Text>
                        </Flex>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((user) => (
                          <Box
                            key={user._id}
                            p={3}
                            _hover={{ bg: hoverBg }}
                            cursor="pointer"
                            onClick={() => {
                              setNewThreadData({
                                ...newThreadData,
                                recipient: user._id,
                              });
                              setSearchQuery(`${user.firstName} ${user.lastName}`);
                              setSearchResults([]);
                            }}
                          >
                            <Flex align="center">
                              <Avatar 
                                size="xs"
                                name={`${user.firstName} ${user.lastName}`}
                                mr={2}
                              />
                              <Box>
                                <Text fontWeight="medium">
                                  {user.firstName} {user.lastName}
                                </Text>
                                <Text fontSize="xs" color={mutedTextColor}>
                                  {user.email}
                                </Text>
                              </Box>
                            </Flex>
                          </Box>
                        ))
                      ) : (
                        <Box p={3} textAlign="center">
                          <Text color={mutedTextColor}>No users found</Text>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </FormControl>
              
              <FormControl>
                <FormLabel>Subject</FormLabel>
                <Input
                  placeholder="Message subject"
                  value={newThreadData.subject}
                  onChange={(e) =>
                    setNewThreadData({
                      ...newThreadData,
                      subject: e.target.value,
                    })
                  }
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Message</FormLabel>
                <Textarea
                  placeholder="Type your message here..."
                  rows={4}
                  value={newThreadData.message}
                  onChange={(e) =>
                    setNewThreadData({
                      ...newThreadData,
                      message: e.target.value,
                    })
                  }
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowNewThreadForm(false)}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              leftIcon={isSending ? <Spinner size="sm" /> : <FaPaperPlane />}
              onClick={handleCreateThread}
              isLoading={isSending}
              loadingText="Sending"
            >
              Send
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
};

export default MessagingInterface;
