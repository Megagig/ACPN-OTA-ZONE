// Script to identify and fix placeholder URLs in documents
const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas directly since we're in a plain JS file
const organizationDocumentSchema = new mongoose.Schema({
  title: String,
  description: String,
  fileUrl: String,
  publicId: String,
  category: String,
  uploadDate: Date,
  isActive: Boolean,
});

const documentSchema = new mongoose.Schema({
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy' },
  fileName: String,
  fileUrl: String,
  publicId: String,
  uploadDate: Date,
  description: String,
  isActive: Boolean,
});

const pharmacySchema = new mongoose.Schema({
  name: String,
});

const OrganizationDocument = mongoose.model(
  'OrganizationDocument',
  organizationDocumentSchema
);
const Document = mongoose.model('Document', documentSchema);
const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);

async function fixPlaceholderUrls() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

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

        // Mark document as inactive if it has placeholder URL
        await OrganizationDocument.findByIdAndUpdate(doc._id, {
          isActive: false,
        });
        console.log(`   → Marked as inactive`);
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
      const pharmacyName = doc.pharmacyId?.name || 'Unknown Pharmacy';

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

        // Mark document as inactive if it has placeholder URL
        await Document.findByIdAndUpdate(doc._id, { isActive: false });
        console.log(`   → Marked as inactive`);
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
      ❌ Placeholder URLs (now inactive): ${orgPlaceholderCount}
      ⚠️  Other URLs: ${orgOtherCount}
      📄 Total: ${orgDocs.length}
    `);

    console.log(`Pharmacy Documents:
      ✅ Real Cloudinary URLs: ${pharmCloudinaryCount}
      ❌ Placeholder URLs (now inactive): ${pharmPlaceholderCount}
      ⚠️  Other URLs: ${pharmOtherCount}
      📄 Total: ${pharmDocs.length}
    `);

    if (orgPlaceholderCount > 0 || pharmPlaceholderCount > 0) {
      console.log('\n✅ FIXED:');
      console.log(
        'Documents with placeholder URLs have been marked as inactive.'
      );
      console.log(
        'They will no longer appear in listings until properly re-uploaded.'
      );
    } else {
      console.log('\n✅ All documents have valid URLs!');
    }

    console.log('\n🔄 Testing document download API...');
    // Test the specific document that was causing issues
    const problemDoc = await OrganizationDocument.findById(
      '68373d3cebefde0e00e39dcd'
    );
    if (problemDoc) {
      console.log(
        `Problem document status: ${problemDoc.isActive ? 'ACTIVE' : 'INACTIVE'}`
      );
      console.log(`Problem document URL: ${problemDoc.fileUrl}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
fixPlaceholderUrls().catch(console.error);
