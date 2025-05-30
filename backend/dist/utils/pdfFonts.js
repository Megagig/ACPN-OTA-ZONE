"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurePDFForCurrency = exports.formatNairaAmount = exports.ASCII_NAIRA = exports.NAIRA_SYMBOL = void 0;
/**
 * Define the currency symbol for Naira (₦)
 * This approach uses the Unicode character directly
 */
exports.NAIRA_SYMBOL = '₦';
/**
 * Alternative Naira representation using ASCII
 * This can be used as a fallback if the Unicode symbol doesn't render correctly
 */
exports.ASCII_NAIRA = 'NGN';
/**
 * Format a number as currency with the Naira symbol
 * @param amount - The amount to format
 * @param useSymbol - Whether to use the Naira symbol (₦) or ASCII representation (NGN)
 * @returns Formatted currency string
 */
const formatNairaAmount = (amount, useSymbol = true) => {
    const formattedAmount = amount.toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return useSymbol
        ? `${exports.NAIRA_SYMBOL}${formattedAmount}`
        : `${exports.ASCII_NAIRA} ${formattedAmount}`;
};
exports.formatNairaAmount = formatNairaAmount;
/**
 * Configure PDF document to properly display currency symbols
 * @param doc - The PDFKit document instance
 */
const configurePDFForCurrency = (doc) => {
    // Set font to a standard font that supports the Naira symbol
    doc.font('Helvetica');
    // Alternatively, you could register and use a custom font if needed
    // doc.registerFont('CustomFont', path.join(__dirname, '../assets/fonts/custom-font.ttf'));
    // doc.font('CustomFont');
};
exports.configurePDFForCurrency = configurePDFForCurrency;
