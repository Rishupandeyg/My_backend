import Counter from "../models/Counter.js";

export async function generateJobID(prefix = "KBTS") {

  // Counter name = "job_order_id" (single counter for both order + job)
  const counter = await Counter.findOneAndUpdate(
    { name: "job_order_id" },
    { $inc: { seq: 1 } },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  // Start from 101
  const currentNumber = counter.seq + 100;

  // return `${prefix}-${currentNumber}`;
   return `${prefix}${Date.now()}${currentNumber}`;

}
