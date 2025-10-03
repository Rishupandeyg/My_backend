

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
// GET employer details for a job (Paid candidates only)
router.get("/:jobId/employer", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "candidate") {
      return res.status(403).json({ message: "Only candidates can access employer info" });
    }

    // Check if candidate has paid
    const candidate = await Candidate.findById(req.user.id);
    if (!candidate.isPaid) {
      return res.status(403).json({ message: "Please complete payment to access employer details" });
    }

    const { jobId } = req.params;
    if (!jobId || !jobId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid Job ID" });
    }

    // Find job and populate employer
    const job = await JobPost.findById(jobId).populate({
      path: "postedBy",
      select: "companyName email mobile websiteLink vacancy address city state district",
    });

    if (!job) return res.status(404).json({ message: "Job not found" });

    res.json({ employer: job.postedBy });
  } catch (err) {
    console.error("Fetch Employer Error:", err);
    res.status(500).json({ message: "Failed to fetch employer info", error: err.message });
  }
});


export default router;


















// import express from "express";
// import JobPost from "../models/JobPost.js";
// import Candidate from "../models/Candidate.js";
// import authMiddleware from "../middlewares/auth.js";

// const router = express.Router();

// // POST a job (Employer only)
// router.post("/post", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "employer") return res.status(403).json({ message: "Only employers can post jobs" });

//     const { title, description, location, category } = req.body;
//     const job = new JobPost({
//       title,
//       description,
//       location,
//       category,
//       postedBy: req.user.id,
//     });

//     await job.save();
//     res.status(201).json(job);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to post job", error: err.message });
//   }
// });

// // GET all jobs (public)
// router.get("/all", async (req, res) => {
//   try {
//     const jobs = await JobPost.find()
//       .populate("postedBy", "companyName email mobile") // basic employer info
//       .sort({ createdAt: -1 });
//     res.json(jobs);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch jobs", error: err.message });
//   }
// });

// // GET jobs by logged-in employer
// router.get("/my-jobs", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "employer") return res.status(403).json({ message: "Only employers can view their jobs" });

//     const jobs = await JobPost.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
//     res.json(jobs);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch jobs", error: err.message });
//   }
// });

// // DELETE job (Employer only)
// router.delete("/:jobId", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "employer") return res.status(403).json({ message: "Only employers can delete jobs" });

//     const { jobId } = req.params;
//     const job = await JobPost.findOne({ _id: jobId, postedBy: req.user.id });
//     if (!job) return res.status(404).json({ message: "Job not found or unauthorized" });

//     await job.deleteOne();
//     res.json({ message: "Job deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to delete job", error: err.message });
//   }
// });

// // UPDATE job (Employer only)
// router.put("/:jobId", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "employer") return res.status(403).json({ message: "Only employers can update jobs" });

//     const { jobId } = req.params;
//     const { title, description, location, category } = req.body;

//     const job = await JobPost.findOne({ _id: jobId, postedBy: req.user.id });
//     if (!job) return res.status(404).json({ message: "Job not found or unauthorized" });

//     job.title = title || job.title;
//     job.description = description || job.description;
//     job.location = location || job.location;
//     job.category = category || job.category;

//     await job.save();
//     res.json(job);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to update job", error: err.message });
//   }
// });

// // GET employer details for a job (Paid candidates only)
// router.get("/:jobId/employer", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "candidate") return res.status(403).json({ message: "Only candidates can access employer info" });

//     const candidate = await Candidate.findById(req.user.id);
//     if (!candidate.isPaid) return res.status(403).json({ message: "Please complete payment to access employer details" });

//     const { jobId } = req.params;
//     const job = await JobPost.findById(jobId).populate({
//       path: "postedBy",
//       select: "companyName email mobile websiteLink vacancy address city state district",
//     });

//     if (!job) return res.status(404).json({ message: "Job not found" });

//     res.json({ employer: job.postedBy });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch employer info", error: err.message });
//   }
// });

// export default router;











// import express from "express";
// import JobPost from "../models/JobPost.js";
// import Candidate from "../models/Candidate.js";
// import authMiddleware from "../middlewares/auth.js";

// const router = express.Router();

