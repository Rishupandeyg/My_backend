import express from "express";
import authMiddleware from "../middlewares/auth.js";
import Application from "../models/Application.js";
import JobPost from "../models/JobPost.js";

const router = express.Router();

// Candidate applies for a job
router.post("/apply/:jobId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "candidate") {
      return res.status(403).json({ message: "Only candidates can apply" });
    }

    const { jobId } = req.params;

    // Check job exists
    const job = await JobPost.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Check already applied
    const existing = await Application.findOne({ jobId, user: req.user.id });
    if (existing)
      return res.status(400).json({ message: "You already applied for this job" });

    // Save application
    const application = new Application({ jobId, user: req.user.id });
    await application.save();

    res.json({ message: "Application submitted successfully", application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to apply", error: err.message });
  }
});

// Get candidate's own applications
router.get("/my-applications", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "candidate") {
      return res.status(403).json({ message: "Only candidates can view applications" });
    }

    const apps = await Application.find({ user: req.user.id })
      .populate("jobId", "title companyName location category")
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

// Get all applicants for a job (Employer/Admin)
router.get("/job/:jobId", authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await JobPost.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (req.user.role === "employer" && job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (req.user.role !== "employer" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only employers/admins can view applicants" });
    }

    const apps = await Application.find({ jobId })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch applicants" });
  }
});

export default router;
