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
    });

    // Determine Cloudinary resource type
    let resourceType = "auto";
    if (fileType === "resume") resourceType = "raw";
    if (fileType === "audio" || fileType === "video") resourceType = "video";

    // Upload file to Cloudinary
    const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
      folder: `${normalizedType.toLowerCase()}s`, // lowercase folder for consistency
      resource_type: resourceType,
    });

    // Update user model
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found in DB" });

    const fieldMap = { photo: "photoUrl", resume: "resumeUrl", audio: "audioUrl", video: "videoUrl" };
    if (fieldMap[fileType]) {
      user[fieldMap[fileType]] = result.secure_url;
      await user.save();
    }

    // If uploader is Admin, also save to Gallery
    if (normalizedType === "Admin" && ["photo", "video", "audio"].includes(fileType)) {
      await Gallery.create({
        adminId: req.user.id,
        fileType,
        url: result.secure_url,
        public_id: result.public_id,
        originalName: file.name,
      });
    }

    // Save file record
    const fileRecord = await FileUpload.create({
      userId: req.user.id,
      userType: normalizedType,
      fileType,
      originalName: file.name,
      fileName: result.public_id,
      url: result.secure_url,
      mimetype: file.mimetype,
      size: file.size,
    });

    // Response
    res.json({
      message: `${fileType} uploaded successfully`,
      file: fileRecord,
      user, // generic key for frontend
    });

  } catch (err) {
    console.error("File upload error:", err);
    res.status(500).json({ error: "File upload failed", details: err.message });
  }
};













// import cloudinary from "cloudinary";
// import FileUpload from "../models/File.js";
// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import Admin from "../models/Admin.js";
// import Gallery from "../models/Gallery.js"; 

// const UserModels = { Candidate, Employer, Admin };

// // Cloudinary config
// cloudinary.v2.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.API_SECRET,
// });

// export const uploadFile = async (req, res) => {
//   try {
//     const { userType, fileType } = req.params;
//     const User = UserModels[userType];

//     if (!User) return res.status(400).json({ error: "Invalid user type" });
//     if (!req.files || !req.files.file) return res.status(400).json({ error: "No file uploaded" });
//     if (!req.user?.id) return res.status(401).json({ error: "Unauthorized: User not found" });

//     const file = req.files.file;

//     // Determine Cloudinary resource type
//     let resourceType = "auto";
//     if (fileType === "resume") resourceType = "raw";
//     if (fileType === "audio" || fileType === "video") resourceType = "video";

//     // Upload file to Cloudinary
//     const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
//       folder: `${userType}s`,
//       resource_type: resourceType,
//     });

//     // Update user model
//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ error: "User not found" });

//     const fieldMap = { photo: "photoUrl", resume: "resumeUrl", audio: "audioUrl", video: "videoUrl" };
//     if (fieldMap[fileType]) {
//       user[fieldMap[fileType]] = result.secure_url;
//       await user.save();
//     }

//     // ✅ If uploader is Admin, also save to Gallery
//     if (userType === "Admin" && ["photo", "video", "audio"].includes(fileType)) {
//       await Gallery.create({
//         adminId: req.user.id,
//         fileType,
//         url: result.secure_url,
//         public_id: result.public_id,
//         originalName: file.name,
//       });
//     }

//     // Save file record (same logic as before)
//     const fileRecord = await FileUpload.create({
//       userId: req.user.id,
//       userType,
//       fileType,
//       originalName: file.name,
//       fileName: result.public_id,
//       url: result.secure_url,
//       mimetype: file.mimetype,
//       size: file.size,
//     });

//     res.json({ 
//       message: `${fileType} uploaded successfully`, 
//       file: fileRecord, 
//       candidate: user // frontend expects 'candidate' object
//     });

//   } catch (err) {
//     console.error("File upload error:", err);
//     res.status(500).json({ error: "File upload failed", details: err.message });
//   }
// };











// import cloudinary from "cloudinary";
// import FileUpload from "../models/File.js";
// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import Admin from "../models/Admin.js";
// import Gallery from "../models/Gallery.js"; 


// const UserModels = { Candidate, Employer, Admin };

