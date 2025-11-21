import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    merchantOrderId: { type: String, required: true, unique: true },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
  ref: "Candidate",
      required: false
    },

    jobId: {
      type: String,  // <-- KBTS-101 same as merchantOrderId
      required: false
    },

    generatedJobId: {
      type: String,  // KBTS-101 also here
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
