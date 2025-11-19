import Counter from "../models/Counter.js";

export async function generateJobID(prefix = "KBTS") {
  const counter = await Counter.findOneAndUpdate(
    { name: "jobId" },
    { $inc: { seq: 1 } },      // <-- FIXED (use seq)
    { upsert: true, new: true }
  );

  const num = String(counter.seq).padStart(4, "0");  // 0001, 0002, ...
  return `${prefix}-${num}`;                         // KBTS-0001
}
