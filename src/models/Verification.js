// src/models/Verification.js
const mongoose = require("mongoose");

const VerificationSchema = new mongoose.Schema({
  verificationId: { type: String, required: true, unique: true },
  type: { type: String, enum: ["email", "mobile"], required: true },
  value: { type: String, required: true }, // email or mobile
  otp: { type: String, required: true }, // hashed otp
  expiresAt: { type: Number, required: true },
  attempts: { type: Number, default: 0 },
  used: { type: Boolean, default: false },
}, { timestamps: true });

// index to auto-delete expired docs (optional)
VerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Verification", VerificationSchema);
