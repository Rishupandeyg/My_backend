// src/models/Counter.js
import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },  // e.g. "visits", "applications", "uploads"
  value: { type: Number, default: 0 },
});

// atomic increment helper
CounterSchema.statics.increment = async function (key) {
  const updated = await this.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return updated;
};

export default mongoose.model("Counter", CounterSchema);
