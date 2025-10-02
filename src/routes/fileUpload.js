import express from "express";
import { uploadFile } from "../controllers/FileUpload.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// Generic file upload: /api/v1/upload/:userType/:fileType
router.post("/:userType/:fileType", authMiddleware, uploadFile);

export default router;
