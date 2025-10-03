import express from "express";
import authMiddleware from "../middlewares/auth.js";
import Candidate from "../models/Candidate.js";
import JobPost from "../models/JobPost.js";
import Application from "../models/Application.js";

const router = express.Router();

// Candidate applies for a job (Paid candidates only)
router.post("/apply/:jobId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "candidate") return res.status(403).json({ message: "Only candidates can apply" });

    const candidate = await Candidate.findById(req.user.id);
    if (!candidate.isPaid) return res.status(403).json({ message: "Please complete payment to apply" });

    const { jobId } = req.params;
    const job = await JobPost.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const existing = await Application.findOne({ job: jobId, user: req.user.id });
    if (existing) return res.status(400).json({ message: "Already applied for this job" });

    const application = await Application.create({ job: jobId, user: req.user.id });
    res.json({ message: "Application submitted successfully", application });
  } catch (err) {
    res.status(500).json({ message: "Failed to apply", error: err.message });
  }
});

// Candidate fetches their applications
router.get("/my-applications", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "candidate") return res.status(403).json({ message: "Only candidates can view applications" });

    const applications = await Application.find({ user: req.user.id })
      .populate({
        path: "job",
        select: "title location category postedBy",
        populate: { path: "postedBy", select: "companyName email mobile websiteLink" },
      })
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch applications", error: err.message });
  }
});

// Employer/Admin fetches applicants for a job
router.get("/job/:jobId", authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await JobPost.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (req.user.role === "employer" && job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (!["employer", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only employers/admins can view applicants" });
    }

    const applicants = await Application.find({ job: jobId })
      .populate("user", "-password uploads photoUrl resumeUrl videoUrl audioUrl")
      .sort({ createdAt: -1 });

    res.json(applicants);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch applicants", error: err.message });
  }
});

export default router;
















// import express from "express";
// import authMiddleware from "../middlewares/auth.js";
// import Candidate from "../models/Candidate.js";
// import JobPost from "../models/JobPost.js";
// import Application from "../models/Application.js";

// const router = express.Router();

// // -------------------------------
// // Candidate applies for a job (Paid candidates only)
// // -------------------------------
// router.post("/apply/:jobId", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "candidate") {
//       return res.status(403).json({ message: "Only candidates can apply" });
//     }

//     const candidate = await Candidate.findById(req.user.id);
//     if (!candidate.isPaid) {
//       return res.status(403).json({ message: "Please complete payment to apply" });
//     }

//     const { jobId } = req.params;
//     if (!jobId.match(/^[0-9a-fA-F]{24}$/)) {
//       return res.status(400).json({ message: "Invalid Job ID" });
//     }

//     const job = await JobPost.findById(jobId);
//     if (!job) return res.status(404).json({ message: "Job not found" });

//     const existing = await Application.findOne({ job: jobId, user: req.user.id });
//     if (existing) return res.status(400).json({ message: "Already applied for this job" });

//     const application = await Application.create({ job: jobId, user: req.user.id });
//     res.json({ message: "Application submitted successfully", application });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to apply", error: err.message });
//   }
// });

// // -------------------------------
// // Candidate fetches their applications
// // -------------------------------
// router.get("/my-applications", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "candidate") {
//       return res.status(403).json({ message: "Only candidates can view applications" });
//     }

//     const applications = await Application.find({ user: req.user.id })
//       .populate({
//         path: "job",
//         select: "title location category postedBy",
//         populate: {
//           path: "postedBy",
//           select: "companyName email mobile websiteLink",
//         },
//       })
//       .sort({ createdAt: -1 });

//     res.json(applications);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to fetch applications", error: err.message });
//   }
// });

// // -------------------------------
// // Employer/Admin fetches applicants for a job
// // -------------------------------
// router.get("/job/:jobId", authMiddleware, async (req, res) => {
//   try {
//     const { jobId } = req.params;
//     if (!jobId.match(/^[0-9a-fA-F]{24}$/)) {
//       return res.status(400).json({ message: "Invalid Job ID" });
//     }

