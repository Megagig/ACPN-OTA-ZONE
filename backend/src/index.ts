import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import pharmacyRoutes from './routes/pharmacy.routes';
import documentRoutes from './routes/document.routes';
import dueRoutes from './routes/due.routes';
import donationRoutes from './routes/donation.routes';
import eventRoutes from './routes/event.routes';
import electionRoutes from './routes/election.routes';
import pollRoutes from './routes/poll.routes';
import communicationRoutes from './routes/communication.routes';
import financialRecordRoutes from './routes/financialRecord.routes';

app.get('/', (req: Request, res: Response) => {
  res.send('ACPN OTA Zone API is running...');
});

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/dues', dueRoutes);
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
