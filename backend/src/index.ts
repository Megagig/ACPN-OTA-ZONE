import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import fileUpload from 'express-fileupload'; // Import express-fileupload
import path from 'path';
import ensureAssets from './utils/ensureAssets';
import './config/redis'; // Import Redis configuration

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Ensure assets (logo, etc.) are available
ensureAssets();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? ['https://acpnotazone.org', 'https://www.acpnotazone.org']
      : [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:5174',
        ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Create uploads directory if it doesn't exist
import fs from 'fs';
const uploadDir = path.join(__dirname, '../uploads/receipts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory:', uploadDir);
}

// Static file serving - must come before fileUpload middleware
import staticFilesRouter from './routes/static.routes';
app.use('/api/static', staticFilesRouter); // Map to /api/static to match frontend URL

// Routes
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import pharmacyRoutes from './routes/pharmacy.routes';
import documentRoutes from './routes/document.routes';
import organizationDocumentRoutes from './routes/organizationDocument.routes';
import dueRoutes from './routes/due.routes';
import dueTypeRoutes from './routes/dueType.routes';
import paymentRoutes from './routes/payment.routes'; // Import paymentRoutes here
import donationRoutes from './routes/donation.routes';
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
import cacheRoutes from './routes/cache.routes';

// Register paymentRoutes (which uses multer) BEFORE global fileupload or general body parsers
app.use('/api/payments', paymentRoutes);

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

// Routes
app.get('/', (req: Request, res: Response) => {
  res.send('ACPN OTA Zone API is running...');
});

// Health check endpoint
app.get('/api/health-check', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running and healthy',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/organization-documents', organizationDocumentRoutes);
app.use('/api/dues', dueRoutes);
app.use('/api/due-types', dueTypeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/donations', donationRoutes);
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
app.use('/api/cache', cacheRoutes);

// General body parsers - place them after specific multipart handlers if possible,
// or ensure they don't process multipart/form-data if other handlers are meant to.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
