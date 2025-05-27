// Static file server middleware
import express from 'express';
import path from 'path';

const staticFilesRouter = express.Router();

// Serve uploaded receipts from the uploads directory
staticFilesRouter.use(
  '/receipts',
  express.static(path.join(__dirname, '../../uploads/receipts'))
);

// Log directory path for debugging
console.log(
  'Serving static files from:',
  path.join(__dirname, '../../uploads/receipts')
);

export default staticFilesRouter;
