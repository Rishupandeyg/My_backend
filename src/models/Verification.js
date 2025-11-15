// src/models/Verification.js
import mongoose from "mongoose";

const VerificationSchema = new mongoose.Schema(
  {
    verificationId: { type: String, required: true, unique: true },
    type: { type: String, enum: ["email", "mobile"], required: true },
    value: { type: String, required: true }, // email or mobile
    otp: { type: String, required: true }, // hashed otp
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// TTL index: Mongo will remove docs when expiresAt < now
VerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Verification = mongoose.model("Verification", VerificationSchema);

export default Verification;
