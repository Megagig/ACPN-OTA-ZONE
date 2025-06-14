"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const threadParticipant_model_1 = __importDefault(require("../models/threadParticipant.model"));
class SocketService {
    constructor(server) {
        this.connectedUsers = new Map(); // userId -> socketId
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:5173',
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });
        this.setupMiddleware();
        this.setupEventHandlers();
    }
    setupMiddleware() {
        // Authentication middleware for socket connections
        this.io.use((socket, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const token = socket.handshake.auth.token ||
                    ((_a = socket.handshake.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]);
                if (!token) {
                    return next(new Error('Authentication token required'));
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const user = yield user_model_1.default.findById(decoded.id).select('-password');
                if (!user) {
                    return next(new Error('User not found'));
                }
                socket.userId = user._id.toString();
                socket.user = user;
                next();
            }
            catch (error) {
                console.error('Socket authentication error:', error);
                next(new Error('Authentication failed'));
            }
        }));
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
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
            socket.on('join_thread', (threadId) => {
                this.handleJoinThread(socket, threadId);
            });
            // Handle leaving a specific thread
            socket.on('leave_thread', (threadId) => {
                socket.leave(`thread:${threadId}`);
            });
            // Handle sending a message
            socket.on('send_message', (data) => {
                this.handleSendMessage(socket, data);
            });
            // Handle typing indicators
            socket.on('typing_start', (data) => {
                this.handleTypingStart(socket, data);
            });
            socket.on('typing_stop', (data) => {
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
        });
    }
    joinUserThreads(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!socket.userId)
                    return;
                // Get all threads where user is a participant
                const participations = yield threadParticipant_model_1.default.find({
                    userId: socket.userId,
                    isActive: true,
                });
                // Join all thread rooms
                participations.forEach((participation) => {
                    socket.join(`thread:${participation.threadId}`);
                });
            }
            catch (error) {
                console.error('Error joining user threads:', error);
            }
        });
    }
    handleJoinThread(socket, threadId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!socket.userId)
                    return;
                // Verify user is participant in this thread
                const participation = yield threadParticipant_model_1.default.findOne({
                    threadId,
                    userId: socket.userId,
                    isActive: true,
                });
                if (participation) {
                    socket.join(`thread:${threadId}`);
                    socket.emit('joined_thread', { threadId });
                }
                else {
                    socket.emit('error', { message: 'Not authorized to join this thread' });
                }
            }
            catch (error) {
                console.error('Error joining thread:', error);
                socket.emit('error', { message: 'Failed to join thread' });
            }
        });
    }
    handleSendMessage(socket, data) {
        const { threadId, message } = data;
        // Broadcast the message to all participants in the thread
        socket.to(`thread:${threadId}`).emit('new_message', {
            threadId,
            message,
            senderId: socket.userId,
            timestamp: new Date(),
        });
    }
    handleTypingStart(socket, data) {
        var _a, _b;
        const { threadId } = data;
        socket.to(`thread:${threadId}`).emit('user_typing', {
            threadId,
            userId: socket.userId,
            user: {
                firstName: (_a = socket.user) === null || _a === void 0 ? void 0 : _a.firstName,
                lastName: (_b = socket.user) === null || _b === void 0 ? void 0 : _b.lastName,
            },
        });
    }
    handleTypingStop(socket, data) {
        const { threadId } = data;
        socket.to(`thread:${threadId}`).emit('user_stopped_typing', {
            threadId,
            userId: socket.userId,
        });
    }
    broadcastUserStatus(userId, status) {
        this.io.emit('user_status_change', {
            userId,
            status,
            timestamp: new Date(),
        });
    }
    // Public methods for emitting events from controllers
    emitToUser(userId, event, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit(event, data);
        }
    }
    emitToThread(threadId, event, data) {
        this.io.to(`thread:${threadId}`).emit(event, data);
    }
    emitToAllUsers(event, data) {
        this.io.emit(event, data);
    }
    getConnectedUsers() {
        return Array.from(this.connectedUsers.keys());
    }
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }
}
exports.default = SocketService;
