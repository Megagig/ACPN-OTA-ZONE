"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextPharmacyRegistrationNumber = void 0;
const counter_model_1 = __importDefault(require("../models/counter.model"));
/**
 * Get next sequential registration number for pharmacy
 * @returns Promise<string> - Next registration number (e.g., "ACPN001", "ACPN002", etc.)
 */
const getNextPharmacyRegistrationNumber = () => __awaiter(void 0, void 0, void 0, function* () {
    const counterId = 'pharmacy_registration';
    try {
        // Use findOneAndUpdate with upsert for atomic operation
        const counter = yield counter_model_1.default.findOneAndUpdate({ _id: counterId }, { $inc: { sequence_value: 1 } }, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
        });
        if (!counter) {
            throw new Error('Failed to generate registration number');
        }
        // Format the number with leading zeros (e.g., ACPN001, ACPN002, etc.)
        const paddedNumber = counter.sequence_value.toString().padStart(3, '0');
        return `ACPN${paddedNumber}`;
    }
    catch (error) {
        console.error('Error generating pharmacy registration number:', error);
        throw new Error('Failed to generate registration number');
    }
});
exports.getNextPharmacyRegistrationNumber = getNextPharmacyRegistrationNumber;
