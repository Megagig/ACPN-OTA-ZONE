"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const financialRecord_controller_1 = require("../controllers/financialRecord.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// Protect all routes and restrict to admin and treasurer
router.use(auth_middleware_1.protect);
router.use((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.TREASURER));
// Financial summary and reports
router.route('/summary').get(financialRecord_controller_1.getFinancialSummary);
router.route('/reports').get(financialRecord_controller_1.getFinancialReports);
// CRUD operations
router.route('/').get(financialRecord_controller_1.getAllFinancialRecords).post(financialRecord_controller_1.createFinancialRecord);
router
    .route('/:id')
    .get(financialRecord_controller_1.getFinancialRecord)
    .put(financialRecord_controller_1.updateFinancialRecord)
    .delete(financialRecord_controller_1.deleteFinancialRecord);
exports.default = router;
