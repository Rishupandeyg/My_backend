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
import uploadRoutes from "./routes/fileUpload.js";

// Admin setup
import createAdmin from "./config/adminSetup.js";

// File upload middleware
import fileUpload from "express-fileupload";

// Cloudinary
import { cloudinaryConnect } from "./config/cloudinary.js";

// Initialize dotenv
dotenv.config();

const app = express();

// For __dirname (since we are using ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------- MIDDLEWARE -----------------
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure express-fileupload
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/", // safe location for temporary uploads
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 }, // max 50MB
  })
);

// Connect Cloudinary once
cloudinaryConnect();

// ----------------- ROUTES -----------------
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/v1/upload", uploadRoutes); // ✅ Cloudinary file upload

// ----------------- SERVE FRONTEND BUILD -----------------
const frontendPath = path.join(__dirname, "../frontend/build");

// Serve static files from the React app
app.use(express.static(frontendPath));

// Catch-all route — send all non-API requests to React
app.get("*", (req, res) => {
  res.sendFile(path.resolve(frontend, "index.html"));
});

// ----------------- DATABASE & SERVER -----------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");

    // Create admin if not exists
    await createAdmin();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.log("❌ MongoDB Error:", err));








// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import cors from "cors";
// import path from "path";
// import { fileURLToPath } from "url";

// // Routes
// import authRoutes from "./routes/authRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";
// import candidateRoutes from "./routes/candidateRoutes.js";
// import employerRoutes from "./routes/employerRoutes.js";
// import jobRoutes from "./routes/jobs.js";
// import applicationRoutes from "./routes/applicationRoutes.js";
// import UploadRoute from "./routes/fileUpload.js";

// // Admin setup
// import createAdmin from "./config/adminSetup.js";

// // file upload middleware
// import fileUpload from "express-fileupload";

// // Cloudinary
// import { cloudinaryConnect } from "./config/cloudinary.js";

// // Initialize dotenv
// dotenv.config();

// const app = express();

// // For __dirname (since we are using ES modules)
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Middleware
// app.use(cors({ origin: "*" }));
// app.use(express.json());
// app.use(fileUpload());

// // Connect Cloudinary
// cloudinaryConnect(); // ✅ only once

// // API route
// app.use(
//   fileUpload({
//     useTempFiles: true,
//     tempFileDir: "/tmp/", // ✅ safe location for temp uploads
//   })
// );


// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/candidate", candidateRoutes);
// app.use("/api/employer", employerRoutes);
// app.use("/api/jobs", jobRoutes);
// app.use("/api/applications", applicationRoutes);

// // Default route for testing
// app.get("/", (req, res) => {
//   res.send("🚀 Server is running!");
// });

// // MongoDB Connection + Server Start
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(async () => {
//     console.log("✅ MongoDB connected");

//     // ✅ Create admin if not exists
//     await createAdmin();

//     app.listen(5000, () => console.log("🚀 Server running on port 5000"));
//   })
//   .catch((err) => console.log("❌ MongoDB Error:", err));
