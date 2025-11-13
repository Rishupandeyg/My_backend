// import mongoose from "mongoose";
// import Counter from "./Counter.js"; // add this model (see below)

// // Define schema
// const applicationSchema = new mongoose.Schema(
//   {
//     job: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "JobPost",
//       required: true,
//     },
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Candidate",
//       required: true,
//     },
//     applicationNumber: {
//       type: String,
//       unique: true,
//     },
//     paymentRef: {
//       type: String,
//       unique: true,
//       sparse: true, // allows many nulls but unique if provided
//     },
//     appliedAt: {
//       type: Date,
//       default: Date.now,
//     },
//     status: {
//       type: String,
//       enum: ["pending", "reviewed", "accepted", "rejected"],
//       default: "pending",
//     },
//   },
//   { timestamps: true }
// );

// // Pre-save hook to generate application number
// applicationSchema.pre("save", async function (next) {
//   if (this.applicationNumber) return next(); // skip if already exists

//   try {
//     // Increment counter atomically
//     const counter = await Counter.findOneAndUpdate(
//       { _id: "application" },
//       { $inc: { seq: 1 } },
//       { upsert: true, new: true }
//     );

//     const seq = String(counter.seq).padStart(4, "0");
//     const date = new Date();
//     const y = date.getFullYear();
//     const m = String(date.getMonth() + 1).padStart(2, "0");
//     const d = String(date.getDate()).padStart(2, "0");

//     this.applicationNumber = `APP-${y}${m}${d}-${seq}`;
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// export default mongoose.model("Application", applicationSchema);
 