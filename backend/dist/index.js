"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const db_1 = __importDefault(require("./config/db"));
const express_fileupload_1 = __importDefault(require("express-fileupload")); // Import express-fileupload
const path_1 = __importDefault(require("path"));
const ensureAssets_1 = __importDefault(require("./utils/ensureAssets"));
require("./config/redis"); // Import Redis configuration
const socket_service_1 = __importDefault(require("./services/socket.service"));
// Load environment variables
dotenv_1.default.config();
// Connect to MongoDB
(0, db_1.default)();
// Ensure assets (logo, etc.) are available
(0, ensureAssets_1.default)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
console.log('Starting backend index.ts');
// Defensive middleware to block requests with a path that looks like a full URL
app.use(((req, res, next) => {
    if (/^\/https?:\/\//.test(req.path)) {
        console.error('Blocked suspicious request path:', req.method, req.path);
        return res.status(400).json({ error: 'Invalid request path' });
    }
    next();
}));
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
app.use((0, cors_1.default)(corsOptions));
console.log('Registering static frontend dist');
app.use(express_1.default.static(path_1.default.join(__dirname, "../../frontend/dist")));
console.log('Registering express.json middleware');
// Body parsing middleware
app.use(express_1.default.json()); // Add this line to parse JSON bodies
// Create uploads directory if it doesn't exist
const fs_1 = __importDefault(require("fs"));
const uploadDir = path_1.default.join(__dirname, '../uploads/receipts');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory:', uploadDir);
}
console.log('Registering /api/static');
// Static file serving - must come before fileUpload middleware
const static_routes_1 = __importDefault(require("./routes/static.routes"));
app.use('/api/static', static_routes_1.default); // Map to /api/static to match frontend URL
console.log('Registering /api/payments (multer)');
// Routes
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const pharmacy_routes_1 = __importDefault(require("./routes/pharmacy.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const organizationDocument_routes_1 = __importDefault(require("./routes/organizationDocument.routes"));
// NOTE: dueRoutes and donationRoutes are excluded here to avoid circular dependencies
// They are accessible through pharmacyRoutes with nested routing
const dueType_routes_1 = __importDefault(require("./routes/dueType.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes")); // Import paymentRoutes here
const event_routes_1 = __importDefault(require("./routes/event.routes"));
const election_routes_1 = __importDefault(require("./routes/election.routes"));
const poll_routes_1 = __importDefault(require("./routes/poll.routes"));
const communication_routes_1 = __importDefault(require("./routes/communication.routes"));
const financialRecord_routes_1 = __importDefault(require("./routes/financialRecord.routes"));
const permission_routes_1 = __importDefault(require("./routes/permission.routes"));
const role_routes_1 = __importDefault(require("./routes/role.routes"));
const userManagement_routes_1 = __importDefault(require("./routes/userManagement.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const memberDashboard_routes_1 = __importDefault(require("./routes/memberDashboard.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
// Register paymentRoutes (which uses multer) BEFORE global fileupload or general body parsers
app.use('/api/payments', payment_routes_1.default);
console.log('Registering express-fileupload');
// File upload middleware for organization documents (express-fileupload)
// This should ideally not be global or be placed after routes using other parsers like multer
app.use((0, express_fileupload_1.default)({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    abortOnLimit: true,
}));
console.log('Registering / route');
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "../../frontend/dist/index.html"));
});
console.log('Registering /api/health-check');
// Health check endpoint
app.get('/api/health-check', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is running and healthy',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
    });
});
console.log('Registering API routes');
// Define API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/pharmacies', pharmacy_routes_1.default);
app.use('/api/documents', document_routes_1.default);
app.use('/api/organization-documents', organizationDocument_routes_1.default);
// NOTE: /api/dues and /api/donations are now accessible through /api/pharmacies/:pharmacyId/dues and /api/pharmacies/:pharmacyId/donations
app.use('/api/due-types', dueType_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/events', event_routes_1.default);
app.use('/api/elections', election_routes_1.default);
app.use('/api/polls', poll_routes_1.default);
app.use('/api/communications', communication_routes_1.default);
app.use('/api/financial-records', financialRecord_routes_1.default);
app.use('/api/permissions', permission_routes_1.default);
app.use('/api/roles', role_routes_1.default);
app.use('/api/user-management', userManagement_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/member-dashboard', memberDashboard_routes_1.default);
app.use('/api/messages', message_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
// console.log('✓ User management routes registered');
// app.use('/api/dashboard', dashboardRoutes);
// console.log('✓ Dashboard routes registered');
// app.use('/api/member-dashboard', memberDashboardRoutes);
// console.log('✓ Member dashboard routes registered');
// app.use('/api/messages', messageRoutes);
// console.log('✓ Message routes registered');
// app.use('/api/notifications', notificationRoutes);
// console.log('✓ Notification routes registered');
console.log('Registering catchall * route');
// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
    try {
        res.sendFile(path_1.default.join(__dirname, "../../frontend/dist/index.html"));
    }
    catch (err) {
        console.error('Error in catchall route:', err);
        res.status(500).send('Internal Server Error');
    }
});
console.log('Registering express.urlencoded middleware');
// General body parsers - place them after specific multipart handlers if possible,
// or ensure they don't process multipart/form-data if other handlers are meant to.
app.use(express_1.default.urlencoded({ extended: true }));
console.log('Registering error handlers');
// Error Handling Middlewares
const error_middleware_1 = require("./middleware/error.middleware");
// Global unhandled promise rejection handler
process.on('unhandledRejection', (err) => {
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
app.use(error_middleware_1.notFound);
app.use(error_middleware_1.errorHandler);
// Create HTTP server
const server = http_1.default.createServer(app);
// Initialize Socket.io
const socketService = new socket_service_1.default(server);
global.socketService = socketService;
console.log('About to start server...');
// Start server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Socket.io enabled for real-time messaging`);
});
exports.default = app;