// // -------------------------------
// // POST job (Employer only)
// // -------------------------------
// router.post("/post", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "employer") {
//       return res.status(403).json({ message: "Only employers can post jobs" });
//     }

//     const { title, description, location, category } = req.body;
//     const job = new JobPost({
//       title,
//       description,
//       location,
//       category,
//       postedBy: req.user.id,
//     });

//     await job.save();
//     res.status(201).json(job);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to post job" });
//   }
// });

// // -------------------------------
// // GET all jobs (Public)
// // -------------------------------
// router.get("/all", async (req, res) => {
//   try {
//     const jobs = await JobPost.find()
//       .populate("postedBy", "companyName email mobile") // basic employer info
//       .sort({ createdAt: -1 });
//     res.json(jobs);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to fetch jobs" });
//   }
// });

// // -------------------------------
// // GET jobs posted by logged-in employer
// // -------------------------------
// router.get("/my-jobs", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "employer") {
//       return res.status(403).json({ message: "Only employers can view their jobs" });
//     }

//     const jobs = await JobPost.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
//     res.json(jobs);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to fetch your jobs" });
//   }
// });

// // -------------------------------
// // DELETE a job (Employer only)
// // -------------------------------
// router.delete("/:jobId", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "employer") {
//       return res.status(403).json({ message: "Only employers can delete jobs" });
//     }

//     const { jobId } = req.params;
//     if (!jobId.match(/^[0-9a-fA-F]{24}$/)) {
//       return res.status(400).json({ message: "Invalid Job ID" });
//     }

//     const job = await JobPost.findOne({ _id: jobId, postedBy: req.user.id });
//     if (!job) {
//       return res.status(404).json({ message: "Job not found or unauthorized" });
//     }

//     await job.deleteOne();
//     res.json({ message: "Job deleted successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to delete job" });
//   }
// });

// // -------------------------------
// // UPDATE a job (Employer only)
// // -------------------------------
// router.put("/:jobId", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "employer") {
//       return res.status(403).json({ message: "Only employers can update jobs" });
//     }

//     const { jobId } = req.params;
//     if (!jobId.match(/^[0-9a-fA-F]{24}$/)) {
//       return res.status(400).json({ message: "Invalid Job ID" });
//     }

//     const { title, description, location, category } = req.body;

//     const job = await JobPost.findOne({ _id: jobId, postedBy: req.user.id });
//     if (!job) return res.status(404).json({ message: "Job not found or unauthorized" });

//     job.title = title || job.title;
//     job.description = description || job.description;
//     job.location = location || job.location;
//     job.category = category || job.category;

//     await job.save();
//     res.json(job);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to update job" });
//   }
// });

// // -------------------------------
// // Apply for a job (Candidate only)
// // -------------------------------
// router.post("/apply/:jobId", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "candidate") {
//       return res.status(403).json({ message: "Only candidates can apply for jobs" });
//     }

//     const { jobId } = req.params;
//     if (!jobId.match(/^[0-9a-fA-F]{24}$/)) {
//       return res.status(400).json({ message: "Invalid Job ID" });
//     }

//     return res.json({ message: `Application submitted for job ${jobId}` });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to apply for job" });
//   }
// });

// // -------------------------------
// // GET employer details for a job (Paid candidates only)
// // -------------------------------
// router.get("/:jobId/employer", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "candidate") {
//       return res.status(403).json({ message: "Only candidates can access employer info" });
//     }

//     const candidate = await Candidate.findById(req.user.id);
//     if (!candidate.isPaid) {
//       return res.status(403).json({ message: "Please complete payment to access employer details" });
//     }

//     const { jobId } = req.params;
//     if (!jobId.match(/^[0-9a-fA-F]{24}$/)) {
//       return res.status(400).json({ message: "Invalid Job ID" });
//     }

//     const job = await JobPost.findById(jobId).populate({
//       path: "postedBy",
//       select: "companyName email mobile websiteLink vacancy address city state district",
//     });

//     if (!job) return res.status(404).json({ message: "Job not found" });

//     res.json({ employer: job.postedBy });
//   } catch (err) {
//     console.error("Fetch Employer Error:", err);
//     res.status(500).json({ message: "Failed to fetch employer info", error: err.message });
//   }
// });

// export default router;








