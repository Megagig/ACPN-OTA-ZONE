import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import ThreadParticipant from '../models/threadParticipant.model';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

class SocketService {
  private io: Server;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware for socket connections
    this.io.use(async (socket: any, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = (user._id as any).toString();
        socket.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on(
      'connection',
      (socket: Socket & { userId?: string; user?: any }) => {
        console.log(`User ${socket.userId} connected to messaging`);

        // Store the user's socket connection
        if (socket.userId) {
          this.connectedUsers.set(socket.userId, socket.id);

          // Join user to their personal room
          socket.join(`user:${socket.userId}`);

          // Join user to all their thread rooms
          this.joinUserThreads(socket);
        }

        // Handle joining a specific thread
        socket.on('join_thread', (threadId: string) => {
          this.handleJoinThread(socket, threadId);
        });

        // Handle leaving a specific thread
        socket.on('leave_thread', (threadId: string) => {
          socket.leave(`thread:${threadId}`);
        });

        // Handle sending a message
        socket.on('send_message', (data: any) => {
          this.handleSendMessage(socket, data);
        });

        // Handle typing indicators
        socket.on('typing_start', (data: any) => {
          this.handleTypingStart(socket, data);
        });

        socket.on('typing_stop', (data: any) => {
          this.handleTypingStop(socket, data);
        });

        // Handle user presence
        socket.on('user_online', () => {
          if (socket.userId) {
            this.broadcastUserStatus(socket.userId, 'online');
          }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
          console.log(`User ${socket.userId} disconnected from messaging`);
          if (socket.userId) {
            this.connectedUsers.delete(socket.userId);
            this.broadcastUserStatus(socket.userId, 'offline');
          }
        });
      }
    );
  }

  private async joinUserThreads(
    socket: Socket & { userId?: string; user?: any }
  ) {
    try {
      if (!socket.userId) return;

      // Get all threads where user is a participant
      const participations = await ThreadParticipant.find({
        userId: socket.userId,
        isActive: true,
      });

      // Join all thread rooms
      participations.forEach((participation) => {
        socket.join(`thread:${participation.threadId}`);
      });
    } catch (error) {
      console.error('Error joining user threads:', error);
    }
  }

  private async handleJoinThread(
    socket: Socket & { userId?: string; user?: any },
    threadId: string
  ) {
    try {
      if (!socket.userId) return;

      // Verify user is participant in this thread
      const participation = await ThreadParticipant.findOne({
        threadId,
        userId: socket.userId,
        isActive: true,
      });

      if (participation) {
        socket.join(`thread:${threadId}`);
        socket.emit('joined_thread', { threadId });
      } else {
        socket.emit('error', { message: 'Not authorized to join this thread' });
      }
    } catch (error) {
      console.error('Error joining thread:', error);
      socket.emit('error', { message: 'Failed to join thread' });
    }
  }

  private handleSendMessage(
    socket: Socket & { userId?: string; user?: any },
    data: any
  ) {
    const { threadId, message } = data;

    // Broadcast the message to all participants in the thread
    socket.to(`thread:${threadId}`).emit('new_message', {
      threadId,
      message,
      senderId: socket.userId,
      timestamp: new Date(),
    });
  }

  private handleTypingStart(
    socket: Socket & { userId?: string; user?: any },
    data: any
  ) {
    const { threadId } = data;

    socket.to(`thread:${threadId}`).emit('user_typing', {
      threadId,
      userId: socket.userId,
      user: {
        firstName: socket.user?.firstName,
        lastName: socket.user?.lastName,
      },
    });
  }

  private handleTypingStop(
    socket: Socket & { userId?: string; user?: any },
    data: any
  ) {
    const { threadId } = data;

    socket.to(`thread:${threadId}`).emit('user_stopped_typing', {
      threadId,
      userId: socket.userId,
    });
  }

  private broadcastUserStatus(userId: string, status: 'online' | 'offline') {
    this.io.emit('user_status_change', {
      userId,
      status,
      timestamp: new Date(),
    });
  }

  // Public methods for emitting events from controllers
  public emitToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  public emitToThread(threadId: string, event: string, data: any) {
    this.io.to(`thread:${threadId}`).emit(event, data);
  }

  public emitToAllUsers(event: string, data: any) {
    this.io.emit(event, data);
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}

export default SocketService;
