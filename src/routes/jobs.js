import express from "express";
import JobPost from "../models/JobPost.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// -------------------------------
// POST job (Employer only)
// -------------------------------
router.post("/post", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ message: "Only employers can post jobs" });
    }

    const { title, description, location, category } = req.body;
    const job = new JobPost({
      title,
      description,
      location,
      category,
      postedBy: req.user.id,
    });

    await job.save();
    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to post job" });
  }
});

// -------------------------------
// GET all jobs (Public - everyone)
// -------------------------------
router.get("/all", async (req, res) => {
  try {
    const jobs = await JobPost.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

// -------------------------------
// GET jobs posted by logged-in employer
// -------------------------------
router.get("/my-jobs", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ message: "Only employers can view their jobs" });
    }

    const jobs = await JobPost.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your jobs" });
  }
});

// -------------------------------
// DELETE a job (Employer only)
// -------------------------------
router.delete("/:jobId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ message: "Only employers can delete jobs" });
    }

    const { jobId } = req.params;
    const job = await JobPost.findOne({ _id: jobId, postedBy: req.user.id });

    if (!job) {
      return res.status(404).json({ message: "Job not found or you are not authorized" });
    }

    await job.deleteOne();
    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete job" });
  }
});

// -------------------------------
// UPDATE a job (Employer only)
// -------------------------------
router.put("/:jobId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ message: "Only employers can update jobs" });
    }

    const { jobId } = req.params;
    const { title, description, location, category } = req.body;

    const job = await JobPost.findOne({ _id: jobId, postedBy: req.user.id });
    if (!job) {
      return res.status(404).json({ message: "Job not found or you are not authorized" });
    }

    job.title = title || job.title;
    job.description = description || job.description;
    job.location = location || job.location;
    job.category = category || job.category;

    await job.save();
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update job" });
  }
});

// -------------------------------
// Apply for a job (Candidate only)
// -------------------------------
router.post("/apply/:jobId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "candidate") {
      return res.status(403).json({ message: "Only candidates can apply for jobs" });
    }

    const { jobId } = req.params;
    return res.json({ message: `Application submitted for job ${jobId}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to apply for job" });
  }
});

export default router;
