import express from "express";
import Employer from "../models/Employer.js";
import Candidate from "../models/Candidate.js";
import auth, { authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// GET employer profile
router.get("/profile", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer")
      return res.status(403).json({ message: "Access denied" });

    const employer = await Employer.findById(req.user.id).select("-password");
    if (!employer) return res.status(404).json({ message: "Employer not found" });

    res.json(employer);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// UPDATE employer profile
router.put("/profile", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer")
      return res.status(403).json({ message: "Access denied" });

    const updates = req.body;
    const employer = await Employer.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-password");

    res.json({ message: "Profile updated successfully", employer });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
export default router;

//If needed to give access of candidates to employer , we can use the below code

// Get a specific candidate's uploads
// router.get("/candidate/:id/uploads", auth, authorizeRoles("employer"), async (req, res) => {
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

// // GET all candidates (employer access)
// router.get("/candidates", auth, authorizeRoles("employer"), async (req, res) => {
//   try {
//     const candidates = await Candidate.find().select("-password");
//     res.json(candidates);
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });