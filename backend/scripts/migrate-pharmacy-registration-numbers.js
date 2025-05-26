/**
 * Migration Script: Update Pharmacy Registration Numbers
 *
 * This script updates existing pharmacy records from UUID-based registration numbers
 * to the new incremental "ACPNxxx" format (ACPN001, ACPN002, etc.)
 *
 * Usage: node scripts/migrate-pharmacy-registration-numbers.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models (using require since this is a standalone script)
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Define schemas inline to avoid import issues
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 },
});

const pharmacySchema = new mongoose.Schema(
  {
    name: String,
    registrationNumber: String,
    registrationStatus: String,
    createdAt: Date,
    // ... other fields not needed for migration
  },
  { timestamps: true }
);

const Counter = mongoose.model('Counter', counterSchema);
const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);

/**
 * Get next sequential registration number for pharmacy
 */
const getNextPharmacyRegistrationNumber = async () => {
  const counterId = 'pharmacy_registration';

  try {
    const counter = await Counter.findOneAndUpdate(
      { _id: counterId },
      { $inc: { sequence_value: 1 } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!counter) {
      throw new Error('Failed to generate registration number');
    }

    const paddedNumber = counter.sequence_value.toString().padStart(3, '0');
    return `ACPN${paddedNumber}`;
  } catch (error) {
    console.error('Error generating pharmacy registration number:', error);
    throw error;
  }
};

/**
 * Check if a registration number is in UUID format
 */
const isUUID = (str) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Main migration function
 */
const migratePharmacyRegistrationNumbers = async () => {
  try {
    console.log('🔄 Starting pharmacy registration number migration...');

    // Find all pharmacies with UUID-based registration numbers
    const pharmaciesWithUUIDs = await Pharmacy.find({
      registrationNumber: { $exists: true, $ne: null },
    }).sort({ createdAt: 1 }); // Process oldest first to maintain order

    console.log(`📊 Found ${pharmaciesWithUUIDs.length} pharmacies to check`);

    let migrated = 0;
    let skipped = 0;

    for (const pharmacy of pharmaciesWithUUIDs) {
      // Check if registration number is in UUID format
      if (isUUID(pharmacy.registrationNumber)) {
        console.log(
          `🔄 Migrating pharmacy: ${pharmacy.name} (Current: ${pharmacy.registrationNumber})`
        );

        // Generate new registration number
        const newRegistrationNumber = await getNextPharmacyRegistrationNumber();

        // Update the pharmacy
        await Pharmacy.findByIdAndUpdate(
          pharmacy._id,
          { registrationNumber: newRegistrationNumber },
          { new: true }
        );

        console.log(
          `✅ Updated ${pharmacy.name}: ${pharmacy.registrationNumber} → ${newRegistrationNumber}`
        );
        migrated++;
      } else {
        console.log(
          `⏭️  Skipping ${pharmacy.name}: Already has correct format (${pharmacy.registrationNumber})`
        );
        skipped++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migrated} pharmacies`);
    console.log(`⏭️  Skipped (already correct): ${skipped} pharmacies`);
    console.log(`📊 Total processed: ${migrated + skipped} pharmacies`);

    // Show current counter status
    const counter = await Counter.findById('pharmacy_registration');
    if (counter) {
      console.log(`📈 Current counter value: ${counter.sequence_value}`);
      console.log(
        `📝 Next registration number will be: ACPN${(counter.sequence_value + 1).toString().padStart(3, '0')}`
      );
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

/**
 * Validate migration results
 */
const validateMigration = async () => {
  try {
    console.log('\n🔍 Validating migration results...');

    // Count pharmacies with UUID format registration numbers
    const uuidCount = await Pharmacy.countDocuments({
      registrationNumber: {
        $regex:
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      },
    });

    // Count pharmacies with new ACPN format
    const acpnCount = await Pharmacy.countDocuments({
      registrationNumber: { $regex: /^ACPN\d{3}$/ },
    });

    // Count pharmacies with null or empty registration numbers
    const nullCount = await Pharmacy.countDocuments({
      $or: [
        { registrationNumber: { $exists: false } },
        { registrationNumber: null },
        { registrationNumber: '' },
      ],
    });

    console.log('📊 Validation Results:');
    console.log(`✅ Pharmacies with ACPN format: ${acpnCount}`);
    console.log(`❌ Pharmacies still with UUID format: ${uuidCount}`);
    console.log(
      `⚠️  Pharmacies with null/empty registration numbers: ${nullCount}`
    );

    if (uuidCount === 0 && nullCount === 0) {
      console.log(
        '🎉 Migration completed successfully! All pharmacies have the new registration number format.'
      );
    } else if (uuidCount > 0) {
      console.log(
        '⚠️  Warning: Some pharmacies still have UUID format registration numbers.'
      );
    } else if (nullCount > 0) {
      console.log(
        '⚠️  Warning: Some pharmacies have null/empty registration numbers. These will be auto-generated on next save.'
      );
    }
  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
};

/**
 * Main execution function
 */
const main = async () => {
  try {
    await connectDB();

    // Show current state before migration
    const totalPharmacies = await Pharmacy.countDocuments();
    console.log(`📊 Total pharmacies in database: ${totalPharmacies}`);

    if (totalPharmacies === 0) {
      console.log('ℹ️  No pharmacies found in database. Migration not needed.');
      return;
    }

    // Run migration
    await migratePharmacyRegistrationNumbers();

    // Validate results
    await validateMigration();

    console.log('\n🎉 Migration script completed successfully!');
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📤 Database connection closed.');
  }
};

// Handle script execution
if (require.main === module) {
  main();
}

module.exports = {
  migratePharmacyRegistrationNumbers,
  validateMigration,
  isUUID,
  getNextPharmacyRegistrationNumber,
};
