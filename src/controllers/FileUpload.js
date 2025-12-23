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
//     const normalizedType = userType ? userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase() : null;
//     const User = normalizedType ? UserModels[normalizedType] : null;
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
//       body: req.body,
//       query: req.query,
//       purpose: req.body?.purpose || req.query?.purpose || null,
//     });

//     // Normalize fileType variations:
//     // allow endpoints like /photoPost or /photo-post etc. map them to a canonical token
//     const canonicalFileType = (fileType || "").toLowerCase();

//     // Map any "post" variants to a DB-safe savedFileType (so it matches your File model enum)
//     const savedFileType = (() => {
//       if (!canonicalFileType) return "document";
//       if (["photopost", "photo-post", "postphoto", "post-photo"].includes(canonicalFileType)) return "photo";
//       if (canonicalFileType === "resume") return "document";
//       // if already one of allowed enums, keep it
//       if (["photo", "document", "audio", "video"].includes(canonicalFileType)) return canonicalFileType;
//       // fallback
//       return "document";
//     })();

//     // Determine Cloudinary resource type
//     let resourceType = "auto";
//     if (["document", "resume"].includes(canonicalFileType) || savedFileType === "document") resourceType = "raw";
//     if (canonicalFileType === "audio" || canonicalFileType === "video" || savedFileType === "video") resourceType = "video";
//     // images remain 'image' or 'auto'

//     // Where to upload in Cloudinary: place in folder by user type
//     const folder = `${normalizedType.toLowerCase()}s`; // e.g., candidates, employers, admins

//     // Upload file to Cloudinary
//     const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
//       folder,
//       resource_type: resourceType,
//     });

//     // Update user model (only for certain fileTypes and only when NOT an explicit post)
//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ error: "User not found in DB" });

//     // Map fileType to user fields (use savedFileType for schema compatibility)
//     const fieldMap = {
//       photo: "photoUrl",
//       resume: "documentUrl",
//       document: "documentUrl",
//       audio: "audioUrl",
//       video: "videoUrl",
//     };

//     // Decide whether this upload is a profile update or a "post/asset"
//     // If the route is /photoPost (or fileType === 'photopost') OR the client sent purpose=post (body or query),
//     // treat it as a feed/post asset and do NOT overwrite user's profile photo.
//     const isExplicitPostRoute = canonicalFileType === "photopost" || canonicalFileType === "photo-post";
//     const clientPurposeBody = req.body && req.body.purpose ? String(req.body.purpose).toLowerCase() : null;
//     const clientPurposeQuery = req.query && req.query.purpose ? String(req.query.purpose).toLowerCase() : null;
//     const isPurposePost = clientPurposeBody === "post" || clientPurposeBody === "feed" || clientPurposeQuery === "post" || clientPurposeQuery === "feed";
//     const treatAsPost = isExplicitPostRoute || isPurposePost;

//     // If NOT a post, and we have a mapped field, update the user's field (use savedFileType)
//     if (!treatAsPost && fieldMap[savedFileType]) {
//       user[fieldMap[savedFileType]] = result.secure_url;
//       await user.save();
//     }

//     // If uploader is Admin and fileType is photo/video/audio (or photoPost), save to Gallery
//     // We use canonicalFileType in gallery.fileType to preserve whether it was a photopost
//     const galleryFileTypes = ["photo", "photopost", "photo-post", "video", "audio"];
//     if (normalizedType === "Admin" && galleryFileTypes.includes(canonicalFileType || savedFileType)) {
//       await Gallery.create({
//         adminId: req.user.id,
//         fileType: canonicalFileType || savedFileType,
//         url: result.secure_url,
//         public_id: result.public_id,
//         originalName: file.name,
//       });
//     }

//     // Save file record in FileUpload collection — IMPORTANT: use savedFileType to satisfy enum
//     const fileRecord = await FileUpload.create({
//       userId: req.user.id,
//       userType: normalizedType,
//       fileType: savedFileType, // savedFileType is guaranteed to be one of ["photo","document","audio","video"]
//       originalName: file.name,
//       fileName: result.public_id,
//       url: result.secure_url,
//       mimetype: file.mimetype || file.mimeType || null,
//       size: file.size || null,
//     });

