"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config();
// Connect to MongoDB
(0, db_1.default)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://acpnotazone.org', 'https://www.acpnotazone.org']
        : [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
        ],
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Create uploads directory if it doesn't exist
const fs_1 = __importDefault(require("fs"));
const uploadDir = path_1.default.join(__dirname, '../uploads/receipts');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory:', uploadDir);
}
// Static file serving - must come before fileUpload middleware
const static_routes_1 = __importDefault(require("./routes/static.routes"));
app.use('/static', static_routes_1.default);
// File upload middleware - only use one of these (multer is configured in the routes)
// Comment out express-fileupload to avoid conflicts with multer
// app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));
// Routes
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const pharmacy_routes_1 = __importDefault(require("./routes/pharmacy.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const due_routes_1 = __importDefault(require("./routes/due.routes"));
const dueType_routes_1 = __importDefault(require("./routes/dueType.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const donation_routes_1 = __importDefault(require("./routes/donation.routes"));
const event_routes_1 = __importDefault(require("./routes/event.routes"));
const election_routes_1 = __importDefault(require("./routes/election.routes"));
const poll_routes_1 = __importDefault(require("./routes/poll.routes"));
const communication_routes_1 = __importDefault(require("./routes/communication.routes"));
const financialRecord_routes_1 = __importDefault(require("./routes/financialRecord.routes"));
app.get('/', (req, res) => {
    res.send('ACPN OTA Zone API is running...');
});
// Health check endpoint
app.get('/api/health-check', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is running and healthy',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
    });
});
// Define Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/pharmacies', pharmacy_routes_1.default);
app.use('/api/documents', document_routes_1.default);
app.use('/api/dues', due_routes_1.default);
app.use('/api/due-types', dueType_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/donations', donation_routes_1.default);
app.use('/api/events', event_routes_1.default);
app.use('/api/elections', election_routes_1.default);
app.use('/api/polls', poll_routes_1.default);
app.use('/api/communications', communication_routes_1.default);
app.use('/api/financial-records', financialRecord_routes_1.default);
// Error Handling Middlewares
const error_middleware_1 = require("./middleware/error.middleware");
app.use(error_middleware_1.notFound);
app.use(error_middleware_1.errorHandler);
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
exports.default = app;
