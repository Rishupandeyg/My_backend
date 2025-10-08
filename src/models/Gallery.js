import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    fileType: {
      type: String,
      enum: ["photo", "video", "audio"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
    },
    originalName: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Gallery", gallerySchema);
