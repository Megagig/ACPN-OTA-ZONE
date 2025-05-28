import Counter from '../models/counter.model';

/**
 * Gets the next sequence value for a given counter ID
 * @param counterId The ID of the counter to increment
 * @returns The next sequence value
 */
export const getNextSequenceValue = async (
  counterId: string
): Promise<number> => {
  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
};

/**
 * Gets the next certificate number as a 4-digit padded string
 * Format: ACPN-YYYY (e.g., ACPN-0001)
 * @returns The formatted certificate number
 */
export const getNextCertificateNumber = async (): Promise<string> => {
  const nextVal = await getNextSequenceValue('certificateCounter');
  // Pad with leading zeros to make it 4 digits
  const paddedNumber = nextVal.toString().padStart(4, '0');
  return `ACPN-${paddedNumber}`;
};
