import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      this.socket = io(serverUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to messaging server');
        this.isConnected = true;
        this.socket?.emit('user_online');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from messaging server');
        this.isConnected = false;
      });

      // Handle authentication errors
      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
        reject(new Error(error.message || 'Socket connection failed'));
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
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
        message
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
