import mongoose from "mongoose";

const UserJobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true }, // KBTS01, KBTS02...
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },

  adminJobId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminJob" },

  amountPaise: { type: Number, required: true },

  meta: { type: mongoose.Schema.Types.Mixed }, // store provider callback details
}, { timestamps: true });

export default mongoose.model("UserJob", UserJobSchema);
