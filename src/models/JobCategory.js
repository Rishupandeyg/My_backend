import mongoose from "mongoose";

const JobPostSchema = new mongoose.Schema({
  category: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount : {type: String, required: true} 
});

export default mongoose.model("JobCategory", JobCategory);