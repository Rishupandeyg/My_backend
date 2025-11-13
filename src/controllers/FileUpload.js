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
    const normalizedType = userType ? userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase() : null;
    const User = normalizedType ? UserModels[normalizedType] : null;
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
      body: req.body,
      query: req.query,
      purpose: req.body?.purpose || req.query?.purpose || null,
    });

    // Normalize fileType variations:
    // allow endpoints like /photoPost or /photo-post etc. map them to a canonical token
    const canonicalFileType = (fileType || "").toLowerCase();

    // Map any "post" variants to a DB-safe savedFileType (so it matches your File model enum)
    const savedFileType = (() => {
      if (!canonicalFileType) return "document";
      if (["photopost", "photo-post", "postphoto", "post-photo"].includes(canonicalFileType)) return "photo";
      if (canonicalFileType === "resume") return "document";
      // if already one of allowed enums, keep it
      if (["photo", "document", "audio", "video"].includes(canonicalFileType)) return canonicalFileType;
      // fallback
      return "document";
    })();

    // Determine Cloudinary resource type
    let resourceType = "auto";
    if (["document", "resume"].includes(canonicalFileType) || savedFileType === "document") resourceType = "raw";
    if (canonicalFileType === "audio" || canonicalFileType === "video" || savedFileType === "video") resourceType = "video";
    // images remain 'image' or 'auto'

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

    // Map fileType to user fields (use savedFileType for schema compatibility)
    const fieldMap = {
      photo: "photoUrl",
      resume: "documentUrl",
      document: "documentUrl",
      audio: "audioUrl",
      video: "videoUrl",
    };

    // Decide whether this upload is a profile update or a "post/asset"
    // If the route is /photoPost (or fileType === 'photopost') OR the client sent purpose=post (body or query),
    // treat it as a feed/post asset and do NOT overwrite user's profile photo.
    const isExplicitPostRoute = canonicalFileType === "photopost" || canonicalFileType === "photo-post";
    const clientPurposeBody = req.body && req.body.purpose ? String(req.body.purpose).toLowerCase() : null;
    const clientPurposeQuery = req.query && req.query.purpose ? String(req.query.purpose).toLowerCase() : null;
    const isPurposePost = clientPurposeBody === "post" || clientPurposeBody === "feed" || clientPurposeQuery === "post" || clientPurposeQuery === "feed";
    const treatAsPost = isExplicitPostRoute || isPurposePost;

    // If NOT a post, and we have a mapped field, update the user's field (use savedFileType)
    if (!treatAsPost && fieldMap[savedFileType]) {
      user[fieldMap[savedFileType]] = result.secure_url;
      await user.save();
    }

    // If uploader is Admin and fileType is photo/video/audio (or photoPost), save to Gallery
    // We use canonicalFileType in gallery.fileType to preserve whether it was a photopost
    const galleryFileTypes = ["photo", "photopost", "photo-post", "video", "audio"];
    if (normalizedType === "Admin" && galleryFileTypes.includes(canonicalFileType || savedFileType)) {
      await Gallery.create({
        adminId: req.user.id,
        fileType: canonicalFileType || savedFileType,
        url: result.secure_url,
        public_id: result.public_id,
        originalName: file.name,
      });
    }

    // Save file record in FileUpload collection — IMPORTANT: use savedFileType to satisfy enum
    const fileRecord = await FileUpload.create({
      userId: req.user.id,
      userType: normalizedType,
      fileType: savedFileType, // savedFileType is guaranteed to be one of ["photo","document","audio","video"]
      originalName: file.name,
      fileName: result.public_id,
      url: result.secure_url,
      mimetype: file.mimetype || file.mimeType || null,
      size: file.size || null,
    });

    // Build response: include file record and user (after possible update)
    // If this was a post upload, we return the user without modifying profile photo field.
    let responseUser = user.toObject ? user.toObject() : user;
    if (treatAsPost) {
      // double-check fresh user to ensure no accidental overwrite
      const fresh = await User.findById(req.user.id).lean();
      if (fresh) {
        responseUser.photoUrl = fresh.photoUrl || fresh.profilePic || responseUser.photoUrl;
        responseUser.profilePic = fresh.profilePic || fresh.photoUrl || responseUser.profilePic;
      }
    }

    res.json({
      message: `${canonicalFileType || savedFileType} uploaded successfully`,
      file: fileRecord,
      user: responseUser,
      cloudinary: { public_id: result.public_id, secure_url: result.secure_url }, // helpful for frontend
    });
  } catch (err) {
    console.error("File upload error:", err);
    res.status(500).json({ error: "File upload failed", details: err.message });
  }
};

