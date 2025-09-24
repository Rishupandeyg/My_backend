// models/JobPost.js
import mongoose from "mongoose";

const JobPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  category: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // employer
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("JobPost", JobPostSchema);
