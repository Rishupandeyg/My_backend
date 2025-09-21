// src/routes/adminRoutes.js
import express from "express";
import Candidate from "../models/Candidate.js";
import Employer from "../models/Employer.js";
import auth from "../middlewares/auth.js"; // existing auth.js

const router = express.Router();

// -----------------------
// Admin Routes
// -----------------------

// ✅ Get all candidates
router.get("/candidates", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied: Admins only" });
  }

  try {
    const candidates = await Candidate.find().select("-password");
    res.json(candidates);
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
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: "Candidate deleted" });
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
    await Employer.findByIdAndDelete(req.params.id);
    res.json({ message: "Employer deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
