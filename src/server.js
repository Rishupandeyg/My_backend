// backend/src/server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import candidateRoutes from "./routes/candidateRoutes.js";
import employerRoutes from "./routes/employerRoutes.js";
import jobRoutes from "./routes/jobs.js";
import uploadRoutes from "./routes/fileUpload.js";         
import galleryRoutes from "./routes/galleryRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import adminJobRoutes from "./routes/adminJobRoutes.js";
import jobCategoryRoutes from "./routes/jobCategoryRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import newsAdminRoutes from "./routes/newsAdminRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import phonepeWebhook from "./routes/phonepeWebhook.js";

import createAdmin from "./config/adminSetup.js";
import fileUpload from "express-fileupload";
import { cloudinaryConnect } from "./config/cloudinary.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------------------------------
// 1) CORS
// ------------------------------------------------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://kbtalentbridgestudios.com",
  "https://www.kbtalentbridgestudios.com",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (process.env.ALLOW_ALL_ORIGINS === "true")
        return callback(null, true);
      return callback(new Error("CORS policy: origin not allowed"), false);
    },
    credentials: true,
  })
);

// ------------------------------------------------------
// 2) 🔥 PHONEPE WEBHOOK — MUST BE BEFORE JSON
// ------------------------------------------------------
app.use(
  "/api/webhooks/phonepe",
  express.raw({ type: "application/json" })
);
app.use("/api/webhooks/phonepe", phonepeWebhook);

// ------------------------------------------------------
// 3) BODY PARSER (NORMAL APIs ONLY)
// ------------------------------------------------------
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ------------------------------------------------------
// 4) PREFLIGHT
// ------------------------------------------------------
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    return res.sendStatus(200);
  }
  next();
});

// ------------------------------------------------------
// 5) FILE UPLOAD
// ------------------------------------------------------
const TEMP_DIR = path.join(__dirname, "../tmp");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: TEMP_DIR,
    createParentPath: true,
    preserveExtension: true,
    abortOnLimit: false,
    limits: { fileSize: 100 * 1024 * 1024 },
  })
);

// ------------------------------------------------------
// 6) CLOUDINARY
// ------------------------------------------------------
try {
  cloudinaryConnect();
} catch (e) {
  console.warn("Cloudinary connection failed:", e?.message || e);
}

// ------------------------------------------------------
// 7) ROUTES
// ------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin/jobs", adminJobRoutes);
app.use("/api/jobcategories", jobCategoryRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/news-admin", newsAdminRoutes);
app.use("/news", newsRoutes);

// ------------------------------------------------------
// 8) HEALTH
// ------------------------------------------------------
app.get("/health", (req, res) =>
  res.json({ status: "ok", uptime: process.uptime() })
);

// ------------------------------------------------------
// 9) STATIC FRONTEND
// ------------------------------------------------------
const frontendPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendPath));
app.get(/.*/, (req, res) =>
  res.sendFile(path.join(frontendPath, "index.html"))
);

// ------------------------------------------------------
// 10) DB + SERVER START
// ------------------------------------------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await createAdmin();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB Error:", err);
    process.exit(1);
  });

export default app;



// // backend/src/server.js
// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import cors from "cors";
// import path from "path";
// import { fileURLToPath } from "url";
// import fs from "fs";

// import authRoutes from "./routes/authRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";
// import candidateRoutes from "./routes/candidateRoutes.js";
// import employerRoutes from "./routes/employerRoutes.js";
// import jobRoutes from "./routes/jobs.js";
// import uploadRoutes from "./routes/fileUpload.js";         
// import galleryRoutes from "./routes/galleryRoutes.js";
// import contactRoutes from "./routes/contactRoutes.js";
// import adminJobRoutes from "./routes/adminJobRoutes.js";
// import jobCategoryRoutes from "./routes/jobCategoryRoutes.js";
// import paymentRoutes from "./routes/paymentRoutes.js";
// import newsAdminRoutes from "./routes/newsAdminRoutes.js";
// import newsRoutes from "./routes/newsRoutes.js";
// import phonepeWebhook from "./routes/phonepeWebhook.js";




// import createAdmin from "./config/adminSetup.js";
// import fileUpload from "express-fileupload";
// import { cloudinaryConnect } from "./config/cloudinary.js";

