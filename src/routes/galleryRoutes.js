// src/routes/galleryRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Gallery from "../models/Gallery.js";
import auth, { authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// ✅ Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/gallery";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// 🖼 Upload media (admin only)
router.post("/upload", auth, authorizeRoles("admin"), upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  try {
    const newMedia = await Gallery.create({
      filename: req.file.filename,
      filepath: req.file.path,
      uploadedBy: req.user.id,
    });

    res.status(201).json(newMedia);
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

// 🧾 Get all gallery media (public)
router.get("/", async (req, res) => {
  try {
    const media = await Gallery.find().sort({ createdAt: -1 });
    res.json(media);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch gallery", error });
  }
});

// 🗑️ Delete media (admin only)
router.delete("/:id", auth, authorizeRoles("admin"), async (req, res) => {
  try {
    const media = await Gallery.findById(req.params.id);
    if (!media) return res.status(404).json({ message: "Media not found" });

    // Remove file from disk
    if (fs.existsSync(media.filepath)) fs.unlinkSync(media.filepath);

    await media.remove();
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete media", error });
  }
});

export default router;
