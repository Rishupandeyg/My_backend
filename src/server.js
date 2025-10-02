import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import candidateRoutes from "./routes/candidateRoutes.js";
import employerRoutes from "./routes/employerRoutes.js";
import jobRoutes from "./routes/jobs.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import UploadRoute from "./routes/fileUpload.js";

// Admin setup
import createAdmin from "./config/adminSetup.js";

// file upload middleware
import fileUpload from "express-fileupload";

// Cloudinary
import { cloudinaryConnect } from "./config/cloudinary.js";

// Initialize dotenv
dotenv.config();

const app = express();

// For __dirname (since we are using ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(fileUpload());

// Connect Cloudinary
cloudinaryConnect(); // ✅ only once

// API route
app.use("/api/v1/upload", UploadRoute);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);

// Default route for testing
app.get("/", (req, res) => {
  res.send("🚀 Server is running!");
});

// MongoDB Connection + Server Start
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");

    // ✅ Create admin if not exists
    await createAdmin();

    app.listen(5000, () => console.log("🚀 Server running on port 5000"));
  })
  .catch((err) => console.log("❌ MongoDB Error:", err));
