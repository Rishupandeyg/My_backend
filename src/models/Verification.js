// // src/models/Verification.js
// import mongoose from "mongoose";

// const VerificationSchema = new mongoose.Schema(
//   {
//     verificationId: { type: String, required: true, unique: true },

//     // Email-only OTP
//     type: { 
//       type: String, 
//       enum: ["email"],    // only email allowed now
//       required: true 
//     },

//     value: { type: String, required: true }, // email

//     otp: { type: String, required: true }, // hashed OTP

//     expiresAt: { type: Date, required: true },  // TTL control

//     attempts: { type: Number, default: 0 },

//     used: { type: Boolean, default: false },
//   },
//   { timestamps: true }
// );

// // TTL index — document auto-deletes after expiry
// VerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// const Verification = mongoose.model("Verification", VerificationSchema);

// export default Verification;
