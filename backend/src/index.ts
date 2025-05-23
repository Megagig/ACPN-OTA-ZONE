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

app.get('/', (req: Request, res: Response) => {
  res.send('ACPN OTA Zone API is running...');
});

app.use('/api/users', userRoutes);

// Error Handling Middlewares
import { notFound, errorHandler } from './middleware/error.middleware';
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
