import express from "express";
import authMiddleware from "../middlewares/auth.js";
import Candidate from "../models/Candidate.js";
import { uploadFile } from "../controllers/FileUpload.js";

const router = express.Router();

// =====================================================
// ✅ CANDIDATE — GET OWN PROFILE
// =====================================================
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.user.id).select("-password");
    if (!candidate)
      return res.status(404).json({ message: "Candidate not found" });

    res.json(candidate);
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

// =====================================================
// ✅ CANDIDATE — UPDATE PROFILE
// =====================================================
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const updates = req.body;

    const candidate = await Candidate.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      candidate,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

// =====================================================
// ✅ CANDIDATE — FILE UPLOAD (MATCHES FileUpload.js)
// =====================================================
const validFileTypes = ["photo", "video", "audio", "document", "resume"];

router.post(
  "/upload/:fileType",
  authMiddleware,
  (req, res, next) => {
    const { fileType } = req.params;

    if (!validFileTypes.includes(fileType))
      return res.status(400).json({ message: "Invalid fileType" });

    // ✅ REQUIRED BY FileUpload.js
    req.params.userType = "Candidate";

    next();
  },
  uploadFile
);

// =====================================================
// ✅ CANDIDATE — GET OWN GALLERY + MAIN FILES
// (THIS IS THE MOST IMPORTANT FIX)
// =====================================================
router.get("/uploads", authMiddleware, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.user.id).select(
      "photoUrl resumeUrl videoUrl audioUrl gallery"
    );

    if (!candidate)
      return res.status(404).json({ message: "Candidate not found" });

    res.json({
      photo: candidate.photoUrl || null,
      resume: candidate.resumeUrl || null,
      video: candidate.videoUrl || null,
      audio: candidate.audioUrl || null,

      // ✅ REAL GALLERY FROM FileUpload.js
      uploads: candidate.gallery || [],
      gallery: candidate.gallery || [],
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

// =====================================================
// ✅ EMPLOYER — GET ALL CANDIDATES (NO PASSWORD)
// =====================================================
router.get("/all", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "employer")
      return res.status(403).json({ message: "Access denied" });

    const candidates = await Candidate.find().select("-password");

    res.json(candidates);
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

// =====================================================
// ✅ ADMIN — GET ALL CANDIDATE GALLERIES
// =====================================================
router.get("/admin/uploads", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Access denied" });

    const candidates = await Candidate.find().select(
      "firstName lastName email mobile photoUrl resumeUrl videoUrl audioUrl gallery isPaid createdAt updatedAt"
    );

    const formatted = candidates.map((c) => ({
      id: c._id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      mobile: c.mobile,

      photo: c.photoUrl || null,
      resume: c.resumeUrl || null,
      video: c.videoUrl || null,
      audio: c.audioUrl || null,

      // ✅ REAL GALLERY
      uploads: c.gallery || [],
      gallery: c.gallery || [],

      isPaid: c.isPaid,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

export default router;





// import express from "express";
// import authMiddleware from "../middlewares/auth.js";
// import Candidate from "../models/Candidate.js";
// import { uploadFile } from "../controllers/FileUpload.js";

// const router = express.Router();

// // -----------------------
// // Candidate self routes
// // -----------------------

// // GET candidate profile (without password)
// router.get("/profile", authMiddleware, async (req, res) => {
//   try {
//     const candidate = await Candidate.findById(req.user.id).select("-password");
//     if (!candidate) return res.status(404).json({ message: "Candidate not found" });
//     res.json(candidate);
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// // UPDATE candidate profile
// router.put("/profile", authMiddleware, async (req, res) => {
//   try {
//     const updates = req.body;
//     const candidate = await Candidate.findByIdAndUpdate(req.user.id, updates, {
//       new: true,
//     }).select("-password");

//     res.json({ message: "Profile updated successfully", candidate });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// // -----------------------
// // File Upload Routes (Cloudinary)
// // -----------------------
// const validFileTypes = ["photo", "resume", "video", "audio"];

// router.post("/upload/:fileType", authMiddleware, (req, res, next) => {
//   const { fileType } = req.params;
//   if (!validFileTypes.includes(fileType)) return res.status(400).json({ message: "Invalid fileType" });
//   req.params.userType = "Candidate";
//   next();
// }, uploadFile);

// // Get candidate's own uploads
// router.get("/uploads", authMiddleware, async (req, res) => {
//   try {
//     const candidate = await Candidate.findById(req.user.id).select(
//       "uploads photoUrl resumeUrl videoUrl audioUrl"
//     );
//     if (!candidate) return res.status(404).json({ message: "Candidate not found" });

//     res.json({
//       photo: candidate.photoUrl,
//       resume: candidate.resumeUrl,
//       video: candidate.videoUrl,
//       audio: candidate.audioUrl,
//       uploads: candidate.uploads || [],
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// // -----------------------
// // Employer access routes
// // -----------------------

// // GET all candidates (employer access only)
// router.get("/all", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "employer") return res.status(403).json({ message: "Access denied" });

//     const candidates = await Candidate.find().select("-password");
//     res.json(candidates);
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// // -----------------------
// // Admin access routes
// // -----------------------

// // GET all candidate uploads (admin access)
// router.get("/admin/uploads", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

//     const candidates = await Candidate.find().select(
//       "firstName lastName email mobile photoUrl resumeUrl videoUrl audioUrl uploads isPaid createdAt updatedAt"
//     );

//     res.json(candidates);
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// export default router;
















// // routes/candidateRoutes.js
// import express from "express";
// import authMiddleware from "../middlewares/auth.js";
// import Candidate from "../models/Candidate.js";
// import { uploadFile } from "../controllers/FileUpload.js";

// const router = express.Router();

// // -----------------------
// // Candidate self routes
// // -----------------------

// // GET profile (without password)
// router.get("/profile", authMiddleware, async (req, res) => {
//   try {
//     const candidate = await Candidate.findById(req.user.id).select("-password");
//     if (!candidate) return res.status(404).json({ message: "Candidate not found" });
//     res.json(candidate);
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// // UPDATE profile (return without password)
// router.put("/profile", authMiddleware, async (req, res) => {
//   try {
//     const updates = req.body;
//     const candidate = await Candidate.findByIdAndUpdate(
//       req.user.id,
//       updates,
//       { new: true }
//     ).select("-password");

//     res.json({ message: "Profile updated", candidate });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// // -----------------------
// // File Upload Routes (Cloudinary)
// // -----------------------

// // Upload dynamic file: photo, resume, audio, video, image
// router.post("/upload/:fileType", authMiddleware, async (req, res) => {
//   try {
//     req.params.userType = "Candidate";
//     await uploadFile(req, res);
//   } catch (err) {
//     res.status(500).json({ message: "Upload failed", error: err.message });
//   }
// });

// // Get all uploads (Candidate self)
// router.get("/uploads", authMiddleware, async (req, res) => {
//   try {
//     const candidate = await Candidate.findById(req.user.id).select(
//       "uploads photoUrl resumeUrl videoUrl audioUrl"
//     );
//     if (!candidate) return res.status(404).json({ message: "Candidate not found" });

//     res.json({
//       photo: candidate.photoUrl,
//       resume: candidate.resumeUrl,
//       video: candidate.videoUrl,
//       audio: candidate.audioUrl,
//       uploads: candidate.uploads || [],
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// // -----------------------
// // Employer routes
// // -----------------------

// // GET all candidates (employer access only)
// router.get("/all", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "employer") {
//       return res.status(403).json({ message: "Access denied: Employers only" });
//     }

//     const candidates = await Candidate.find().select("-password");
//     res.json(candidates);
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// export default router;