// // Cloudinary config
// cloudinary.v2.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.API_SECRET,
// });

// export const uploadFile = async (req, res) => {
//   try {
//     const { userType, fileType } = req.params;
//     const User = UserModels[userType];

//     if (!User) return res.status(400).json({ error: "Invalid user type" });
//     if (!req.files || !req.files.file) return res.status(400).json({ error: "No file uploaded" });
//     if (!req.user?.id) return res.status(401).json({ error: "Unauthorized: User not found" });

//     const file = req.files.file;

//     // Determine Cloudinary resource type
//     let resourceType = "auto";
//     if (fileType === "resume") resourceType = "raw";
//     if (fileType === "audio" || fileType === "video") resourceType = "video";

//     // Upload file to Cloudinary
//     const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
//       folder: `${userType}s`,
//       resource_type: resourceType,
//     });

//     // Update user model
//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ error: "User not found" });

//     const fieldMap = { photo: "photoUrl", resume: "resumeUrl", audio: "audioUrl", video: "videoUrl" };
//     if (fieldMap[fileType]) {
//       user[fieldMap[fileType]] = result.secure_url;
//       await user.save();
//     }

//     // If uploader is Admin, also save to Gallery
// if (userType === "Admin" && ["photo", "video", "audio"].includes(fileType)) {
//   await Gallery.create({
//     adminId: userId,
//     fileType,
//     url: uploadResponse.secure_url,
//     public_id: uploadResponse.public_id,
//     originalName: file.originalname,
//   });
// }


//     // Save file record
//     const fileRecord = await FileUpload.create({
//       userId: req.user.id,
//       userType,
//       fileType,
//       originalName: file.name,
//       fileName: result.public_id,
//       url: result.secure_url,
//       mimetype: file.mimetype,
//       size: file.size,
//     });

//     res.json({ 
//       message: `${fileType} uploaded successfully`, 
//       file: fileRecord, 
//       candidate: user // frontend expects 'candidate' object
//     });
//   } catch (err) {
//     console.error("File upload error:", err);
//     res.status(500).json({ error: "File upload failed", details: err.message });
//   }
// };













// import cloudinary from "cloudinary";
// import FileUpload from "../models/File.js";
// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import Admin from "../models/Admin.js";

// const UserModels = { Candidate, Employer, Admin };

// // Cloudinary config
// cloudinary.v2.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// export const uploadFile = async (req, res) => {
//   try {
//     const { userType, fileType } = req.params;
//     const User = UserModels[userType];

//     console.log("User type:", userType);
//     console.log("File type:", fileType);
//     console.log("Files received:", req.files);
//     console.log("User ID:", req.user?.id);

//     if (!User) return res.status(400).json({ error: "Invalid user type" });
//     if (!req.files || !req.files.file) return res.status(400).json({ error: "No file uploaded" });
//     if (!req.user?.id) return res.status(401).json({ error: "Unauthorized: User not found" });

//     const file = req.files.file;

//     // Determine Cloudinary resource type
//     let resourceType = "auto";
//     if (fileType === "resume") resourceType = "raw";
//     if (fileType === "audio" || fileType === "video") resourceType = "video"; // Cloudinary treats audio as video

//     // Upload to Cloudinary
//     const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
//       folder: `${userType}s`,
//       resource_type: resourceType,
//     });

//     // Update user model
//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ error: "User not found" });

//     const fieldMap = { photo: "photoUrl", resume: "resumeUrl", audio: "audioUrl", video: "videoUrl" };
//     if (fieldMap[fileType]) {
//       user[fieldMap[fileType]] = result.secure_url;
//       await user.save();
//     }

//     // Save file record
//     const fileRecord = await FileUpload.create({
//       userId: req.user.id,
//       userType,
//       fileType,
//       originalName: file.name,
//       fileName: result.public_id,
//       url: result.secure_url,
//       mimetype: file.mimetype,
//       size: file.size,
//     });

//     res.json({ message: `${fileType} uploaded successfully`, file: fileRecord, candidate: user });
//   } catch (err) {
//     console.error("File upload error:", err);
//     res.status(500).json({ error: "File upload failed", details: err.message });
//   }
// };
