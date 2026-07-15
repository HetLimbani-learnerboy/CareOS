import mongoose from 'mongoose';

export const dropStrayOtpIndex = async () => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('otp_verifications');

    const indexes = await collection.indexes();
    const strayIndex = indexes.find(idx => idx.name === 'id_1');

    if (strayIndex) {
      await collection.dropIndex('id_1');
      console.log('[DB Migration] Dropped stray id_1 index from otp_verifications.');
    } else {
      console.log('[DB Migration] No stray id_1 index found on otp_verifications — already clean.');
    }
  } catch (err) {
    if (err.code !== 27) {
      console.warn('[DB Migration] Could not drop stray index:', err.message);
    }
  }
};