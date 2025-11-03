// src/models/JobCategory.js
import mongoose from "mongoose";

const jobCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fee: {
      type: Number,
      required: true,
      default: 0, // default fee for this category
      min: 0,
    },
  },
  { timestamps: true }
);

const JobCategory = mongoose.model("JobCategory", jobCategorySchema);
export default JobCategory;
