import mongoose from 'mongoose';

const SystemCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 }
}, { 
  collection: 'system_counters',
  timestamps: false 
});

export default mongoose.model('SystemCounter', SystemCounterSchema);