//     const job = await JobPost.findById(jobId);
//     if (!job) return res.status(404).json({ message: "Job not found" });

//     // Only employer who posted or admin can access
//     if (req.user.role === "employer" && job.postedBy.toString() !== req.user.id) {
//       return res.status(403).json({ message: "Not authorized" });
//     }
//     if (!["employer", "admin"].includes(req.user.role)) {
//       return res.status(403).json({ message: "Only employers/admins can view applicants" });
//     }

//     const applicants = await Application.find({ job: jobId })
//       .populate("user", "-password uploads photoUrl resumeUrl videoUrl audioUrl")
//       .sort({ createdAt: -1 });

//     res.json(applicants);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to fetch applicants", error: err.message });
//   }
// });

// export default router;
















// import express from "express";
// import authMiddleware from "../middlewares/auth.js";
// import Application from "../models/Application.js";
// import JobPost from "../models/JobPost.js";
// import Candidate from "../models/Candidate.js"; // ✅ import Candidate

// const router = express.Router();

// // -------------------------------
// // Candidate applies for a job (Only paid candidates)
// // -------------------------------
// router.post("/apply/:jobId", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "candidate") {
//       return res.status(403).json({ message: "Only candidates can apply" });
//     }

//     // ✅ Check if candidate has paid
//     const candidate = await Candidate.findById(req.user.id);
//     if (!candidate.isPaid) {
//       return res.status(403).json({ message: "Please complete payment to apply" });
//     }

//     const { jobId } = req.params;

//     // Validate Job ID
//     if (!jobId || !jobId.match(/^[0-9a-fA-F]{24}$/)) {
//       return res.status(400).json({ message: "Invalid Job ID" });
//     }

//     // Check if job exists
//     const job = await JobPost.findById(jobId);
//     if (!job) return res.status(404).json({ message: "Job not found" });

//     // Check if already applied
//     const existingApp = await Application.findOne({ job: jobId, user: req.user.id });
//     if (existingApp) {
//       return res.status(400).json({ message: "You already applied for this job" });
//     }

//     // Save application
//     const application = new Application({ job: jobId, user: req.user.id });
//     await application.save();

//     res.json({ message: "Application submitted successfully", application });
//   } catch (err) {
//     console.error("Apply Error:", err);
//     res.status(500).json({ message: "Failed to apply", error: err.message });
//   }
// });

// // -------------------------------
// // Candidate fetches their applications
// // -------------------------------
// router.get("/my-applications", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "candidate") {
//       return res.status(403).json({ message: "Only candidates can view applications" });
//     }

//     const applications = await Application.find({ user: req.user.id })
//       .populate("job", "title companyName location category")
//       .sort({ createdAt: -1 });

//     res.json(applications);
//   } catch (err) {
//     console.error("Fetch Applications Error:", err);
//     res.status(500).json({ message: "Failed to fetch applications", error: err.message });
//   }
// });

// // -------------------------------
// // Employer/Admin fetches applicants for a job
// // -------------------------------
// router.get("/job/:jobId", authMiddleware, async (req, res) => {
//   try {
//     const { jobId } = req.params;

//     if (!jobId || !jobId.match(/^[0-9a-fA-F]{24}$/)) {
//       return res.status(400).json({ message: "Invalid Job ID" });
//     }

//     const job = await JobPost.findById(jobId);
//     if (!job) return res.status(404).json({ message: "Job not found" });

//     // Only employer who posted the job or admin can view applicants
//     if (req.user.role === "employer" && job.postedBy.toString() !== req.user.id) {
//       return res.status(403).json({ message: "Not authorized" });
//     }

//     if (req.user.role !== "employer" && req.user.role !== "admin") {
//       return res.status(403).json({ message: "Only employers/admins can view applicants" });
//     }

//     const applicants = await Application.find({ job: jobId })
//       .populate("user", "firstName lastName email")
//       .sort({ createdAt: -1 });

//     res.json(applicants);
//   } catch (err) {
//     console.error("Fetch Applicants Error:", err);
//     res.status(500).json({ message: "Failed to fetch applicants", error: err.message });
//   }
// });

// export default router;
