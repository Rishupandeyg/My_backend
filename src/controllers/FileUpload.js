import cloudinary from "cloudinary";
import FileUpload from "../models/File.js";
import Candidate from "../models/Candidate.js";
import Employer from "../models/Employer.js";
import Admin from "../models/Admin.js";

const UserModels = { Candidate, Employer, Admin };

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export const uploadFile = async (req, res) => {
  try {
    const { userType, fileType } = req.params;
    const User = UserModels[userType];

    if (!User) return res.status(400).json({ error: "Invalid user type" });
    if (!req.files || !req.files.file) return res.status(400).json({ error: "No file uploaded" });
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized: User not found" });

    const file = req.files.file;

    // Determine Cloudinary resource type
    let resourceType = "auto";
    if (fileType === "resume") resourceType = "raw";
    if (fileType === "audio" || fileType === "video") resourceType = "video";

    // Upload file to Cloudinary
    const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
      folder: `${userType}s`,
      resource_type: resourceType,
    });

    // Update user model
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const fieldMap = { photo: "photoUrl", resume: "resumeUrl", audio: "audioUrl", video: "videoUrl" };
    if (fieldMap[fileType]) {
      user[fieldMap[fileType]] = result.secure_url;
      await user.save();
    }

    // Save file record
    const fileRecord = await FileUpload.create({
      userId: req.user.id,
      userType,
      fileType,
      originalName: file.name,
      fileName: result.public_id,
      url: result.secure_url,
      mimetype: file.mimetype,
      size: file.size,
    });

    res.json({ 
      message: `${fileType} uploaded successfully`, 
      file: fileRecord, 
      candidate: user // frontend expects 'candidate' object
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
