// src/models/JobCategory.js
import mongoose from "mongoose";

const jobCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    // any other fields you need
  },
  { timestamps: true }
);

const JobCategory = mongoose.model("JobCategory", jobCategorySchema);
export default JobCategory;
