// src/models/Admin.js
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Super Admin" },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, default: "0000000000" },
    password: { type: String, required: true },
    role: { type: String, default: "admin" },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
