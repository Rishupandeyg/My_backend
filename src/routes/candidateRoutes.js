import express from "express";
import authMiddleware from "../middlewares/auth.js";
import Candidate from "../models/Candidate.js";
import { uploadFile } from "../controllers/FileUpload.js";

const router = express.Router();

// -----------------------
// Candidate self routes
// -----------------------

// GET profile (without password)
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.user.id).select("-password");
    if (!candidate) return res.status(404).json({ message: "Not found" });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

// UPDATE profile (return without password)
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const candidate = await Candidate.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    ).select("-password");

    res.json({ message: "Profile updated", candidate });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

// -----------------------
// File Upload Routes (Cloudinary)
// -----------------------

// Upload photo
router.post(
  "/upload/photo",
  authMiddleware,
  async (req, res) => {
    req.params.userType = "Candidate";
    req.params.fileType = "photo";
    await uploadFile(req, res);
  }
);

// Upload resume
router.post(
  "/upload/resume",
  authMiddleware,
  async (req, res) => {
    req.params.userType = "Candidate";
    req.params.fileType = "resume";
    await uploadFile(req, res);
  }
);

// Upload audio
router.post(
  "/upload/audio",
  authMiddleware,
  async (req, res) => {
    req.params.userType = "Candidate";
    req.params.fileType = "audio";
    await uploadFile(req, res);
  }
);

// Upload video
router.post(
  "/upload/video",
  authMiddleware,
  async (req, res) => {
    req.params.userType = "Candidate";
    req.params.fileType = "video";
    await uploadFile(req, res);
  }
);

// Upload multiple files (dynamic fileType)
router.post(
  "/uploads/:fileType",
  authMiddleware,
  async (req, res) => {
    req.params.userType = "Candidate";
    // fileType from URL, e.g., 'photo', 'resume', 'audio', 'video'
    await uploadFile(req, res);
  }
);

// Get all uploads
router.get("/uploads", authMiddleware, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.user.id).select("uploads");
    if (!candidate) return res.status(404).json({ message: "Not found" });
    res.json(candidate.uploads || []);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

// -----------------------
// Employer routes
// -----------------------

// GET all candidates (employer access only)
router.get("/all", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ message: "Access denied" });
    }

    const candidates = await Candidate.find().select("-password");
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

export default router;
