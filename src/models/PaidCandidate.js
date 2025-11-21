import mongoose from "mongoose";

const PaidCandidateSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },

    merchantOrderId: { type: String, required: true },
    jobId: { type: String, required: true },
    amountPaise: { type: Number, required: true },

    name: String,
    email: String,
    contact: String,

    status: { type: String, default: "SUCCESS" },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("PaidCandidate", PaidCandidateSchema);
