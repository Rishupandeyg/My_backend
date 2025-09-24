// routes/jobs.js
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
// Apply for a job (Candidate only)
// -------------------------------
router.post("/apply/:jobId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "candidate") {
      return res.status(403).json({ message: "Only candidates can apply for jobs" });
    }

    const { jobId } = req.params;

    // Later you can save applications in a JobApplication model
    // For now just confirm success
    return res.json({ message: `Application submitted for job ${jobId}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to apply for job" });
  }
});

export default router;
