import mongoose from "mongoose";

// Sub-schema for uploads (gallery items)
const uploadSchema = new mongoose.Schema(
  {
    filename: String,        // Cloudinary public_id
    originalName: String,    // original file name
    url: String,             // Cloudinary URL
    mimetype: String,        // MIME type
    size: Number,            // file size in bytes
    type: String,            // "photo" | "video" | "audio" | "document"
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

    // main single uploads
    photoUrl: String,
    resumeUrl: String,
    audioUrl: String,
    videoUrl: String,

    // ⭐ FINAL & CORRECT GALLERY STORAGE ⭐
    gallery: [uploadSchema],

    // (optional old field)
    uploads: [uploadSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Candidate", candidateSchema);



// import mongoose from "mongoose";

// // Sub-schema for multiple uploads (audio, video, images, documents)
// const uploadSchema = new mongoose.Schema(
//   {
//     filename: String,       // Cloudinary public_id (optional)
//     originalName: String,   // original file name
//     url: String,            // Cloudinary URL
//     mimetype: String,       // file type
//     size: Number,           // file size in bytes
//     type: String,           // 'audio', 'video', 'image', 'resume', etc.
//   },
//   { timestamps: true }
// );

// const candidateSchema = new mongoose.Schema(
//   {
//     isPaid: { type: Boolean, default: false },  
//     firstName: { type: String, required: true },
//     lastName: { type: String, required: true },
//     dateOfBirth: { type: Date, required: true },
//     category: { type: String, required: true },
//     address: { type: String, required: true },
//     mobile: { type: String, required: true, unique: true },
//     city: { type: String, required: true },
//     state: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },

//     //  Cloudinary URLs for main files
//     photoUrl: String,      // profile picture
//     resumeUrl: String,     // resume file
//     audioUrl: String,      // audio file (max 1 min)
//     videoUrl: String,      // video file (max 30 sec)

//     //  Array for other uploads if needed
//     uploads: [uploadSchema], // additional uploads
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Candidate", candidateSchema);


// // import mongoose from "mongoose";

// // // Sub-schema for multiple uploads
// // const uploadSchema = new mongoose.Schema(
// //   {
// //     filename: String,       // Cloudinary public_id
// //     originalName: String,   // original file name
// //     url: String,            // Cloudinary URL
// //     mimetype: String,       // file type: image/pdf
// //     size: Number,           // file size
// //     type: String,           // 'image', 'pdf'
// //   },
// //   { timestamps: true }
// // );

// // const candidateSchema = new mongoose.Schema(
// //   {
// //     isPaid: { type: Boolean, default: false },

// //     // Basic Details
// //     firstName: { type: String, required: true },
// //     lastName: { type: String, required: true },
// //     dateOfBirth: { type: Date, required: true },
// //     category: { type: String, required: true },
// //     address: { type: String, required: true },
// //     mobile: { type: String, required: true, unique: true },
// //     city: { type: String, required: true },
// //     state: { type: String, required: true },
// //     email: { type: String, required: true, unique: true },
// //     password: { type: String, required: true },

// //     // Single main uploads
// //     photoUrl: String,   // profile image
// //     audioUrl: String,   // audio max 1 min
// //     videoUrl: String,   // video max 30 sec

// //     // Multiple Uploaded Files (images + PDFs)
// //     uploads: [uploadSchema],
// //   },
// //   { timestamps: true }
// // );

// // export default mongoose.model("Candidate", candidateSchema);
