// import mongoose from "mongoose";

// const PaidCandidateSchema = new mongoose.Schema(
//   {
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },

//     merchantOrderId: { type: String, required: true },
//     jobId: { type: String, required: true },
//     amountPaise: { type: Number, required: true },

//     name: String,
//     email: String,
//     contact: String,

//     status: { type: String, default: "SUCCESS" },
//     paidAt: { type: Date, default: Date.now },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("PaidCandidate", PaidCandidateSchema);


import mongoose from "mongoose";

const PaidCandidateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },

    // 🔐 IDEMPOTENCY KEY
    merchantOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ACTUAL JOB REFERENCE
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    amountPaise: {
      type: Number,
      required: true,
    },

    paymentProvider: {
      type: String,
      enum: ["PHONEPE", "RAZORPAY", "STRIPE"],
      required: true,
    },

    providerTransactionId: {
      type: String,
    },

    name: String,
    email: String,
    contact: String,

    status: {
      type: String,
      enum: ["SUCCESS", "REFUNDED", "CHARGEBACK"],
      default: "SUCCESS",
    },

    paidAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PaidCandidate", PaidCandidateSchema);