// dotenv.config();
// const app = express();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ------------------------------------------------------
// // 1) CORS
// // ------------------------------------------------------
// const allowedOrigins = [
//   "http://localhost:5173",
//   "https://kbtalentbridgestudios.com",
//   "https://www.kbtalentbridgestudios.com",
//   process.env.FRONTEND_URL,
// ].filter(Boolean);

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.includes(origin)) return callback(null, true);
//       if (process.env.ALLOW_ALL_ORIGINS === "true")
//         return callback(null, true);
//       return callback(new Error("CORS policy: origin not allowed"), false);
//     },
//     credentials: true,
//   })
// );

// app.use(
//   "/api/webhooks/phonepe",
//   express.raw({ type: "*/*" })
// );
// app.use("/api/webhooks/phonepe", phonepeWebhook);


// // ------------------------------------------------------
// // 2) BODY PARSER FIX
// // ------------------------------------------------------
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// // ------------------------------------------------------
// // 3) PREFLIGHT
// // ------------------------------------------------------
// app.use((req, res, next) => {
//   if (req.method === "OPTIONS") {
//     res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
//     res.header(
//       "Access-Control-Allow-Headers",
//       "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//     );
//     res.header(
//       "Access-Control-Allow-Methods",
//       "GET, POST, PUT, DELETE, PATCH, OPTIONS"
//     );
//     return res.sendStatus(200);
//   }
//   next();
// });

// // ------------------------------------------------------
// // 4) FIXED: EXPRESS-FILEUPLOAD (ROOT PROBLEM SOLVED)
// // ------------------------------------------------------
// const TEMP_DIR = path.join(__dirname, "../tmp");
// if (!fs.existsSync(TEMP_DIR)) {
//   fs.mkdirSync(TEMP_DIR, { recursive: true });
// }

// app.use(
//   fileUpload({
//     useTempFiles: true,
//     tempFileDir: TEMP_DIR,       // FIXED ABSOLUTE PATH
//     createParentPath: true,
//     preserveExtension: true,     // FIX FOR PDF/DOCX CORRUPTION
//     abortOnLimit: false,
//     limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
//   })
// );

// // ------------------------------------------------------
// // 5) CLOUDINARY
// // ------------------------------------------------------
// try {
//   cloudinaryConnect();
// } catch (e) {
//   console.warn("Cloudinary connection failed:", e?.message || e);
// }

// // ------------------------------------------------------
// // 6) ROUTES (NO CHANGE, ORIGINAL CORRECT PATHS)
// // ------------------------------------------------------
// app.use("/api/auth", authRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/candidate", candidateRoutes);
// app.use("/api/employer", employerRoutes);
// app.use("/api/jobs", jobRoutes);
// app.use("/api/v1/upload", uploadRoutes);        // 👈 CORRECT
// app.use("/api/gallery", galleryRoutes);
// app.use("/api/contact", contactRoutes);
// app.use("/api/admin/jobs", adminJobRoutes);
// app.use("/api/jobcategories", jobCategoryRoutes);
// app.use("/api/payments", paymentRoutes);
// app.use("/news-admin", newsAdminRoutes);
// app.use("/news", newsRoutes);

// // ------------------------------------------------------
// // 7) HEALTH
// // ------------------------------------------------------
// app.get("/health", (req, res) =>
//   res.json({ status: "ok", uptime: process.uptime() })
// );

// // ------------------------------------------------------
// // 8) STATIC FRONTEND SERVE
// // ------------------------------------------------------
// const frontendPath = path.join(__dirname, "../../frontend/dist");
// app.use(express.static(frontendPath));
// app.get(/.*/, (req, res) =>
//   res.sendFile(path.join(frontendPath, "index.html"))
// );

// // ------------------------------------------------------
// // 9) DATABASE + SERVER START
// // ------------------------------------------------------
// const mongoUri = process.env.MONGO_URI;

// mongoose
//   .connect(mongoUri)
//   .then(async () => {
//     console.log("MongoDB connected");
//     try {

//       await createAdmin();
//     } catch (e) {
//       console.warn("createAdmin failed:", e?.message);
//     }
//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () =>
//       console.log(`Server running on port ${PORT}`)
//     );
//   })
//   .catch((err) => {
//     console.error("MongoDB Error:", err);
//     process.exit(1);
//   });

