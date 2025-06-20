import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import connectDB from './config/db';
import fileUpload from 'express-fileupload'; // Import express-fileupload
import path from 'path';
import ensureAssets from './utils/ensureAssets';
import './config/redis'; // Import Redis configuration
import SocketService from './services/socket.service';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Ensure assets (logo, etc.) are available
ensureAssets();

const app: Express = express();
const PORT = process.env.PORT || 5000;

console.log('Starting backend index.ts');

// Defensive middleware to block requests with a path that looks like a full URL
app.use(((req, res, next) => {
  if (/^\/https?:\/\//.test(req.path)) {
    console.error('Blocked suspicious request path:', req.method, req.path);
    return res.status(400).json({ error: 'Invalid request path' });
  }
  next();
}) as express.RequestHandler);

console.log('Registering CORS middleware');
// Middleware
const corsOptions = {
  origin: [
    'https://acpnotazone.org',
    'https://www.acpnotazone.org',
    'https://acpn-ota-zone.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

console.log('Registering static frontend dist');
app.use(express.static(path.join(__dirname, "../../frontend/dist"))); 

console.log('Registering express.json middleware');
// Body parsing middleware
app.use(express.json()); // Add this line to parse JSON bodies

// Create uploads directory if it doesn't exist
import fs from 'fs';
const uploadDir = path.join(__dirname, '../uploads/receipts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory:', uploadDir);
}

console.log('Registering /api/static');
// Static file serving - must come before fileUpload middleware
import staticFilesRouter from './routes/static.routes';
app.use('/api/static', staticFilesRouter); // Map to /api/static to match frontend URL

console.log('Registering /api/payments (multer)');
// Routes
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import pharmacyRoutes from './routes/pharmacy.routes';
import documentRoutes from './routes/document.routes';
import organizationDocumentRoutes from './routes/organizationDocument.routes';
// NOTE: dueRoutes and donationRoutes are excluded here to avoid circular dependencies
// They are accessible through pharmacyRoutes with nested routing
import dueTypeRoutes from './routes/dueType.routes';
import paymentRoutes from './routes/payment.routes'; // Import paymentRoutes here
import eventRoutes from './routes/event.routes';
import electionRoutes from './routes/election.routes';
import pollRoutes from './routes/poll.routes';
import communicationRoutes from './routes/communication.routes';
import financialRecordRoutes from './routes/financialRecord.routes';
import permissionRoutes from './routes/permission.routes';
import roleRoutes from './routes/role.routes';
import userManagementRoutes from './routes/userManagement.routes';
import dashboardRoutes from './routes/dashboard.routes';
import memberDashboardRoutes from './routes/memberDashboard.routes';
import messageRoutes from './routes/message.routes';
import notificationRoutes from './routes/notification.routes';

// Register paymentRoutes (which uses multer) BEFORE global fileupload or general body parsers
app.use('/api/payments', paymentRoutes);

console.log('Registering express-fileupload');
// File upload middleware for organization documents (express-fileupload)
// This should ideally not be global or be placed after routes using other parsers like multer
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    abortOnLimit: true,
  })
);

console.log('Registering / route');
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

console.log('Registering /api/health-check');
// Health check endpoint
app.get('/api/health-check', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running and healthy',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  });
});

console.log('Registering API routes');
// Define API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/organization-documents', organizationDocumentRoutes);
// NOTE: /api/dues and /api/donations are now accessible through /api/pharmacies/:pharmacyId/dues and /api/pharmacies/:pharmacyId/donations
app.use('/api/due-types', dueTypeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/financial-records', financialRecordRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/member-dashboard', memberDashboardRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

console.log('Registering catchall * route');
// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

console.log('Registering express.urlencoded middleware');
// General body parsers - place them after specific multipart handlers if possible,
// or ensure they don't process multipart/form-data if other handlers are meant to.
app.use(express.urlencoded({ extended: true }));

console.log('Registering error handlers');
// Error Handling Middlewares
import { notFound, errorHandler } from './middleware/error.middleware';

// Global unhandled promise rejection handler
process.on('unhandledRejection', (err: any) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Global uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

app.use(notFound);
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const socketService = new SocketService(server);

// Make socket service available globally
declare global {
  var socketService: SocketService;
}
global.socketService = socketService;

console.log('About to start server...');
// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.io enabled for real-time messaging`);
});

export default app;
