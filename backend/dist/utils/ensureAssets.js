"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAssets = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Ensures that all required assets exist in the assets directory
 * This is useful for making sure the logo and other assets are available
 * for certificate generation and other features
 */
const ensureAssets = () => {
    const assetsDir = path_1.default.join(__dirname, '../assets');
    // Create assets directory if it doesn't exist
    if (!fs_1.default.existsSync(assetsDir)) {
        fs_1.default.mkdirSync(assetsDir, { recursive: true });
        console.log('Created assets directory:', assetsDir);
    }
    // Check if logo exists
    const logoPath = path_1.default.join(assetsDir, 'acpn-logo.png');
    if (!fs_1.default.existsSync(logoPath)) {
        console.warn('Logo file not found, creating placeholder text file');
        // Create a text file with instructions on how to add the logo
        const logoInstructions = `
ACPN Logo Missing
----------------
To add the ACPN logo:
1. Save the ACPN logo as 'acpn-logo.png' in this directory
2. Ensure it's a PNG file with transparency
3. Recommended size: at least 400x400 pixels
    `;
        fs_1.default.writeFileSync(path_1.default.join(assetsDir, 'acpn-logo.txt'), logoInstructions);
        console.log('Created logo instructions file');
    }
    else {
        console.log('Logo file exists at:', logoPath);
    }
};
exports.ensureAssets = ensureAssets;
exports.default = exports.ensureAssets;
