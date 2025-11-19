import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    merchantOrderId: { type: String, required: true, unique: true },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Candidate
      required: false
    },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job", // Applied job
      required: false
    },

    generatedJobId: {
      type: String, // like KBTS-0001
      required: false
    },

    amountPaise: { type: Number, required: true },

    status: {
      type: String,
      enum: ["CREATED", "PENDING", "SUCCESS", "FAILED"],
      default: "CREATED"
    },

    paymentProviderData: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
