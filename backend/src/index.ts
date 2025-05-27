import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import fileUpload from 'express-fileupload'; // Import express-fileupload
import path from 'path';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
import fs from 'fs';
const uploadDir = path.join(__dirname, '../uploads/receipts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory:', uploadDir);
}

// Static file serving - must come before fileUpload middleware
import staticFilesRouter from './routes/static.routes';
app.use('/static', staticFilesRouter);

// File upload middleware - only use one of these (multer is configured in the routes)
// Comment out express-fileupload to avoid conflicts with multer
// app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));

// Routes
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import pharmacyRoutes from './routes/pharmacy.routes';
import documentRoutes from './routes/document.routes';
import dueRoutes from './routes/due.routes';
import dueTypeRoutes from './routes/dueType.routes';
import paymentRoutes from './routes/payment.routes';
import donationRoutes from './routes/donation.routes';
import eventRoutes from './routes/event.routes';
import electionRoutes from './routes/election.routes';
import pollRoutes from './routes/poll.routes';
import communicationRoutes from './routes/communication.routes';
import financialRecordRoutes from './routes/financialRecord.routes';

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
app.use('/api/dues', dueRoutes);
app.use('/api/due-types', dueTypeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/financial-records', financialRecordRoutes);

// Error Handling Middlewares
import { notFound, errorHandler } from './middleware/error.middleware';
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