//     // Build response: include file record and user (after possible update)
//     // If this was a post upload, we return the user without modifying profile photo field.
//     let responseUser = user.toObject ? user.toObject() : user;
//     if (treatAsPost) {
//       // double-check fresh user to ensure no accidental overwrite
//       const fresh = await User.findById(req.user.id).lean();
//       if (fresh) {
//         responseUser.photoUrl = fresh.photoUrl || fresh.profilePic || responseUser.photoUrl;
//         responseUser.profilePic = fresh.profilePic || fresh.photoUrl || responseUser.profilePic;
//       }
//     }

//     res.json({
//       message: `${canonicalFileType || savedFileType} uploaded successfully`,
//       file: fileRecord,
//       user: responseUser,
//       cloudinary: { public_id: result.public_id, secure_url: result.secure_url }, // helpful for frontend
//     });
//   } catch (err) {
//     console.error("File upload error:", err);
//     res.status(500).json({ error: "File upload failed", details: err.message });
//   }
// };


// // src/controllers/FileUpload.js
// import cloudinary from "cloudinary";
// import FileUpload from "../models/File.js";
// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import Admin from "../models/Admin.js";
// import Gallery from "../models/Gallery.js";
// import NewsAdmin from "../models/NewsAdmin.js";   

// // Map of user models
// const UserModels = { 
//   Candidate, 
//   Employer, 
//   Admin,
//   Newsadmin: NewsAdmin          
// };

// // Cloudinary config
// cloudinary.v2.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.API_SECRET,
// });

// export const uploadFile = async (req, res) => {
//   try {
//     let { userType, fileType } = req.params;

//     const normalizedType = userType ? userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase() : null;
//     const User = normalizedType ? UserModels[normalizedType] : null;
//     if (!User) return res.status(400).json({ error: "Invalid user type" });

//     if (!req.user?.id) return res.status(401).json({ error: "Unauthorized: User not found" });
//     if (!req.files || !req.files.file) return res.status(400).json({ error: "No file uploaded" });

//     const file = req.files.file;

//     console.log("UPLOAD DEBUG:", {
//       userId: req.user.id,
//       role: req.user.role,
//       params: req.params,
//       fileName: file.name,
//       body: req.body,
//       query: req.query,
//       purpose: req.body?.purpose || req.query?.purpose || null,
//     });

//     const canonicalFileType = (fileType || "").toLowerCase();

//     const savedFileType = (() => {
//       if (!canonicalFileType) return "document";
//       if (["photopost", "photo-post", "postphoto", "post-photo"].includes(canonicalFileType)) return "photo";
//       if (canonicalFileType === "resume") return "document";
//       if (["photo", "document", "audio", "video"].includes(canonicalFileType)) return canonicalFileType;
//       return "document";
//     })();

//     let resourceType = "auto";
//     if (["document", "resume"].includes(canonicalFileType) || savedFileType === "document") resourceType = "raw";
//     if (canonicalFileType === "audio" || canonicalFileType === "video" || savedFileType === "video") resourceType = "video";

//     const folder = `${normalizedType.toLowerCase()}s`;

//     const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
//       folder,
//       resource_type: resourceType,
//     });

//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ error: "User not found in DB" });

//     const fieldMap = {
//       photo: "photoUrl",
//       resume: "documentUrl",
//       document: "documentUrl",
//       audio: "audioUrl",
//       video: "videoUrl",
//     };

//     const isExplicitPostRoute = canonicalFileType === "photopost" || canonicalFileType === "photo-post";
//     const clientPurposeBody = req.body && req.body.purpose ? String(req.body.purpose).toLowerCase() : null;
//     const clientPurposeQuery = req.query && req.query.purpose ? String(req.query.purpose).toLowerCase() : null;
//     const isPurposePost = clientPurposeBody === "post" || clientPurposeBody === "feed" || clientPurposeQuery === "post" || clientPurposeQuery === "feed";
//     const treatAsPost = isExplicitPostRoute || isPurposePost;

//     if (!treatAsPost && fieldMap[savedFileType]) {
//       user[fieldMap[savedFileType]] = result.secure_url;
//       await user.save();
//     }

//     const galleryFileTypes = ["photo", "photopost", "photo-post", "video", "audio"];
//     if (normalizedType === "Admin" && galleryFileTypes.includes(canonicalFileType || savedFileType)) {
//       await Gallery.create({
//         adminId: req.user.id,
//         fileType: canonicalFileType || savedFileType,
//         url: result.secure_url,
//         public_id: result.public_id,
//         originalName: file.name,
//       });
//     }

