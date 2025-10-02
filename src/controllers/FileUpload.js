const cloudinary = require("cloudinary").v2;
const FileUpload = require("../models/File");

// User models
const Candidate = require("../models/Candidate");
const Employer = require("../models/Employer");
const Admin = require("../models/Admin");

const UserModels = {
  Candidate,
  Employer,
  Admin,
};

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ====================
// Generic File Upload Controller
// ====================
exports.uploadFile = async (req, res) => {
  try {
    const { userType, fileType } = req.params; // e.g., "Candidate", "Employer", "Admin" & "photo","resume","audio","video"
    const User = UserModels[userType];
    if (!User) return res.status(400).json({ error: "Invalid user type" });

    if (!req.files || !req.files.file)
      return res.status(400).json({ error: "No file uploaded" });

    const file = req.files.file;

    // Cloudinary resource type mapping
    let resourceType = "auto";
    if (fileType === "resume") resourceType = "raw";
    if (fileType === "audio") resourceType = "video"; // Cloudinary treats audio as video

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: `${userType}s`, // e.g., "Candidates", "Employers", "Admins"
      resource_type: resourceType,
    });

    // Update user's own field (optional)
    const user = await User.findById(req.user.id);
    const fieldMap = {
      photo: "photoUrl",
      resume: "resumeUrl",
      audio: "audioUrl",
      video: "videoUrl",
    };
    if (fieldMap[fileType]) {
      user[fieldMap[fileType]] = result.secure_url;
      await user.save();
    }

    // Save record in FileUpload model
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

    res.json({ message: `${fileType} uploaded successfully`, file: fileRecord });
  } catch (err) {
    console.error("File upload error:", err);
    res.status(500).json({ error: "File upload failed" });
  }
};
