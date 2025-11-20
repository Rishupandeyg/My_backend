import Counter from "../models/Counter.js";

export async function generateJobID(prefix = "KBTS") {
  const counter = await Counter.findOneAndUpdate(
    { name: "job_order_id" },   // single counter for both order + job
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  // Start from 101 → means seq=1 → 1 + 100 = 101
  const number = counter.seq + 100;

  return `${prefix}-${number}`;
}
