import express from "express";
import authMiddleware from "../middlewares/auth.js";
import Application from "../models/Application.js";
import JobPost from "../models/JobPost.js";

const router = express.Router();

// -------------------------------
// Candidate applies for a job
// -------------------------------
router.post("/apply/:jobId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "candidate") {
      return res.status(403).json({ message: "Only candidates can apply" });
    }

    const { jobId } = req.params;

    // Validate Job ID
    if (!jobId || !jobId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid Job ID" });
    }

    // Check if job exists
    const job = await JobPost.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Check if already applied
    const existingApp = await Application.findOne({ job: jobId, user: req.user.id });
    if (existingApp) {
      return res.status(400).json({ message: "You already applied for this job" });
    }

    // Save application
    const application = new Application({ job: jobId, user: req.user.id });
    await application.save();

    res.json({ message: "Application submitted successfully", application });
  } catch (err) {
    console.error("Apply Error:", err);
    res.status(500).json({ message: "Failed to apply", error: err.message });
  }
});

// -------------------------------
// Candidate fetches their applications
// -------------------------------
router.get("/my-applications", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "candidate") {
      return res.status(403).json({ message: "Only candidates can view applications" });
    }

    const applications = await Application.find({ user: req.user.id })
      .populate("job", "title companyName location category")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    console.error("Fetch Applications Error:", err);
    res.status(500).json({ message: "Failed to fetch applications", error: err.message });
  }
});

// -------------------------------
// Employer/Admin fetches applicants for a job
// -------------------------------
router.get("/job/:jobId", authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId || !jobId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid Job ID" });
    }

    const job = await JobPost.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Only employer who posted the job or admin can view applicants
    if (req.user.role === "employer" && job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (req.user.role !== "employer" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only employers/admins can view applicants" });
    }

    const applicants = await Application.find({ job: jobId })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json(applicants);
  } catch (err) {
    console.error("Fetch Applicants Error:", err);
    res.status(500).json({ message: "Failed to fetch applicants", error: err.message });
  }
});

export default router;
