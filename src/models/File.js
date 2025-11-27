// import mongoose from "mongoose";

// const FileSchema = new mongoose.Schema(
//   {
//     userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "userType" },
//     userType: { type: String, required: true, enum: ["Candidate", "Employer", "Admin"] },

//     fileType: { type: String, required: true, enum: ["photo", "document", "audio", "video"] },
//     originalName: { type: String, required: true },
//     fileName: { type: String },    // Cloudinary public_id (optional)
//     url: { type: String, required: true }, // Cloudinary secure_url
//     mimetype: { type: String },
//     size: { type: Number },        // bytes
//   },
//   { timestamps: true }
// );

// export default mongoose.model("File", FileSchema);

// import mongoose from "mongoose";

// const FileSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       refPath: "userType",
//     },

//     //  → Newsadmin added
//     userType: {
//       type: String,
//       required: true,
//       enum: ["Candidate", "Employer", "Admin", "Newsadmin"],
//     },

//     fileType: {
//       type: String,
//       required: true,
//       enum: ["photo", "document", "audio", "video"],
//     },

//     originalName: { type: String, required: true },
//     fileName: { type: String },
//     url: { type: String, required: true },
//     mimetype: { type: String },
//     size: { type: Number },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("File", FileSchema);

import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "userType",
    },

    userType: {
      type: String,
      required: true,
      enum: ["Candidate", "Employer", "Admin", "Newsadmin"],
    },

    fileType: {
      type: String,
      required: true,
      enum: ["photo", "document", "audio", "video"],
    },

    originalName: { type: String, required: true },
    fileName: { type: String },
    url: { type: String, required: true },

    // IMPORTANT FIX
    mimetype: {
      type: String,
      required: true,
      default: "application/octet-stream",
    },

    // EXTENSION REQUIRED (pdf, docx, etc)
    extension: {
      type: String,
      required: false,
    },

    size: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model("File", FileSchema);
