// src/routes/adminRoutes.js
import express from "express";
import Candidate from "../models/Candidate.js";
import Employer from "../models/Employer.js";
import Admin from "../models/Admin.js";
import Gallery from "../models/Gallery.js";
import Contact from "../models/Contact.js"; // ✅ import Contact model
import auth from "../middlewares/auth.js";
import { uploadFile } from "../controllers/FileUpload.js";

const router = express.Router();

// -----------------------
// Admin Routes
// -----------------------

// ✅ Get all candidates with uploads
router.get("/candidates", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ msg: "Access denied: Admins only" });

  try {
    const candidates = await Candidate.find().select("-password"); // exclude passwords

    const formattedCandidates = candidates.map((c) => ({
      id: c._id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      mobile: c.mobile,
      category: c.category,
      city: c.city,
      state: c.state,
      isPaid: c.isPaid,
      photo: c.photoUrl,
      resume: c.resumeUrl,
      audio: c.audioUrl,
      video: c.videoUrl,
      uploads: c.uploads || [],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.json(formattedCandidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get a specific candidate's uploads
router.get("/candidate/:id/uploads", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ msg: "Access denied: Admins only" });

  try {
    const candidate = await Candidate.findById(req.params.id).select(
      "photoUrl resumeUrl videoUrl audioUrl uploads"
    );
    if (!candidate) return res.status(404).json({ msg: "Candidate not found" });

    res.json({
      photo: candidate.photoUrl,
      resume: candidate.resumeUrl,
      video: candidate.videoUrl,
      audio: candidate.audioUrl,
      uploads: candidate.uploads || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all employers
router.get("/employers", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ msg: "Access denied: Admins only" });

  try {
    const employers = await Employer.find().select("-password");
    res.json(employers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  Delete candidate
router.delete("/candidate/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ msg: "Access denied: Admins only" });

  try {
    const deleted = await Candidate.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Candidate not found" });
    res.json({ message: "Candidate deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete employer
router.delete("/employer/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ msg: "Access denied: Admins only" });

  try {
    const deleted = await Employer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Employer not found" });
    res.json({ message: "Employer deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------
// Admin file upload
// -----------------------
const validFileTypes = ["photo", "video", "audio"];

router.post("/upload/:fileType", auth, (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

  const { fileType } = req.params;
  if (!validFileTypes.includes(fileType)) return res.status(400).json({ message: "Invalid file type" });

  // Set normalized userType for FileUpload
  req.params.userType = "Admin"; // Must match UserModels key in FileUpload.js

  console.log("ADMIN UPLOAD DEBUG:", {
    userId: req.user.id,
    role: req.user.role,
    fileType,
    userType: req.params.userType,
    files: req.files ? Object.keys(req.files) : null,
  });

  next();
}, uploadFile);

// -----------------------
// Admin Contact Messages
// -----------------------

// ✅ Get all contact messages (admin-only)
router.get("/contacts", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ msg: "Access denied: Admins only" });

  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }); // newest first
    res.status(200).json({ data: contacts });
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ error: "Server error", data: null });
  }
});

export default router;




// import express from "express";
// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import Admin from "../models/Admin.js";
// import Gallery from "../models/Gallery.js";
// import Contact from "../models/Contact.js";
// import AdminJob from "../models/AdminJob.js"; // ✅ AdminJob model
// import auth, { authorizeRoles } from "../middlewares/auth.js";
// import { uploadFile } from "../controllers/FileUpload.js";

// const router = express.Router();

// // -----------------------
// // Candidates & Employers
// // -----------------------
// router.get("/candidates", auth, authorizeRoles("admin"), async (req, res) => {
//   try {
//     const candidates = await Candidate.find().select("-password");
//     const formatted = candidates.map(c => ({
//       id: c._id,
//       firstName: c.firstName,
//       lastName: c.lastName,
//       email: c.email,
//       mobile: c.mobile,
//       category: c.category,
//       city: c.city,
//       state: c.state,
//       isPaid: c.isPaid,
//       photo: c.photoUrl,
//       resume: c.resumeUrl,
//       audio: c.audioUrl,
//       video: c.videoUrl,
//       uploads: c.uploads || [],
//       createdAt: c.createdAt,
//       updatedAt: c.updatedAt,
//     }));
//     res.json(formatted);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// router.get("/candidate/:id/uploads", auth, authorizeRoles("admin"), async (req, res) => {
//   try {
//     const candidate = await Candidate.findById(req.params.id).select("photoUrl resumeUrl videoUrl audioUrl uploads");
//     if (!candidate) return res.status(404).json({ msg: "Candidate not found" });

//     res.json({
//       photo: candidate.photoUrl,
//       resume: candidate.resumeUrl,
//       video: candidate.videoUrl,
//       audio: candidate.audioUrl,
//       uploads: candidate.uploads || [],
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// router.get("/employers", auth, authorizeRoles("admin"), async (req, res) => {
//   try {
//     const employers = await Employer.find().select("-password");
//     res.json(employers);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// router.delete("/candidate/:id", auth, authorizeRoles("admin"), async (req, res) => {
//   try {
//     const deleted = await Candidate.findByIdAndDelete(req.params.id);
//     if (!deleted) return res.status(404).json({ msg: "Candidate not found" });
//     res.json({ message: "Candidate deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// router.delete("/employer/:id", auth, authorizeRoles("admin"), async (req, res) => {
//   try {
//     const deleted = await Employer.findByIdAndDelete(req.params.id);
//     if (!deleted) return res.status(404).json({ msg: "Employer not found" });
//     res.json({ message: "Employer deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // -----------------------
// // Admin file upload
// // -----------------------
// const validFileTypes = ["photo", "video", "audio"];
// router.post("/upload/:fileType", auth, authorizeRoles("admin"), (req, res, next) => {
//   const { fileType } = req.params;
//   if (!validFileTypes.includes(fileType)) return res.status(400).json({ message: "Invalid file type" });

//   req.params.userType = "Admin"; // Must match FileUpload.js
//   next();
// }, uploadFile);

// // -----------------------
// // Admin Contact Messages
// // -----------------------
// router.get("/contacts", auth, authorizeRoles("admin"), async (req, res) => {
//   try {
//     const contacts = await Contact.find().sort({ createdAt: -1 });
//     res.status(200).json({ data: contacts });
//   } catch (err) {
//     console.error("Error fetching contacts:", err);
//     res.status(500).json({ error: "Server error", data: null });
//   }
// });

// // -----------------------
// // AdminJob Routes
// // -----------------------

// // POST a new job
// router.post("/job", auth, authorizeRoles("admin"), async (req, res) => {
//   try {
//     const { title, description, location, salary, company, category, gender, openings } = req.body;

//     if (!title || !description || !location || !company || !category || !gender || !openings) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     const newJob = new AdminJob({
//       title,
//       description,
//       location,
//       salary,
//       company,
//       category,
//       gender,
//       openings,
//       postedBy: req.user.id,
//     });

//     await newJob.save();
//     res.status(201).json({ message: "Job posted successfully!", job: newJob });
//   } catch (err) {
//     console.error("POST /job error:", err);
//     res.status(500).json({ error: "Something went wrong" });
//   }
// });

// // GET all jobs (admin dashboard)
// router.get("/jobs", auth, authorizeRoles("admin"), async (req, res) => {
//   try {
//     const jobs = await AdminJob.find().sort({ createdAt: -1 });
//     res.json({ jobs });
//   } catch (err) {
//     console.error("GET /jobs error:", err);
//     res.status(500).json({ error: "Something went wrong" });
//   }
// });

// // GET all jobs (public homepage)
// router.get("/public/jobs", async (req, res) => {
//   try {
//     const jobs = await AdminJob.find().sort({ createdAt: -1 });
//     res.json({ jobs });
//   } catch (err) {
//     console.error("GET /public/jobs error:", err);
//     res.status(500).json({ error: "Something went wrong" });
//   }
// });

// // UPDATE a job
// router.put("/job/:id", auth, authorizeRoles("admin"), async (req, res) => {
//   try {
//     const job = await AdminJob.findById(req.params.id);
//     if (!job) return res.status(404).json({ error: "Job not found" });

//     Object.assign(job, req.body);
//     await job.save();
//     res.json({ message: "Job updated successfully", job });
//   } catch (err) {
//     console.error("PUT /job/:id error:", err);
//     res.status(500).json({ error: "Something went wrong" });
//   }
// });

// // DELETE a job
// router.delete("/job/:id", auth, authorizeRoles("admin"), async (req, res) => {
//   try {
//     const job = await AdminJob.findById(req.params.id);
//     if (!job) return res.status(404).json({ error: "Job not found" });

//     await job.deleteOne();
//     res.json({ message: "Job deleted successfully" });
//   } catch (err) {
//     console.error("DELETE /job/:id error:", err);
//     res.status(500).json({ error: "Something went wrong" });
//   }
// });

// export default router;












// // src/routes/adminRoutes.js
// import express from "express";
// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import Admin from "../models/Admin.js";
// import Gallery from "../models/Gallery.js";
// import auth from "../middlewares/auth.js";
// import { uploadFile } from "../controllers/FileUpload.js";

// const router = express.Router();

// // -----------------------
// // Admin Routes
// // -----------------------

// // ✅ Get all candidates with uploads
// router.get("/candidates", auth, async (req, res) => {
//   if (req.user.role !== "admin") {
//     return res.status(403).json({ msg: "Access denied: Admins only" });
//   }

//   try {
//     const candidates = await Candidate.find().select("-password"); // exclude passwords

//     const formattedCandidates = candidates.map((c) => ({
//       id: c._id,
//       firstName: c.firstName,
//       lastName: c.lastName,
//       email: c.email,
//       mobile: c.mobile,
//       category: c.category,
//       city: c.city,
//       state: c.state,
//       isPaid: c.isPaid,
//       photo: c.photoUrl,
//       resume: c.resumeUrl,
//       audio: c.audioUrl,
//       video: c.videoUrl,
//       uploads: c.uploads || [],
//       createdAt: c.createdAt,
//       updatedAt: c.updatedAt,
//     }));

//     res.json(formattedCandidates);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ✅ Get a specific candidate's uploads
// router.get("/candidate/:id/uploads", auth, async (req, res) => {
//   if (req.user.role !== "admin") {
//     return res.status(403).json({ msg: "Access denied: Admins only" });
//   }

//   try {
//     const candidate = await Candidate.findById(req.params.id).select(
//       "photoUrl resumeUrl videoUrl audioUrl uploads"
//     );
//     if (!candidate) return res.status(404).json({ msg: "Candidate not found" });

//     res.json({
//       photo: candidate.photoUrl,
//       resume: candidate.resumeUrl,
//       video: candidate.videoUrl,
//       audio: candidate.audioUrl,
//       uploads: candidate.uploads || [],
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ✅ Get all employers
// router.get("/employers", auth, async (req, res) => {
//   if (req.user.role !== "admin") {
//     return res.status(403).json({ msg: "Access denied: Admins only" });
//   }

//   try {
//     const employers = await Employer.find().select("-password");
//     res.json(employers);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ✅ Delete candidate
// router.delete("/candidate/:id", auth, async (req, res) => {
//   if (req.user.role !== "admin") {
//     return res.status(403).json({ msg: "Access denied: Admins only" });
//   }

//   try {
//     const deleted = await Candidate.findByIdAndDelete(req.params.id);
//     if (!deleted) return res.status(404).json({ msg: "Candidate not found" });
//     res.json({ message: "Candidate deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ✅ Delete employer
// router.delete("/employer/:id", auth, async (req, res) => {
//   if (req.user.role !== "admin") {
//     return res.status(403).json({ msg: "Access denied: Admins only" });
//   }

//   try {
//     const deleted = await Employer.findByIdAndDelete(req.params.id);
//     if (!deleted) return res.status(404).json({ msg: "Employer not found" });
//     res.json({ message: "Employer deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // -----------------------
// // Admin file upload
// // -----------------------
// const validFileTypes = ["photo", "video", "audio"];

// router.post("/upload/:fileType", auth, (req, res, next) => {
//   if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

//   const { fileType } = req.params;
//   if (!validFileTypes.includes(fileType)) return res.status(400).json({ message: "Invalid file type" });

//   // Set normalized userType for FileUpload
//   req.params.userType = "Admin"; // Must match UserModels key in FileUpload.js

//   console.log("ADMIN UPLOAD DEBUG:", {
//     userId: req.user.id,
//     role: req.user.role,
//     fileType,
//     userType: req.params.userType,
//     files: req.files ? Object.keys(req.files) : null,
//   });

//   next();
// }, uploadFile);

// export default router;















































































































































































// // src/routes/adminRoutes.js
// import express from "express";
// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import auth from "../middlewares/auth.js";

// const router = express.Router();

// // -----------------------
// // Admin Routes
// // -----------------------

// // ✅ Get all candidates with uploads
// router.get("/candidates", auth, async (req, res) => {
//   if (req.user.role !== "admin") {
//     return res.status(403).json({ msg: "Access denied: Admins only" });
//   }

//   try {
//     const candidates = await Candidate.find().select("-password"); // exclude passwords

//     const formattedCandidates = candidates.map((c) => ({
//       id: c._id,
//       firstName: c.firstName,
//       lastName: c.lastName,
//       email: c.email,
//       mobile: c.mobile,
//       category: c.category,
//       city: c.city,
//       state: c.state,
//       isPaid: c.isPaid,
//       photo: c.photoUrl,   // Cloudinary URL
//       resume: c.resumeUrl, // Cloudinary URL
//       audio: c.audioUrl,   // Cloudinary URL
//       video: c.videoUrl,   // Cloudinary URL
//       uploads: c.uploads || [], // other uploaded files
//       createdAt: c.createdAt,
//       updatedAt: c.updatedAt,
//     }));

//     res.json(formattedCandidates);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ✅ Get a specific candidate's uploads (admin only)
// router.get("/candidate/:id/uploads", auth, async (req, res) => {
//   if (req.user.role !== "admin") {
//     return res.status(403).json({ msg: "Access denied: Admins only" });
//   }

//   try {
//     const candidate = await Candidate.findById(req.params.id).select(
//       "photoUrl resumeUrl videoUrl audioUrl uploads"
//     );
//     if (!candidate) return res.status(404).json({ msg: "Candidate not found" });

//     res.json({
//       photo: candidate.photoUrl,
//       resume: candidate.resumeUrl,
//       video: candidate.videoUrl,
//       audio: candidate.audioUrl,
//       uploads: candidate.uploads || [],
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ✅ Get all employers
// router.get("/employers", auth, async (req, res) => {
//   if (req.user.role !== "admin") {
//     return res.status(403).json({ msg: "Access denied: Admins only" });
//   }

//   try {
//     const employers = await Employer.find().select("-password");
//     res.json(employers);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ✅ Delete candidate
// router.delete("/candidate/:id", auth, async (req, res) => {
//   if (req.user.role !== "admin") {
//     return res.status(403).json({ msg: "Access denied: Admins only" });
//   }

//   try {
//     const deleted = await Candidate.findByIdAndDelete(req.params.id);
//     if (!deleted) return res.status(404).json({ msg: "Candidate not found" });
//     res.json({ message: "Candidate deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ✅ Delete employer
// router.delete("/employer/:id", auth, async (req, res) => {
//   if (req.user.role !== "admin") {
//     return res.status(403).json({ msg: "Access denied: Admins only" });
//   }

//   try {
//     const deleted = await Employer.findByIdAndDelete(req.params.id);
//     if (!deleted) return res.status(404).json({ msg: "Employer not found" });
//     res.json({ message: "Employer deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// export default router;