// export default app;



// // backend/src/server.js
// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import cors from "cors";
// import path from "path";
// import { fileURLToPath } from "url";

// import authRoutes from "./routes/authRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";
// import candidateRoutes from "./routes/candidateRoutes.js";
// import employerRoutes from "./routes/employerRoutes.js";
// import jobRoutes from "./routes/jobs.js";
// // import applicationRoutes from "./routes/applicationRoutes.js";
// import uploadRoutes from "./routes/fileUpload.js";
// import galleryRoutes from "./routes/galleryRoutes.js";
// import contactRoutes from "./routes/contactRoutes.js";
// import adminJobRoutes from "./routes/adminJobRoutes.js";
// import jobCategoryRoutes from "./routes/jobCategoryRoutes.js";
// import paymentRoutes from "./routes/paymentRoutes.js"; // real routes

// import newsAdminRoutes from "./routes/newsAdminRoutes.js";
// import newsRoutes from "./routes/newsRoutes.js";


// import createAdmin from "./config/adminSetup.js";

// import fileUpload from "express-fileupload";
// import { cloudinaryConnect } from "./config/cloudinary.js";

// dotenv.config();
// const app = express();
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // CORS setup
// const allowedOrigins = [
//   "http://localhost:5173",
//   "https://kbtalentbridgestudios.com",
//     "https://www.kbtalentbridgestudios.com",
//   process.env.FRONTEND_URL,
// ].filter(Boolean);

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
//     if (process.env.ALLOW_ALL_ORIGINS === "true") return callback(null, true);
//     return callback(new Error("CORS policy: origin not allowed"), false);
//   },
//   credentials: true,
// }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Preflight handler
// app.use((req, res, next) => {
//   if (req.method === "OPTIONS") {
//     res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//     res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
//     return res.sendStatus(200);
//   }
//   next();
// });

// // file upload
// app.use(fileUpload({
//   useTempFiles: true,
//   tempFileDir: "./tmp/",
//   createParentPath: true,
//   limits: { fileSize: 50 * 1024 * 1024 },
// }));

// // safe cloudinary connect
// try {
//   cloudinaryConnect();
// } catch (e) {
//   console.warn("Cloudinary connection failed (continuing):", e?.message || e);
// }

// // API routes
// app.use("/api/auth", authRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/candidate", candidateRoutes);
// app.use("/api/employer", employerRoutes);
// app.use("/api/jobs", jobRoutes);
// //app.use("/api/applications", applicationRoutes);
// app.use("/api/v1/upload", uploadRoutes);
// app.use("/api/gallery", galleryRoutes);
// app.use("/api/contact", contactRoutes);
// app.use("/api/admin/jobs", adminJobRoutes);
// app.use("/api/jobcategories", jobCategoryRoutes);
// app.use("/api/payments", paymentRoutes); // real payments mounted at /api/payments


// app.use("/news-admin", newsAdminRoutes);
// app.use("/news", newsRoutes);



// // health endpoint
// app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

// // static serve
// const frontendPath = path.join(__dirname, "../../frontend/dist");
// app.use(express.static(frontendPath));
// app.get(/.*/, (req, res) => {
//   res.sendFile(path.join(frontendPath, "index.html"));
// });

// // DB + server start
// const mongoUri = process.env.MONGO_URI;
// if (!mongoUri) {
//   console.error(" MONGO_URI not set in env. Exiting.");
//   process.exit(1);
// }

// mongoose.connect(mongoUri)
//   .then(async () => {
//     console.log("✅ MongoDB connected");
//     try { await createAdmin(); } catch (e) { console.warn("createAdmin failed:", e?.message || e); }
//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
//   })
//   .catch((err) => {
//     console.error(" MongoDB Error:", err);
//     process.exit(1);
//   });

// export default app;

/**
 * "clientId": "TALENTBRIDGEUAT_25110712",
 "clientVersion": 1,
 "clientSecret": "NGM3NTU5NjktMmYyOC00MmUyLWJjMGUtNDJjMTMzY2Y2YmZi"
 "merchant ID": "M23B6R5TD3JZN"
 */


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
// import uploadRoutes from "./routes/fileUpload.js";
// import galleryRoutes from "./routes/galleryRoutes.js";
// import contactRoutes from "./routes/contactRoutes.js";
// import adminJobRoutes from "./routes/adminJobRoutes.js";
// import jobCategoryRoutes from "./routes/jobCategoryRoutes.js";
// import paymentRoutes from "./routes/paymentRoutes.js";
// // Admin setup
// import createAdmin from "./config/adminSetup.js";

// // File upload middleware
// import fileUpload from "express-fileupload";

// // Cloudinary
// import { cloudinaryConnect } from "./config/cloudinary.js";

// // Initialize dotenv
// dotenv.config();

// const app = express();

// // For __dirname (since we are using ES modules)
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ----------------- MIDDLEWARE -----------------

// // ✅ Updated CORS setup
// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "https://kbtalentbridgestudios.com",
//       "https://kbtalentbridgestudios.com/",
//     ],
//     credentials: true,
//   })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ✅ Handle preflight manually (Render + Express 5 safe)
// app.use((req, res, next) => {
//   if (req.method === "OPTIONS") {
//     res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
//     res.header(
//       "Access-Control-Allow-Headers",
//       "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//     );
//     res.header(
//       "Access-Control-Allow-Methods",
//       "GET, POST, PUT, DELETE, PATCH, OPTIONS"
//     );
//     return res.sendStatus(200);
//   }
//   next();
// });

// // Configure express-fileupload
// app.use(
//   fileUpload({
//     useTempFiles: true,
//     tempFileDir: "/tmp/", // safe location for temporary uploads
//     createParentPath: true,
//     limits: { fileSize: 50 * 1024 * 1024 }, // max 50MB
//   })
// );

// // Connect Cloudinary once
// cloudinaryConnect();

// // ----------------- API ROUTES -----------------
// app.use("/api/auth", authRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/candidate", candidateRoutes);
// app.use("/api/employer", employerRoutes);
// app.use("/api/jobs", jobRoutes);
// app.use("/api/applications", applicationRoutes);
// app.use("/api/v1/upload", uploadRoutes); // Cloudinary file upload
// app.use("/api/gallery", galleryRoutes);
// app.use("/api/contact", contactRoutes);

// app.use("/api/admin/jobs", adminJobRoutes);

// app.use("/api/jobcategories", jobCategoryRoutes);
// app.use("/api/payments", paymentRoutes);

// // ----------------- SERVE FRONTEND BUILD -----------------
// // Serve static files from Vite build
// const frontendPath = path.join(__dirname, "../../frontend/dist");

// // Serve static files
// app.use(express.static(frontendPath));

// // Catch-all route for React Router
// app.get(/.*/, (req, res) => {
//   res.sendFile(path.join(frontendPath, "index.html"));
// });

