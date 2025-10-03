// src/routes/adminRoutes.js
import express from "express";
import Candidate from "../models/Candidate.js";
import Employer from "../models/Employer.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// -----------------------
// Admin Routes
// -----------------------

// ✅ Get all candidates with uploads
router.get("/candidates", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied: Admins only" });
  }

  try {
    const candidates = await Candidate.find().select(
      "-password"
    ); // exclude passwords

    const formattedCandidates = candidates.map((c) => ({
      id: c._id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      mobile: c.mobile,
      category: c.category,
      city: c.city,
      state: c.state,
      isPaid: c.isPaid,
      photo: c.photoUrl,
      resume: c.resumeUrl,
      audio: c.audioUrl,
      video: c.videoUrl,
      uploads: c.uploads || [],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.json(formattedCandidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all employers
router.get("/employers", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied: Admins only" });
  }

  try {
    const employers = await Employer.find().select("-password");
    res.json(employers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete candidate
router.delete("/candidate/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied: Admins only" });
  }

  try {
    const deleted = await Candidate.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Candidate not found" });
    res.json({ message: "Candidate deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete employer
router.delete("/employer/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied: Admins only" });
  }

  try {
    const deleted = await Employer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Employer not found" });
    res.json({ message: "Employer deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
