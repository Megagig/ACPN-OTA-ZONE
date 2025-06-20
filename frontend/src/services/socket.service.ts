import { io } from 'socket.io-client';
import { getEnvVar } from '../utils/env';

class SocketService {
  private socket: any = null;
  private messageHandlers: ((message: any) => void)[] = [];
  private typingHandlers: ((userId: string, threadId: string, isTyping: boolean) => void)[] = [];
  private threadUpdateHandlers: ((thread: any) => void)[] = [];

  connect(token: string): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(getEnvVar('VITE_API_URL', 'http://localhost:5000'), {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('message', (message: any) => {
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.socket.on('typing', (data: { userId: string; threadId: string; isTyping: boolean }) => {
      this.typingHandlers.forEach(handler => handler(data.userId, data.threadId, data.isTyping));
    });

    this.socket.on('thread_update', (thread: any) => {
      this.threadUpdateHandlers.forEach(handler => handler(thread));
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('disconnect', (reason: any) => {
      console.log('Disconnected from socket server:', reason);
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  // Message methods
  sendMessage(threadId: string, content: string): void {
    if (this.socket) {
      this.socket.emit('send_message', { threadId, content });
    }
  }

  sendTyping(threadId: string, isTyping: boolean): void {
    if (this.socket) {
      this.socket.emit('typing', { threadId, isTyping });
    }
  }

  onMessage(handler: (message: any) => void): void {
    this.messageHandlers.push(handler);
  }

  offMessage(handler: (message: any) => void): void {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  onTyping(handler: (userId: string, threadId: string, isTyping: boolean) => void): void {
    this.typingHandlers.push(handler);
  }

  offTyping(handler: (userId: string, threadId: string, isTyping: boolean) => void): void {
    this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
  }

  onThreadUpdate(handler: (thread: any) => void): void {
    this.threadUpdateHandlers.push(handler);
  }

  offThreadUpdate(handler: (thread: any) => void): void {
    this.threadUpdateHandlers = this.threadUpdateHandlers.filter(h => h !== handler);
  }

  // Room management
  joinRoom(roomId: string): void {
    if (this.socket) {
      this.socket.emit('join_room', { roomId });
    }
  }

  leaveRoom(roomId: string): void {
    if (this.socket) {
      this.socket.emit('leave_room', { roomId });
    }
  }

  // Thread management
  joinThread(threadId: string): void {
    if (this.socket) {
      this.socket.emit('join_thread', { threadId });
    }
  }

  leaveThread(threadId: string): void {
    if (this.socket) {
      this.socket.emit('leave_thread', { threadId });
    }
  }

  // User status
  setUserStatus(status: 'online' | 'offline' | 'away'): void {
    if (this.socket) {
      this.socket.emit('set_status', { status });
    }
  }

  // Notification methods
  markMessageAsRead(messageId: string): void {
    if (this.socket) {
      this.socket.emit('mark_read', { messageId });
    }
  }

  markThreadAsRead(threadId: string): void {
    if (this.socket) {
      this.socket.emit('mark_thread_read', { threadId });
    }
  }

  // File upload progress
  onFileUploadProgress(handler: (progress: number) => void): void {
    if (this.socket) {
      this.socket.on('file_upload_progress', handler);
    }
  }

  // Connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): any {
    return this.socket;
  }

  // Reconnection
  reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    }
  }

  // Manual event emission for testing
  emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Listen to custom events
  on(event: string, handler: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  // Remove custom event listeners
  off(event: string, handler?: (data: any) => void): void {
    if (this.socket) {
      if (handler) {
        this.socket.off(event, handler);
      } else {
        this.socket.off(event);
      }
    }
  }
}

export default SocketService;
