import Counter from '../models/counter.model';

/**
 * Get next sequential registration number for pharmacy
 * @returns Promise<string> - Next registration number (e.g., "ACPN001", "ACPN002", etc.)
 */
export const getNextPharmacyRegistrationNumber = async (): Promise<string> => {
  const counterId = 'pharmacy_registration';

  try {
    // Use findOneAndUpdate with upsert for atomic operation
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

    // Format the number with leading zeros (e.g., ACPN001, ACPN002, etc.)
    const paddedNumber = counter.sequence_value.toString().padStart(3, '0');
    return `ACPN${paddedNumber}`;
  } catch (error) {
    console.error('Error generating pharmacy registration number:', error);
    throw new Error('Failed to generate registration number');
  }
};
