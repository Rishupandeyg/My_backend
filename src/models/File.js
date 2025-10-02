import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "userType" },
    userType: { type: String, required: true, enum: ["Candidate", "Employer", "Admin"] },

    fileType: { type: String, required: true, enum: ["photo", "resume", "audio", "video"] },
    originalName: { type: String, required: true },
    fileName: { type: String },    // Cloudinary public_id (optional)
    url: { type: String, required: true }, // Cloudinary secure_url
    mimetype: { type: String },
    size: { type: Number },        // bytes
  },
  { timestamps: true }
);

export default mongoose.model("File", FileSchema);
