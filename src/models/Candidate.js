import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  mimetype: String,
  size: Number,
}, { timestamps: true });

const candidateSchema = new mongoose.Schema(
  {
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

    // ✅ New fields for file management
    photo: String,    // profile picture
    resume: String,   // resume file
    uploads: [uploadSchema], // candidate's multiple uploads (video/audio/images/writeups)
  },
  { timestamps: true }
);

export default mongoose.model("Candidate", candidateSchema);
