// routes/jobs.js
import express from "express";
import JobPost from "../models/JobPost.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// POST job (Employer)
router.post("/post", authMiddleware, async (req, res) => {
  try {
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

// GET all jobs (Candidate)
router.get("/all", async (req, res) => {
  try {
    const jobs = await JobPost.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

export default router;