//     const fileRecord = await FileUpload.create({
//       userId: req.user.id,
//       userType: normalizedType,
//       fileType: savedFileType,
//       originalName: file.name,
//       fileName: result.public_id,
//       url: result.secure_url,
//       mimetype: file.mimetype || file.mimeType || null,
//       size: file.size || null,
//     });

//     let responseUser = user.toObject ? user.toObject() : user;

//     if (treatAsPost) {
//       const fresh = await User.findById(req.user.id).lean();
//       if (fresh) {
//         responseUser.photoUrl = fresh.photoUrl || fresh.profilePic || responseUser.photoUrl;
//         responseUser.profilePic = fresh.profilePic || fresh.photoUrl || responseUser.profilePic;
//       }
//     }

//     res.json({
//       message: `${canonicalFileType || savedFileType} uploaded successfully`,
//       file: fileRecord,
//       user: responseUser,
//       cloudinary: { public_id: result.public_id, secure_url: result.secure_url },
//     });
//   } catch (err) {
//     console.error("File upload error:", err);
//     res.status(500).json({ error: "File upload failed", details: err.message });
//   }
// };


// // src/controllers/FileUpload.js
// import cloudinary from "cloudinary";
// import FileUpload from "../models/File.js";
// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import Admin from "../models/Admin.js";
// import Gallery from "../models/Gallery.js";
// import NewsAdmin from "../models/NewsAdmin.js";

// // Map user models
// const UserModels = {
//   Candidate,
//   Employer,
//   Admin,
//   Newsadmin: NewsAdmin,
// };

// // Cloudinary config
// cloudinary.v2.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.API_SECRET,
// });

// export const uploadFile = async (req, res) => {
//   try {
//     let { userType, fileType } = req.params;

//     const normalizedType = userType
//       ? userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase()
//       : null;

//     const User = normalizedType ? UserModels[normalizedType] : null;
//     if (!User) return res.status(400).json({ error: "Invalid user type" });

//     if (!req.user?.id) return res.status(401).json({ error: "Unauthorized: User not found" });
//     if (!req.files || !req.files.file)
//       return res.status(400).json({ error: "No file uploaded" });

//     const file = req.files.file;

//     const canonicalFileType = (fileType || "").toLowerCase();

//     // Map file type
//     const savedFileType = (() => {
//       if (!canonicalFileType) return "document";
//       if (["photopost", "photo-post", "postphoto", "post-photo"].includes(canonicalFileType))
//         return "photo";
//       if (canonicalFileType === "resume") return "document";
//       if (["photo", "document", "audio", "video"].includes(canonicalFileType))
//         return canonicalFileType;
//       return "document";
//     })();

//     // Detect Cloudinary resource type
//     let resourceType = "auto";
//     if (["document", "resume"].includes(canonicalFileType) || savedFileType === "document")
//       resourceType = "raw";
//     if (["video", "audio"].includes(savedFileType)) resourceType = "video";

//     const folder = `${normalizedType.toLowerCase()}s`;

//     // Upload to Cloudinary
//     const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
//       folder,
//       resource_type: resourceType,
//     });

//     // Fetch user
//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ error: "User not found in DB" });

//     // Map profile fields
//     const fieldMap = {
//       photo: "photoUrl",
//       resume: "resumeUrl",
//       document: "resumeUrl",
//       audio: "audioUrl",
//       video: "videoUrl",
//     };

//     // Should we treat it as a feed post?
//     const isExplicitPostRoute = ["photopost", "photo-post"].includes(canonicalFileType);
//     const isPurposePost =
//       req.body?.purpose === "post" || req.query?.purpose === "post";

//     const treatAsPost = isExplicitPostRoute || isPurposePost;

//     // Update main fields (photoUrl, videoUrl ...)
//     if (!treatAsPost && fieldMap[savedFileType]) {
//       user[fieldMap[savedFileType]] = result.secure_url;
//     }

//     // 🔥🔥🔥 FINAL FIX: Candidate gallery save 🔥🔥🔥
//     if (normalizedType === "Candidate") {
//       user.gallery = user.gallery || [];

