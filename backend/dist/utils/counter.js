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
exports.getNextCertificateNumber = exports.getNextSequenceValue = void 0;
const counter_model_1 = __importDefault(require("../models/counter.model"));
/**
 * Gets the next sequence value for a given counter ID
 * @param counterId The ID of the counter to increment
 * @returns The next sequence value
 */
const getNextSequenceValue = (counterId) => __awaiter(void 0, void 0, void 0, function* () {
    const counter = yield counter_model_1.default.findOneAndUpdate({ _id: counterId }, { $inc: { sequence_value: 1 } }, { new: true, upsert: true });
    return counter.sequence_value;
});
exports.getNextSequenceValue = getNextSequenceValue;
/**
 * Gets the next certificate number as a 4-digit padded string
 * Format: ACPN-YYYY (e.g., ACPN-0001)
 * @returns The formatted certificate number
 */
const getNextCertificateNumber = () => __awaiter(void 0, void 0, void 0, function* () {
    const nextVal = yield (0, exports.getNextSequenceValue)('certificateCounter');
    // Pad with leading zeros to make it 4 digits
    const paddedNumber = nextVal.toString().padStart(4, '0');
    return `ACPN-${paddedNumber}`;
});
exports.getNextCertificateNumber = getNextCertificateNumber;
