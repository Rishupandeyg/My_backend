import mongoose from "mongoose";
import Counter from "./Counter.js"; 

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPost",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    applicationNumber: {
      type: String,
      unique: true,
    },
    paymentRef: {
      type: String,
      unique: true,
      sparse: true, 
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate application number automatically
applicationSchema.pre("save", async function (next) {
  // Skip if already has an application number
  if (this.applicationNumber) return next();

  try {
    // Get and increment counter atomically
    const counter = await Counter.findOneAndUpdate(
      { _id: "application" }, // key name for this sequence
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    // Build formatted number: APP-YYYYMMDD-0001
    const seq = String(counter.seq).padStart(4, "0");
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");

    this.applicationNumber = `APP-${y}${m}${d}-${seq}`;
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("Application", applicationSchema);