//       user.gallery.push({
//         filename: result.public_id,
//         originalName: file.name,
//         url: result.secure_url,
//         mimetype: file.mimetype,
//         size: file.size,
//         type: savedFileType,
//       });
//     }

//     // Save user
//     await user.save();

//     // Save general file record
//     const fileRecord = await FileUpload.create({
//       userId: req.user.id,
//       userType: normalizedType,
//       fileType: savedFileType,
//       originalName: file.name,
//       fileName: result.public_id,
//       url: result.secure_url,
//       mimetype: file.mimetype,
//       size: file.size,
//     });

//     const responseUser = await User.findById(req.user.id).select("-password").lean();

//     res.json({
//       message: `${savedFileType} uploaded successfully`,
//       file: fileRecord,
//       user: responseUser,
//       cloudinary: {
//         public_id: result.public_id,
//         secure_url: result.secure_url,
//       },
//     });

//   } catch (err) {
//     console.error("File upload error:", err);
//     res.status(500).json({
//       error: "File upload failed",
//       details: err.message,
//     });
//   }
// };

// // src/controllers/FileUpload.js
// import cloudinary from "cloudinary";
// import FileUpload from "../models/File.js";
// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import Admin from "../models/Admin.js";
// import Gallery from "../models/Gallery.js";
// import NewsAdmin from "../models/NewsAdmin.js";

// // Map user models
// const UserModels = {
//   Candidate,
//   Employer,
//   Admin,
//   Newsadmin: NewsAdmin,
// };

// // Cloudinary config
// cloudinary.v2.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.API_SECRET,
// });

// export const uploadFile = async (req, res) => {
//   try {
//     let { userType, fileType } = req.params;

//     const normalizedType = userType
//       ? userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase()
//       : null;

//     const User = normalizedType ? UserModels[normalizedType] : null;
//     if (!User) return res.status(400).json({ error: "Invalid user type" });

//     if (!req.user?.id)
//       return res.status(401).json({ error: "Unauthorized: User not found" });

//     if (!req.files || !req.files.file)
//       return res.status(400).json({ error: "No file uploaded" });

//     const file = req.files.file;
//     const originalExt =
//       file.name.includes(".") && file.name.split(".").length > 1
//         ? file.name.split(".").pop()
//         : null;

//     const canonicalFileType = (fileType || "").toLowerCase();

//     const savedFileType = (() => {
//       if (!canonicalFileType) return "document";
//       if (
//         ["photopost", "photo-post", "postphoto", "post-photo"].includes(
//           canonicalFileType
//         )
//       )
//         return "photo";
//       if (canonicalFileType === "resume") return "document";
//       if (["photo", "document", "audio", "video"].includes(canonicalFileType))
//         return canonicalFileType;
//       return "document";
//     })();

//     // -------------------------------------
//     // FIX — Correct Cloudinary resource type
//     // -------------------------------------
//     let resourceType = "auto";

//     if (file.mimetype.startsWith("application/")) {
//       resourceType = "raw";
//     } else if (file.mimetype.startsWith("video/")) {
//       resourceType = "video";
//     } else if (file.mimetype.startsWith("audio/")) {
//       resourceType = "video";
//     } else if (file.mimetype.startsWith("image/")) {
//       resourceType = "image";
//     }

//     const folder = `${normalizedType.toLowerCase()}s`;

//     // Upload to Cloudinary
//     const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
//       folder,
//       resource_type: resourceType,
//     });

//     // Apply extension to RAW documents for opening
//     let finalUrl = result.secure_url;

//     if (file.mimetype.startsWith("application/") && originalExt) {
//       finalUrl = result.secure_url.replace(
//         "/upload/",
//         `/upload/fl_attachment:${file.name}/`
//       );
//     }

//     // Fetch user
//     const user = await User.findById(req.user.id);
//     if (!user)
//       return res.status(404).json({ error: "User not found in database" });

//     const fieldMap = {
//       photo: "photoUrl",
//       resume: "resumeUrl",
//       document: "resumeUrl",
//       audio: "audioUrl",
//       video: "videoUrl",
//     };

//     const isExplicitPostRoute = ["photopost", "photo-post"].includes(
//       canonicalFileType
//     );
//     const isPurposePost =
//       req.body?.purpose === "post" || req.query?.purpose === "post";

//     const treatAsPost = isExplicitPostRoute || isPurposePost;