// // ----------------- DATABASE & SERVER -----------------
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(async () => {
//     console.log("✅ MongoDB connected");

//     // Create admin if not exists
//     await createAdmin();

//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () =>
//       console.log(`🚀 Server running on port ${PORT}`)
//     );
//   })
//   .catch((err) => console.log("❌ MongoDB Error:", err));


// // ✅ server.js (final updated version)
// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import cors from "cors";
// import path from "path";
// import { fileURLToPath } from "url";
// import axios from "axios";
// import crypto from "crypto";
// import { Buffer } from "buffer";
// import fileUpload from "express-fileupload";
// import bodyParser from "body-parser";

// // ROUTES
// import authRoutes from "./routes/authRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";
// import candidateRoutes from "./routes/candidateRoutes.js";
// import employerRoutes from "./routes/employerRoutes.js";
// import jobRoutes from "./routes/jobs.js";
// import applicationRoutes from "./routes/applicationRoutes.js";
// import uploadRoutes from "./routes/fileUpload.js";
// import galleryRoutes from "./routes/galleryRoutes.js";
// import contactRoutes from "./routes/contactRoutes.js";
// import adminJobRoutes from "./routes/adminJobRoutes.js";
// import jobCategoryRoutes from "./routes/jobCategoryRoutes.js";
// import createAdmin from "./config/adminSetup.js";
// import { cloudinaryConnect } from "./config/cloudinary.js";

// dotenv.config();
// const app = express();

// // ---------------- PATH CONFIG ----------------
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ---------------- TRUST PROXY (RENDER) ----------------
// app.set("trust proxy", true);

// // ---------------- FIXED CORS SETUP ----------------
// const allowedOrigins = [
//   "http://localhost:5173",
//   "https://kbtalentbridgestudios.com",
//   "https://www.kbtalentbridgestudios.com",
// ];

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.includes(origin)) return callback(null, true);
//     return callback(new Error("CORS not allowed for " + origin), false);
//   },
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//   allowedHeaders: [
//     "Content-Type",
//     "Authorization",
//     "X-Requested-With",
//     "Accept",
//     "Origin",
//   ],
//   credentials: true,
//   optionsSuccessStatus: 200,
// };

// app.use(cors(corsOptions));
// app.options("*", cors(corsOptions)); // ✅ handles preflight globally

// // ---------------- BODY PARSERS ----------------
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ---------------- FILE UPLOAD ----------------
// app.use(
//   fileUpload({
//     useTempFiles: true,
//     tempFileDir: "/tmp/",
//     createParentPath: true,
//     limits: { fileSize: 50 * 1024 * 1024 },
//   })
// );

// // ---------------- CLOUDINARY ----------------
// cloudinaryConnect();

// // ---------------- ORDER MODEL ----------------
// const orderSchema = new mongoose.Schema({
//   merchantTransactionId: { type: String, unique: true, index: true },
//   amount: Number,
//   jobId: String,
//   userId: String,
//   status: { type: String, default: "PENDING" },
//   raw: { type: Object, default: {} },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
// });
// const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

// // ---------------- API ROUTES ----------------
// app.use("/api/auth", authRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/candidate", candidateRoutes);
// app.use("/api/employer", employerRoutes);
// app.use("/api/jobs", jobRoutes);
// app.use("/api/applications", applicationRoutes);
// app.use("/api/v1/upload", uploadRoutes);
// app.use("/api/gallery", galleryRoutes);
// app.use("/api/contact", contactRoutes);
// app.use("/api/admin/jobs", adminJobRoutes);
// app.use("/api/jobcategories", jobCategoryRoutes);

// // ---------------- PHONEPE CONFIG ----------------
// const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
// const SALT_KEY = process.env.PHONEPE_SALT_KEY;
// const BASE_URL = (process.env.PHONEPE_BASE_URL ||
//   "https://api-preprod.phonepe.com/apis/pg-sandbox").replace(/\/$/, "");
// const REDIRECT_URL =
//   process.env.PHONEPE_REDIRECT_URL ||
//   "https://kbtalentbridgestudios.com/payment-status";
// const WEBHOOK_URL =
//   process.env.PHONEPE_WEBHOOK_URL ||
//   "https://my-backend-knk9.onrender.com/phonepe-webhook";

// // ---------------- PHONEPE HELPERS ----------------
// function makeXVerify(apiPath, payloadObj) {
//   const payloadString = JSON.stringify(payloadObj);
//   const base64Payload = Buffer.from(payloadString).toString("base64");
//   const stringToSign = base64Payload + apiPath + SALT_KEY;
//   const digest = crypto.createHash("sha256").update(stringToSign).digest("hex");
//   return { base64Payload, xVerify: `${digest}###1` };
// }

// // ---------------- CREATE ORDER ----------------
// app.post("/api/payments/create-order", async (req, res) => {
//   try {
//     const { amount, currency = "INR", jobId, title, candidate } = req.body;
//     const userId = req.userId || candidate?.email || "guest_user";

//     if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
//       return res.status(400).json({ message: "Invalid amount" });

//     const merchantTransactionId = `ORDER_${Date.now()}`;

//     const newOrder = await Order.create({
//       merchantTransactionId,
//       amount: Number(amount),
//       jobId,
//       userId,
//       status: "PENDING",
//     });

//     const payload = {
//       merchantId: MERCHANT_ID,
//       merchantTransactionId,
//       merchantUserId: userId,
//       amount: Number(amount),
//       redirectUrl: REDIRECT_URL,
//       redirectMode: "REDIRECT",
//       callbackUrl: WEBHOOK_URL,
//       paymentInstrument: { type: "PAY_PAGE" },
//       merchantMetaData: { jobId, title },
//     };

//     const apiPath = "/pg/v1/pay";
//     const { base64Payload, xVerify } = makeXVerify(apiPath, payload);
//     const phonepeUrl = `${BASE_URL}${apiPath}`;

//     const phonepeResp = await axios.post(
//       phonepeUrl,
//       { request: base64Payload },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           "X-VERIFY": xVerify,
//           "X-MERCHANT-ID": MERCHANT_ID,
//         },
//       }
//     );

//     const result = phonepeResp.data || {};
//     const paymentUrl =
//       result?.data?.redirectUrl ||
//       result?.data?.paymentUrl ||
//       result?.paymentUrl ||
//       result?.redirectUrl ||
//       result?.data?.instrumentResponse?.redirectUrl;

//     newOrder.raw = result;
//     await newOrder.save();

//     res.json({ paymentUrl, merchantTransactionId, raw: result });
//   } catch (err) {
//     console.error("create-order error:", err?.response?.data || err.message);
//     res.status(500).json({
//       message: "Failed to create order",
//       error: err?.response?.data || err.message,
//     });
//   }
// });

// // ---------------- PHONEPE WEBHOOK ----------------
// const CALLBACK_API_PATH = "/pg/v1/payment/callback";

// app.post("/phonepe-webhook", express.raw({ type: "*/*" }), async (req, res) => {
//   try {
//     const incomingXVerify = req.header("X-VERIFY");
//     const rawString = req.body.toString("utf8");
//     const parsed = JSON.parse(rawString);

//     const base64Payload = Buffer.from(rawString).toString("base64");
//     const stringToSign = base64Payload + CALLBACK_API_PATH + SALT_KEY;
//     const expectedDigest = crypto
//       .createHash("sha256")
//       .update(stringToSign)
//       .digest("hex");
//     const expectedXVerify = `${expectedDigest}###1`;

//     if (expectedXVerify !== incomingXVerify)
//       return res.status(400).send("signature_mismatch");

//     const merchantTransactionId =
//       parsed?.merchantTransactionId ||
//       parsed?.data?.merchantTransactionId ||
//       null;
//     const statusRaw =
//       parsed?.status ||
//       parsed?.data?.status ||
//       parsed?.data?.paymentStatus ||
//       "PENDING";

//     let status = "PENDING";
//     if (typeof statusRaw === "string") {
//       const s = statusRaw.toUpperCase();
//       if (s.includes("SUCCESS")) status = "SUCCESS";
//       else if (s.includes("FAIL") || s.includes("CANCEL")) status = "FAILED";
//     }

//     const order = await Order.findOne({ merchantTransactionId });
//     if (!order)
//       await Order.create({
//         merchantTransactionId,
//         status,
//         raw: parsed,
//         amount: parsed?.data?.amount || 0,
//       });
//     else {
//       order.status = status;
//       order.raw = parsed;
//       order.updatedAt = new Date();
//       await order.save();
//     }

//     res.status(200).send("OK");
//   } catch (err) {
//     console.error("Webhook error:", err);
//     res.status(500).send("server_error");
//   }
// });

// // ---------------- ORDER STATUS ----------------
// app.get("/api/payments/order-status", async (req, res) => {
//   try {
//     const { merchantTransactionId } = req.query;
//     if (!merchantTransactionId)
//       return res.status(400).json({ message: "merchantTransactionId required" });

//     const order = await Order.findOne({ merchantTransactionId });
//     if (!order) return res.status(404).json({ message: "Order not found" });

//     res.json({ status: order.status, data: order.raw });
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching order", error: err });
//   }
// });

// // ---------------- FRONTEND BUILD ----------------
// const frontendPath = path.join(__dirname, "../../frontend/dist");
// app.use(express.static(frontendPath));
// app.get(/.*/, (req, res) => {
//   res.sendFile(path.join(frontendPath, "index.html"));
// });

// // ---------------- DB & SERVER START ----------------
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(async () => {
//     console.log("✅ MongoDB connected");
//     await createAdmin();
//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () =>
//       console.log(`🚀 Server running on port ${PORT} | CORS Fixed ✅`)
//     );
//   })
//   .catch((err) => console.log("❌ MongoDB Error:", err));
