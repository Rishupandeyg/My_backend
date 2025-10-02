// routes/fileUpload.js
import express from "express";
import { uploadFile } from "../controllers/FileUpload.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// Generic file upload route
// Example usage:
// POST /api/v1/upload/Candidate/photo
// POST /api/v1/upload/Candidate/resume
// POST /api/v1/upload/Candidate/audio
// POST /api/v1/upload/Candidate/video
router.post("/:userType/:fileType", authMiddleware, uploadFile);

export default router;
