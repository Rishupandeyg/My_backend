import mongoose from "mongoose";

// Sub-schema for multiple uploads (audio, video, images, documents)
const uploadSchema = new mongoose.Schema(
  {
    filename: String,       // Cloudinary public_id (optional)
    originalName: String,   // original file name
    url: String,            // Cloudinary URL
    mimetype: String,       // file type
    size: Number,           // file size in bytes
    type: String,           // 'audio', 'video', 'image', 'resume', etc.
  },
  { timestamps: true }
);

const candidateSchema = new mongoose.Schema(
  {
    isPaid: { type: Boolean, default: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    category: { type: String, required: true },
    address: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // ✅ Cloudinary URLs for main files
    photoUrl: String,      // profile picture
    resumeUrl: String,     // resume file
    audioUrl: String,      // audio file (max 1 min)
    videoUrl: String,      // video file (max 30 sec)

    // ✅ Array for other uploads if needed
    uploads: [uploadSchema], // additional uploads
  },
  { timestamps: true }
);

export default mongoose.model("Candidate", candidateSchema);
