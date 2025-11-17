// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  merchantOrderId: { type: String, required: true, unique: true },
  amountPaise: { type: Number, required: true },
  status: { type: String, enum: ["CREATED","PENDING","SUCCESS","FAILED","REFUNDED"], default: "CREATED" },
  paymentProviderData: { type: mongoose.Schema.Types.Mixed }, // raw provider response for audit
  jobId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Order", orderSchema);
