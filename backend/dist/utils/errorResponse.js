"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Custom API error class
 */
class ErrorResponse extends Error {
    constructor(message, statusCode, errors) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        // Set prototype explicitly for better inheritance handling
        Object.setPrototypeOf(this, ErrorResponse.prototype);
    }
}
exports.default = ErrorResponse;