//     // Main profile fields update (photo/video/audio)
//     if (!treatAsPost && fieldMap[savedFileType]) {
//       user[fieldMap[savedFileType]] = finalUrl;
//     }

//     // --------------------------------
//     // Gallery Save (FINAL FIX)
//     // --------------------------------
//     if (normalizedType === "Candidate") {
//       user.gallery = user.gallery || [];

//       user.gallery.push({
//         filename: result.public_id,
//         originalName: file.name,
//         url: finalUrl,
//         mimetype: file.mimetype,
//         size: file.size,
//         type: savedFileType,
//       });
//     }

//     await user.save();

//     const fileRecord = await FileUpload.create({
//       userId: req.user.id,
//       userType: normalizedType,
//       fileType: savedFileType,
//       originalName: file.name,
//       fileName: result.public_id,
//       url: finalUrl,
//       mimetype: file.mimetype,
//       size: file.size,
//     });

//     const responseUser = await User.findById(req.user.id)
//       .select("-password")
//       .lean();

//     return res.json({
//       message: `${savedFileType} uploaded successfully`,
//       file: fileRecord,
//       user: responseUser,
//       cloudinary: {
//         public_id: result.public_id,
//         secure_url: finalUrl,
//       },
//     });
//   } catch (err) {
//     console.error("File upload error:", err);
//     return res.status(500).json({
//       error: "File upload failed",
//       details: err.message,
//     });
//   }
// };

// // src/controllers/FileUpload.js
// import cloudinary from "cloudinary";
// import FileUpload from "../models/File.js";
// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import Admin from "../models/Admin.js";
// import Gallery from "../models/Gallery.js";
// import NewsAdmin from "../models/NewsAdmin.js";

// // Map user models
// const UserModels = {
//   Candidate,
//   Employer,
//   Admin,
//   Newsadmin: NewsAdmin,
// };

// // Cloudinary config
// cloudinary.v2.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.API_SECRET,
// });

// /**
//  * NOTE:
//  * If you need to debug a specific uploaded file from local disk for tooling,
//  * use the path from the user's upload history (example below).
//  *
//  * Example uploaded local path (from conversation history):
//  * /mnt/data/byehhqltbeasvs6pa0pd
//  *
//  * The tool that serves/validates files will convert that local path to an accessible URL.
//  */

// export const uploadFile = async (req, res) => {
//   try {
//     let { userType, fileType } = req.params;

//     const normalizedType = userType
//       ? userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase()
//       : null;

//     const User = normalizedType ? UserModels[normalizedType] : null;
//     if (!User) return res.status(400).json({ error: "Invalid user type" });

//     if (!req.user?.id)
//       return res.status(401).json({ error: "Unauthorized: User not found" });

//     if (!req.files || !req.files.file)
//       return res.status(400).json({ error: "No file uploaded" });

//     const file = req.files.file;

//     // Ensure tempFilePath exists (some upload middlewares set this)
//     if (!file.tempFilePath && !file.path && !file.mv) {
//       // fallback: some libs provide buffer - if so, write to tmp and upload
//       return res.status(400).json({ error: "Uploaded file missing temp path" });
//     }

//     const originalName = file.name || file.originalname || "file";
//     const originalExt =
//       originalName && originalName.includes(".")
//         ? originalName.split(".").pop()
//         : null;

//     const canonicalFileType = (fileType || "").toLowerCase();

//     const savedFileType = (() => {
//       if (!canonicalFileType) return "document";
//       if (
//         ["photopost", "photo-post", "postphoto", "post-photo"].includes(
//           canonicalFileType
//         )
//       )
//         return "photo";
//       if (canonicalFileType === "resume") return "document";
//       if (["photo", "document", "audio", "video"].includes(canonicalFileType))
//         return canonicalFileType;
//       return "document";
//     })();

//     // -----------------------------
//     // Robust Cloudinary resource type detection
//     // -----------------------------
//     let resourceType = "auto";
//     const mimetype = file.mimetype || file.mimeType || "";

//     if (mimetype.startsWith("application/")) {
//       resourceType = "raw";
//     } else if (mimetype.startsWith("video/")) {
//       resourceType = "video";
//     } else if (mimetype.startsWith("audio/")) {
//       // Cloudinary uses 'video' resource_type for audio as well
//       resourceType = "video";
//     } else if (mimetype.startsWith("image/")) {
//       resourceType = "image";
//     }

