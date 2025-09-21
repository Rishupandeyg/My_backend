import express from "express";
import Candidate from "../models/Candidate.js";
import authMiddleware from "../middlewares/auth.js";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

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
    const candidate = await Candidate.findByIdAndUpdate(req.user.id, updates, { new: true }).select("-password");
    res.json({ message: "Profile updated", candidate });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

// upload photo
router.post("/upload/photo", authMiddleware, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const candidate = await Candidate.findByIdAndUpdate(
      req.user.id,
      { photo: req.file.filename },
      { new: true }
    ).select("-password");
    res.json({ message: "Photo uploaded", candidate });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

// upload resume
router.post("/upload/resume", authMiddleware, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const candidate = await Candidate.findByIdAndUpdate(
      req.user.id,
      { resume: req.file.filename },
      { new: true }
    ).select("-password");
    res.json({ message: "Resume uploaded", candidate });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

// upload multiple
router.post("/uploads", authMiddleware, upload.array("files", 50), async (req, res) => {
  try {
    const files = (req.files || []).map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      uploadedAt: new Date()
    }));

    const candidate = await Candidate.findById(req.user.id);
    if (!candidate) return res.status(404).json({ message: "Not found" });

    candidate.uploads = candidate.uploads || [];
    candidate.uploads.push(...files);
    await candidate.save();

    const candidateSafe = await Candidate.findById(req.user.id).select("-password");
    res.json({ message: "Files uploaded", uploads: candidateSafe.uploads });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

// get all uploads
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
