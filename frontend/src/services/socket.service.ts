import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryCount = 0;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // If already connecting or connected, resolve immediately
      if (this.isConnected && this.socket?.connected) {
        console.log('Socket already connected');
        resolve();
        return;
      }

      // Disconnect existing socket if any
      if (this.socket) {
        this.socket.disconnect();
      }

      const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      console.log(
        `Connecting to socket server at ${serverUrl} (attempt ${
          this.retryCount + 1
        }/${this.maxRetries})`
      );

      this.socket = io(serverUrl, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
        timeout: 10000, // 10 second timeout
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
      });

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        console.error('Socket connection timeout');
        this.isConnected = false;
        if (this.socket) {
          this.socket.disconnect();
        }
        reject(new Error('Connection timeout'));
      }, 15000); // 15 second timeout

      this.socket.on('connect', () => {
        console.log(
          'Connected to messaging server with socket ID:',
          this.socket?.id
        );
        this.isConnected = true;
        this.retryCount = 0; // Reset retry count on successful connection

        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }

        this.socket?.emit('user_online');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message || error);
        this.isConnected = false;

        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }

        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from messaging server:', reason);
        this.isConnected = false;

        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
      });

      // Handle authentication errors
      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
        this.isConnected = false;

        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }

        reject(new Error(error.message || 'Socket connection failed'));
      });
    });
  }

  disconnect() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.retryCount = 0;
    }
  }

  // Thread management
  joinThread(threadId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_thread', threadId);
    }
  }

  leaveThread(threadId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_thread', threadId);
    }
  }

  // Message handling
  sendMessage(threadId: string, message: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', {
        threadId,
        message,
      });
    }
  }

  // Typing indicators
  startTyping(threadId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', { threadId });
    }
  }

  stopTyping(threadId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', { threadId });
    }
  }

  // Event listeners
  onNewMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onUserTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onUserStoppedTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_stopped_typing', callback);
    }
  }

  onUserStatusChange(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_status_change', callback);
    }
  }

  onJoinedThread(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('joined_thread', callback);
    }
  }

  // Remove event listeners
  offNewMessage(callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off('new_message', callback);
    }
  }

  offUserTyping(callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off('user_typing', callback);
    }
  }

  offUserStoppedTyping(callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off('user_stopped_typing', callback);
    }
  }

  offUserStatusChange(callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off('user_status_change', callback);
    }
  }

  offJoinedThread(callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off('joined_thread', callback);
    }
  }

  // Utility methods
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
