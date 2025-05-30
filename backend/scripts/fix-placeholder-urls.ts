// Script to identify and fix placeholder URLs in documents
// Run this with: npx ts-node scripts/fix-placeholder-urls.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OrganizationDocument from '../src/models/organizationDocument.model';
import Document from '../src/models/document.model';

// Load environment variables
dotenv.config();

async function fixPlaceholderUrls() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Find organization documents with placeholder URLs
    console.log('\n🔍 Checking Organization Documents...');
    const orgDocs = await OrganizationDocument.find({});

    let orgPlaceholderCount = 0;
    let orgCloudinaryCount = 0;
    let orgOtherCount = 0;

    for (const doc of orgDocs) {
      if (doc.fileUrl.includes('cloudinary.com')) {
        orgCloudinaryCount++;
        console.log(`✅ ${doc.title}: Real Cloudinary URL`);
      } else if (
        doc.fileUrl.includes('placeholder') ||
        doc.fileUrl.includes('example.com') ||
        !doc.fileUrl.startsWith('http')
      ) {
        orgPlaceholderCount++;
        console.log(`❌ ${doc.title}: Placeholder URL - ${doc.fileUrl}`);
      } else {
        orgOtherCount++;
        console.log(`⚠️  ${doc.title}: Other URL - ${doc.fileUrl}`);
      }
    }

    // Find pharmacy documents with placeholder URLs
    console.log('\n🔍 Checking Pharmacy Documents...');
    const pharmDocs = await Document.find({}).populate('pharmacyId', 'name');

    let pharmPlaceholderCount = 0;
    let pharmCloudinaryCount = 0;
    let pharmOtherCount = 0;

    for (const doc of pharmDocs) {
      const pharmacyName = (doc.pharmacyId as any)?.name || 'Unknown Pharmacy';

      if (doc.fileUrl.includes('cloudinary.com')) {
        pharmCloudinaryCount++;
        console.log(
          `✅ ${pharmacyName} - ${doc.fileName}: Real Cloudinary URL`
        );
      } else if (
        doc.fileUrl.includes('placeholder') ||
        doc.fileUrl.includes('example.com') ||
        !doc.fileUrl.startsWith('http')
      ) {
        pharmPlaceholderCount++;
        console.log(
          `❌ ${pharmacyName} - ${doc.fileName}: Placeholder URL - ${doc.fileUrl}`
        );
      } else {
        pharmOtherCount++;
        console.log(
          `⚠️  ${pharmacyName} - ${doc.fileName}: Other URL - ${doc.fileUrl}`
        );
      }
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('===================');
    console.log(`Organization Documents:
      ✅ Real Cloudinary URLs: ${orgCloudinaryCount}
      ❌ Placeholder URLs: ${orgPlaceholderCount}
      ⚠️  Other URLs: ${orgOtherCount}
      📄 Total: ${orgDocs.length}
    `);

    console.log(`Pharmacy Documents:
      ✅ Real Cloudinary URLs: ${pharmCloudinaryCount}
      ❌ Placeholder URLs: ${pharmPlaceholderCount}
      ⚠️  Other URLs: ${pharmOtherCount}
      📄 Total: ${pharmDocs.length}
    `);

    if (orgPlaceholderCount > 0 || pharmPlaceholderCount > 0) {
      console.log('\n🚨 ACTION REQUIRED:');
      console.log(
        'Documents with placeholder URLs need to be re-uploaded or have their URLs updated.'
      );
      console.log(
        'These documents will show "File not available for download" error when users try to download them.'
      );
      console.log('\nOptions:');
      console.log('1. Re-upload the documents through the admin interface');
      console.log(
        '2. Manually update the fileUrl in the database (if you have the actual files)'
      );
      console.log('3. Delete the documents if they are no longer needed');
    } else {
      console.log('\n✅ All documents have valid URLs!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
fixPlaceholderUrls();
