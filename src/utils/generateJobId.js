// utils/generateJobId.js
import Counter from "../models/Counter.js";

export async function generateJobID(prefix = "KBTS") {
  // Atomically increment counter named 'jobId'
  const counter = await Counter.findOneAndUpdate(
    { name: "jobId" },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  );

  const num = String(counter.value).padStart(2, "0"); // 01, 02, ... 10, 11 ...
  return `${prefix}${num}`;
}
