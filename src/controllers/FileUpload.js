// // src/controllers/FileUpload.js
// import cloudinary from "cloudinary";
// import FileUpload from "../models/File.js";
// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import Admin from "../models/Admin.js";
// import Gallery from "../models/Gallery.js";

// // Map of user models
// const UserModels = { Candidate, Employer, Admin };

// // Cloudinary config
// cloudinary.v2.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.API_SECRET,
// });

// export const uploadFile = async (req, res) => {
//   try {
//     let { userType, fileType } = req.params;

//     // Normalize userType (Admin vs admin etc.)
//     const normalizedType = userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase();
//     const User = UserModels[normalizedType];
//     if (!User) return res.status(400).json({ error: "Invalid user type" });

//     if (!req.user?.id) return res.status(401).json({ error: "Unauthorized: User not found" });
//     if (!req.files || !req.files.file) return res.status(400).json({ error: "No file uploaded" });

//     const file = req.files.file;

//     // Debug log
//     console.log("UPLOAD DEBUG:", {
//       userId: req.user.id,
//       role: req.user.role,
//       params: req.params,
//       fileName: file.name,
//     });

//     // Determine Cloudinary resource type
//     let resourceType = "auto";
//     if (fileType === "document") resourceType = "raw";
//     if (fileType === "audio" || fileType === "video") resourceType = "video";

//     // Upload file to Cloudinary
//     const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
//       folder: `${normalizedType.toLowerCase()}s`, // lowercase folder for consistency
//       resource_type: resourceType,
//     });

//     // Update user model
//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ error: "User not found in DB" });

//     const fieldMap = { photo: "photoUrl", resume: "documentUrl", audio: "audioUrl", video: "videoUrl" };
//     if (fieldMap[fileType]) {
//       user[fieldMap[fileType]] = result.secure_url;
//       await user.save();
//     }

//     // If uploader is Admin, also save to Gallery
//     if (normalizedType === "Admin" && ["photo", "video", "audio"].includes(fileType)) {
//       await Gallery.create({
//         adminId: req.user.id,
//         fileType,
//         url: result.secure_url,
//         public_id: result.public_id,
//         originalName: file.name,
//       });
//     }

//     // Save file record
//     const fileRecord = await FileUpload.create({
//       userId: req.user.id,
//       userType: normalizedType,
//       fileType,
//       originalName: file.name,
//       fileName: result.public_id,
//       url: result.secure_url,
//       mimetype: file.mimetype,
//       size: file.size,
//     });

//     // Response
//     res.json({
//       message: `${fileType} uploaded successfully`,
//       file: fileRecord,
//       user, // generic key for frontend
//     });

//   } catch (err) {
//     console.error("File upload error:", err);
//     res.status(500).json({ error: "File upload failed", details: err.message });
//   }
// };


// src/controllers/FileUpload.js
import cloudinary from "cloudinary";
import FileUpload from "../models/File.js";
import Candidate from "../models/Candidate.js";
import Employer from "../models/Employer.js";
import Admin from "../models/Admin.js";
import Gallery from "../models/Gallery.js";

// Map of user models
const UserModels = { Candidate, Employer, Admin };

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export const uploadFile = async (req, res) => {
  try {
    let { userType, fileType } = req.params;

    // Normalize userType (Admin vs admin etc.)
    const normalizedType = userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase();
    const User = UserModels[normalizedType];
    if (!User) return res.status(400).json({ error: "Invalid user type" });

    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized: User not found" });
    if (!req.files || !req.files.file) return res.status(400).json({ error: "No file uploaded" });

    const file = req.files.file;

    // Debug log
    console.log("UPLOAD DEBUG:", {
      userId: req.user.id,
      role: req.user.role,
      params: req.params,
      fileName: file.name,
      purpose: req.body?.purpose || null,
    });

    // Normalize fileType variations:
    // allow endpoints like /photoPost or /photo-post etc. map them to a canonical token
    const canonicalFileType = (fileType || "").toLowerCase();

    // Determine Cloudinary resource type
    let resourceType = "auto";
    if (canonicalFileType === "document" || canonicalFileType === "resume") resourceType = "raw";
    if (canonicalFileType === "audio") resourceType = "video";
    if (canonicalFileType === "video") resourceType = "video";
    // images remain 'image' or 'auto' (auto is safe)

    // Where to upload in Cloudinary: place in folder by user type
    const folder = `${normalizedType.toLowerCase()}s`; // e.g., candidates, employers, admins

    // Upload file to Cloudinary
    const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
      folder,
      resource_type: resourceType,
    });

    // Update user model (only for certain fileTypes and only when NOT an explicit post)
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found in DB" });

    // Map fileType to user fields (canonical)
    const fieldMap = {
      photo: "photoUrl",
      resume: "documentUrl",
      document: "documentUrl",
      audio: "audioUrl",
      video: "videoUrl",
    };

    // Decide whether this upload is a profile update or a "post/asset"
    // If the route is /photoPost (or fileType === 'photopost') OR the client sent purpose=post,
    // treat it as a feed/post asset and do NOT overwrite user's profile photo.
    const isExplicitPostRoute = canonicalFileType === "photopost" || canonicalFileType === "photo-post";
    const clientPurpose = (req.body && req.body.purpose) ? String(req.body.purpose).toLowerCase() : null;
    const isPurposePost = clientPurpose === "post" || clientPurpose === "feed";
    const treatAsPost = isExplicitPostRoute || isPurposePost;

    // If NOT a post, and we have a mapped field, update the user's field
    if (!treatAsPost && fieldMap[canonicalFileType]) {
      user[fieldMap[canonicalFileType]] = result.secure_url;
      await user.save();
    }

    // If uploader is Admin and fileType is photo/video/audio (or photoPost), save to Gallery
    // We treat photoPost same as photo for gallery storage (it's an asset)
    const galleryFileTypes = ["photo", "photopost", "photo-post", "video", "audio"];
    if (normalizedType === "Admin" && galleryFileTypes.includes(canonicalFileType)) {
      await Gallery.create({
        adminId: req.user.id,
        fileType: canonicalFileType,
        url: result.secure_url,
        public_id: result.public_id,
        originalName: file.name,
      });
    }

    // Save file record in FileUpload collection
    const fileRecord = await FileUpload.create({
      userId: req.user.id,
      userType: normalizedType,
      fileType: canonicalFileType,
      originalName: file.name,
      fileName: result.public_id,
      url: result.secure_url,
      mimetype: file.mimetype || file.mimeType || null,
      size: file.size || null,
    });

    // Build response: include file record and user (after possible update)
    // If this was a post upload, we return the user without modifying profile photo field.
    const responseUser = user.toObject ? user.toObject() : user;

    res.json({
      message: `${canonicalFileType} uploaded successfully`,
      file: fileRecord,
      user: responseUser,
      cloudinary: { public_id: result.public_id, secure_url: result.secure_url }, // helpful for frontend
    });
  } catch (err) {
    console.error("File upload error:", err);
    res.status(500).json({ error: "File upload failed", details: err.message });
  }
};
