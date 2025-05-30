"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Static file server middleware
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const staticFilesRouter = express_1.default.Router();
// Serve uploaded receipts from the uploads directory
staticFilesRouter.use('/receipts', express_1.default.static(path_1.default.join(__dirname, '../../uploads/receipts')));
// Serve assets from the assets directory
staticFilesRouter.use('/assets', express_1.default.static(path_1.default.join(__dirname, '../assets')));
// Log directory paths for debugging
console.log('Serving receipts from:', path_1.default.join(__dirname, '../../uploads/receipts'));
console.log('Serving assets from:', path_1.default.join(__dirname, '../assets'));
exports.default = staticFilesRouter;