//     const folder = `${normalizedType.toLowerCase()}s`;

//     // Upload options: keep resource_type explicit to avoid Cloudinary guessing
//     const uploadOptions = {
//       folder,
//       resource_type: resourceType,
//       use_filename: false,
//       unique_filename: true,
//       overwrite: false,
//     };

//     // Some setups pass buffer (req.files.file.data). If so, use upload_stream.
//     let result;
//     if (file.tempFilePath) {
//       result = await cloudinary.v2.uploader.upload(file.tempFilePath, uploadOptions);
//     } else if (file.path) {
//       result = await cloudinary.v2.uploader.upload(file.path, uploadOptions);
//     } else if (file.data) {
//       // fallback using upload_stream
//       result = await new Promise((resolve, reject) => {
//         const stream = cloudinary.v2.uploader.upload_stream(
//           uploadOptions,
//           (err, resu) => {
//             if (err) return reject(err);
//             resolve(resu);
//           }
//         );
//         stream.end(file.data);
//       });
//     } else {
//       // If none available, fail gracefully
//       return res.status(400).json({ error: "Unable to read uploaded file content" });
//     }

//     // -----------------------------
//     // Ensure returned URL opens correctly for RAW docs:
//     // Use fl_attachment:<filename> transform to force proper content-disposition and extension
//     // -----------------------------
//     let finalUrl = result.secure_url;
//     if (resourceType === "raw" && originalExt) {
//       // Insert fl_attachment with filename into the URL path so Cloudinary serves correct headers
//       // Example replacement: /upload/  ->  /upload/fl_attachment:resume.pdf/
//       // Keep existing transformations if any (result.secure_url already contains /upload/...).
//       finalUrl = result.secure_url.replace(
//         "/upload/",
//         `/upload/fl_attachment:${encodeURIComponent(originalName)}/`
//       );
//     }

//     // Fetch user document
//     const user = await User.findById(req.user.id);
//     if (!user)
//       return res.status(404).json({ error: "User not found in database" });

//     const fieldMap = {
//       photo: "photoUrl",
//       resume: "resumeUrl",
//       document: "resumeUrl",
//       audio: "audioUrl",
//       video: "videoUrl",
//     };

//     // Detect "post" intent (treat as feed/post rather than profile override)
//     const isExplicitPostRoute = ["photopost", "photo-post"].includes(canonicalFileType);
//     const isPurposePost =
//       (req.body && String(req.body.purpose).toLowerCase() === "post") ||
//       (req.query && String(req.query.purpose).toLowerCase() === "post");

//     const treatAsPost = isExplicitPostRoute || isPurposePost;

//     // Update profile-level fields (photoUrl, videoUrl...) only if not posting to feed
//     if (!treatAsPost && fieldMap[savedFileType]) {
//       user[fieldMap[savedFileType]] = finalUrl;
//     }

//     // -----------------------------
//     // Save to candidate.gallery (guaranteed)
//     // -----------------------------
//     if (normalizedType === "Candidate") {
//       user.gallery = user.gallery || [];
//       user.gallery.push({
//         filename: result.public_id,
//         originalName,
//         url: finalUrl,
//         mimetype,
//         size: file.size || null,
//         type: savedFileType,
//         uploadedAt: new Date(),
//       });
//     }

//     // Persist user changes
//     await user.save();

//     // Log file record (audit)
//     const fileRecord = await FileUpload.create({
//       userId: req.user.id,
//       userType: normalizedType,
//       fileType: savedFileType,
//       originalName,
//       fileName: result.public_id,
//       url: finalUrl,
//       mimetype,
//       size: file.size || null,
//     });

//     // Return fresh user (without password) and file info
//     const responseUser = await User.findById(req.user.id).select("-password").lean();

//     return res.json({
//       message: `${savedFileType} uploaded successfully`,
//       file: fileRecord,
//       user: responseUser,
//       cloudinary: {
//         public_id: result.public_id,
//         secure_url: finalUrl,
//       },
//     });
//   } catch (err) {
//     console.error("File upload error:", err);
//     return res.status(500).json({
//       error: "File upload failed",
//       details: err.message,
//     });
//   }
// };



