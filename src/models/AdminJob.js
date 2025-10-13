import mongoose from "mongoose";

const AdminJobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    salary: { type: String },
    company: { type: String, required: true },
    category: { type: String, enum: ["acting", "singing", "dancing", "spotboy"], required: true },
    gender: { type: String, enum: ["male", "female", "any"], required: true },
    openings: { type: Number, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true }
);

const AdminJob = mongoose.model("AdminJob", AdminJobSchema);

export default AdminJob;
