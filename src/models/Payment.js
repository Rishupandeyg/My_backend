import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
  transactionId: String,
  paymentMethod: String,
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
