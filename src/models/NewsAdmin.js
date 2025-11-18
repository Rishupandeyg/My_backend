// models/NewsAdmin.js
import mongoose from "mongoose";

const newsAdminSchema = new mongoose.Schema(
  {
    name: { type: String, default: "News Admin" },
    username: { type: String, required: true, unique: true },
    email: { type: String, default: "" },
    mobile: { type: String, default: "" },
    password: { type: String, required: true },
    role: { type: String, default: "news-admin" },
    isVerified: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("NewsAdmin", newsAdminSchema);
