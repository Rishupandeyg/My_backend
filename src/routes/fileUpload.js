import express from "express";
const router = express.Router();

// ✅ ES module import
import { imageUpload, videoUpload, audioUpload, localFileUpload } from "../controllers/FileUpload.js";

// api routes
router.post("/imageUpload", imageUpload);
router.post("/videoUpload", videoUpload);
router.post("/localFileUpload", localFileUpload);
router.post("/audioUpload", audioUpload);

export default router;
