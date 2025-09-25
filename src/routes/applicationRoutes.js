import express from "express";
import authMiddleware from "../middlewares/auth.js";
import Application from "../models/Application.js";
import JobPost from "../models/JobPost.js";

const router = express.Router();

// -----------------------------------
// Apply for a job (Candidate only)
// -----------------------------------
router.post("/apply/:jobId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "candidate") {
      return res.status(403).json({ message: "Only candidates can apply for jobs" });
    }

    const { jobId } = req.params;
    const userId = req.user.id;

    // Check if job exists
    const job = await JobPost.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Check if already applied
    const existingApp = await Application.findOne({ job: jobId, user: userId });
    if (existingApp) {
      return res.status(400).json({ message: "You already applied for this job" });
    }

    const app = new Application({ job: jobId, user: userId });
    await app.save();

    res.json({ message: "Application submitted successfully", application: app });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to apply for job" });
  }
});

// -----------------------------------
// Get applications of logged-in candidate
// -----------------------------------
router.get("/my-applications", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "candidate") {
      return res.status(403).json({ message: "Only candidates can view their applications" });
    }

    const apps = await Application.find({ user: req.user.id })
      .populate("job", "title companyName location")
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

// -----------------------------------
// Get applicants for a job (Employer or Admin)
// -----------------------------------
router.get("/job/:jobId", authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Fetch the job to check ownership
    const job = await JobPost.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Only employer who posted the job or admin can view applicants
    if (req.user.role === "employer" && job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to view applicants for this job" });
    }

    if (req.user.role !== "employer" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only employers or admins can view applicants" });
    }

    const apps = await Application.find({ job: jobId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch applicants" });
  }
});

export default router;
