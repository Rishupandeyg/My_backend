import express from "express";
import Employer from "../models/Employer.js";
import Candidate from "../models/Candidate.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// -----------------------
// Employer self routes
// -----------------------

// GET employer profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ message: "Access denied" });
    }

    const employer = await Employer.findById(req.user.id).select("-password");
    if (!employer) return res.status(404).json({ message: "Not found" });

    res.json(employer);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

// UPDATE employer profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ message: "Access denied" });
    }

    const updates = req.body;
    const employer = await Employer.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-password");

    res.json({ message: "Profile updated", employer });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

// GET all candidates (for employer only)
router.get("/candidates", authMiddleware, async (req, res) => {
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
