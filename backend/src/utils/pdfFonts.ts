/**
 * PDFKit font utilities for proper currency symbol rendering
 */
import path from 'path';

/**
 * Define the currency symbol for Naira (₦)
 * This approach uses the Unicode character directly
 */
export const NAIRA_SYMBOL = '₦';

/**
 * Alternative Naira representation using ASCII
 * This can be used as a fallback if the Unicode symbol doesn't render correctly
 */
export const ASCII_NAIRA = 'NGN';

/**
 * Format a number as currency with the Naira symbol
 * @param amount - The amount to format
 * @param useSymbol - Whether to use the Naira symbol (₦) or ASCII representation (NGN)
 * @returns Formatted currency string
 */
export const formatNairaAmount = (amount: number, useSymbol = true): string => {
  const formattedAmount = amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return useSymbol
    ? `${NAIRA_SYMBOL}${formattedAmount}`
    : `${ASCII_NAIRA} ${formattedAmount}`;
};

/**
 * Configure PDF document to properly display currency symbols
 * @param doc - The PDFKit document instance
 */
export const configurePDFForCurrency = (doc: any): void => {
  // Set font to a standard font that supports the Naira symbol
  doc.font('Helvetica');

  // Alternatively, you could register and use a custom font if needed
  // doc.registerFont('CustomFont', path.join(__dirname, '../assets/fonts/custom-font.ttf'));
  // doc.font('CustomFont');
};