// src/controllers/FileUpload.js
import cloudinary from "cloudinary";
import FileUpload from "../models/File.js";
import Candidate from "../models/Candidate.js";
import Employer from "../models/Employer.js";
import Admin from "../models/Admin.js";
import NewsAdmin from "../models/NewsAdmin.js";
import Gallery from "../models/Gallery.js";


// Map user models
const UserModels = {
  Candidate,
  Employer,
  Admin,
  Newsadmin: NewsAdmin,
};

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export const uploadFile = async (req, res) => {
  try {
    let { userType, fileType } = req.params;

    const normalizedType = userType
      ? userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase()
      : null;

    const User = normalizedType ? UserModels[normalizedType] : null;
    if (!User) return res.status(400).json({ error: "Invalid user type" });

    if (!req.user?.id)
      return res.status(401).json({ error: "Unauthorized: User not found" });

    if (!req.files || !req.files.file)
      return res.status(400).json({ error: "No file uploaded" });

    const file = req.files.file;

    const originalName = file.name || file.originalname || "file";
    const canonicalFileType = (fileType || "").toLowerCase();

    // Clean fileType mapping
    const savedFileType = (() => {
      if (["photo", "photopost", "photo-post"].includes(canonicalFileType))
        return "photo";
      if (canonicalFileType === "audio") return "audio";
      if (canonicalFileType === "video") return "video";
      return "document"; // default
    })();

    // 👍 CLEAN + STABLE RESOURCE TYPE DETECTION
    let resourceType;
    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    } else if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    } else {
      resourceType = "raw"; // PDFs, DOCX, PPTX, ZIP, CSV etc
    }

    const folder = `${normalizedType.toLowerCase()}s`;

    const uploadOptions = {
      folder,
      resource_type: resourceType,
      unique_filename: true,
      overwrite: false,
    };

    // 🟢 Upload file
    let result;
    if (file.tempFilePath) {
      result = await cloudinary.v2.uploader.upload(file.tempFilePath, uploadOptions);
    } else if (file.path) {
      result = await cloudinary.v2.uploader.upload(file.path, uploadOptions);
    } else if (file.data) {
      result = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream(uploadOptions, (err, res) => {
          if (err) return reject(err);
          resolve(res);
        }).end(file.data);
      });
    } else {
      return res.status(400).json({ error: "Unable to read uploaded file" });
    }

    const finalUrl = result.secure_url; // No transformation — CLEAN & SAFE

    // 🟢 Fetch user to update
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ error: "User not found in database" });

    const fieldMap = {
      photo: "photoUrl",
      video: "videoUrl",
      audio: "audioUrl",
      document: "resumeUrl",
    };

    const isPost =
      ["photopost", "photo-post"].includes(canonicalFileType) ||
      (req.body?.purpose?.toLowerCase() === "post");

    // Update profile field only if not post purpose
    if (!isPost && fieldMap[savedFileType]) {
      user[fieldMap[savedFileType]] = finalUrl;
    }

    // 🟢 Save to gallery (Candidate only)
    if (normalizedType === "Candidate") {
      user.gallery = user.gallery || [];
      user.gallery.push({
        filename: result.public_id,
        originalName,
        url: finalUrl,
        mimetype: file.mimetype,
        size: file.size || null,
        type: savedFileType,
        uploadedAt: new Date(),
      });
    }

    await user.save();

    // Log in uploads collection
    const fileRecord = await FileUpload.create({
      userId: req.user.id,
      userType: normalizedType,
      fileType: savedFileType,
      originalName,
      fileName: result.public_id,
      url: finalUrl,
      mimetype: file.mimetype,
      size: file.size || null,
    });
    // 🔥 ALSO SAVE TO PUBLIC GALLERY FOR ADMIN UPLOADS
if (normalizedType === "Admin") {
  await Gallery.create({
    url: finalUrl,
    public_id: result.public_id,
    fileType: savedFileType, // photo | video | audio
    uploadedBy: req.user.id,
  });
}


    const responseUser = await User.findById(req.user.id).select("-password");

    return res.json({
      message: `${savedFileType} uploaded successfully`,
      file: fileRecord,
      user: responseUser,
      cloudinary: {
        public_id: result.public_id,
        secure_url: finalUrl,
      },
    });
  } catch (err) {
    console.error("File upload error:", err);
    res.status(500).json({
      error: "File upload failed",
      details: err.message,
    });
  }
};
