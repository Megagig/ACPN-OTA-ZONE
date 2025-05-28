// Static file server middleware
import express from 'express';
import path from 'path';

const staticFilesRouter = express.Router();

// Serve uploaded receipts from the uploads directory
staticFilesRouter.use(
  '/receipts',
  express.static(path.join(__dirname, '../../uploads/receipts'))
);

// Serve assets from the assets directory
staticFilesRouter.use(
  '/assets',
  express.static(path.join(__dirname, '../assets'))
);

// Log directory paths for debugging
console.log(
  'Serving receipts from:',
  path.join(__dirname, '../../uploads/receipts')
);
console.log('Serving assets from:', path.join(__dirname, '../assets'));

export default staticFilesRouter;
