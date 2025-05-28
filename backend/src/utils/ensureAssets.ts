import fs from 'fs';
import path from 'path';

/**
 * Ensures that all required assets exist in the assets directory
 * This is useful for making sure the logo and other assets are available
 * for certificate generation and other features
 */
export const ensureAssets = (): void => {
  const assetsDir = path.join(__dirname, '../assets');

  // Create assets directory if it doesn't exist
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('Created assets directory:', assetsDir);
  }

  // Check if logo exists
  const logoPath = path.join(assetsDir, 'acpn-logo.png');
  if (!fs.existsSync(logoPath)) {
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

    fs.writeFileSync(path.join(assetsDir, 'acpn-logo.txt'), logoInstructions);
    console.log('Created logo instructions file');
  } else {
    console.log('Logo file exists at:', logoPath);
  }
};

export default ensureAssets;
