
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

// server.js (updated)
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import crypto from "crypto";
import { Buffer } from "buffer";
import bodyParser from "body-parser";

// Routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import candidateRoutes from "./routes/candidateRoutes.js";
import employerRoutes from "./routes/employerRoutes.js";
import jobRoutes from "./routes/jobs.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import uploadRoutes from "./routes/fileUpload.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import adminJobRoutes from "./routes/adminJobRoutes.js";
import jobCategoryRoutes from "./routes/jobCategoryRoutes.js";
// Admin setup
import createAdmin from "./config/adminSetup.js";
// File upload middleware
import fileUpload from "express-fileupload";
// Cloudinary
import { cloudinaryConnect } from "./config/cloudinary.js";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------- MIDDLEWARE -----------------
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://kbtalentbridgestudios.com",
      "https://kbtalentbridgestudios.com/",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight
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

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);

// Connect Cloudinary
cloudinaryConnect();

// ----------------- ORDER MODEL (simple) -----------------
const orderSchema = new mongoose.Schema({
  merchantTransactionId: { type: String, unique: true, index: true },
  amount: Number, // in paise
  jobId: String,
  userId: String,
  status: { type: String, default: "PENDING" }, // PENDING | SUCCESS | FAILED
  raw: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

// ----------------- API ROUTES -----------------
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin/jobs", adminJobRoutes);
app.use("/api/jobcategories", jobCategoryRoutes);

// ----------------- PHONEPE PAYMENT ROUTES -----------------
// env vars used:
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const BASE_URL = (process.env.PHONEPE_BASE_URL || "https://api-preprod.phonepe.com/apis/pg-sandbox").replace(/\/$/, "");
const REDIRECT_URL = process.env.PHONEPE_REDIRECT_URL || "https://yourfrontend.com/payment-status";
const WEBHOOK_URL = process.env.PHONEPE_WEBHOOK_URL || "https://yourbackend.com/phonepe-webhook";

// Helper to build X-VERIFY
function makeXVerify(apiPath, payloadObj) {
  const payloadString = JSON.stringify(payloadObj);
  const base64Payload = Buffer.from(payloadString).toString("base64");
  const stringToSign = base64Payload + apiPath + SALT_KEY;
  const digest = crypto.createHash("sha256").update(stringToSign).digest("hex");
  const xVerify = `${digest}###1`;
  return { base64Payload, xVerify };
}

// POST /api/payments/create-order
app.post("/api/payments/create-order", async (req, res) => {
  try {
    // Basic auth check (if you use middleware for auth, replace accordingly)
    const userId = req.userId || (req.body.candidate && req.body.candidate.email) || null;

    const { amount, currency = "INR", jobId, title, candidate } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const merchantTransactionId = `ORDER_${Date.now()}`;

    // create DB order BEFORE calling PhonePe (safer)
    const newOrder = await Order.create({
      merchantTransactionId,
      amount: Number(amount),
      jobId,
      userId,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: userId || (candidate && candidate.email) || "user_1",
      amount: Number(amount), // paise
      redirectUrl: REDIRECT_URL,
      redirectMode: "REDIRECT",
      callbackUrl: WEBHOOK_URL,
      paymentInstrument: { type: "PAY_PAGE" },
      merchantMetaData: { jobId, title },
    };

    const apiPath = "/pg/v1/pay";
    const { base64Payload, xVerify } = makeXVerify(apiPath, payload);
    const phonepeUrl = `${BASE_URL}${apiPath}`;

    const phonepeResp = await axios.post(
      phonepeUrl,
      { request: base64Payload },
      { headers: { "Content-Type": "application/json", "X-VERIFY": xVerify, "X-MERCHANT-ID": MERCHANT_ID }, timeout: 20000 }
    );

    const result = phonepeResp.data || {};
    // try several locations for paymentUrl
    const paymentUrl = result?.data?.redirectUrl || result?.data?.paymentUrl || result?.paymentUrl || result?.redirectUrl || result?.data?.instrumentResponse?.redirectUrl;

    // save raw response
    newOrder.raw = result;
    await newOrder.save();

    return res.json({ paymentUrl, merchantTransactionId, raw: result });
  } catch (err) {
    console.error("create-order error:", err?.response?.data || err.message);
    return res.status(500).json({ message: "Failed to create order", error: err?.response?.data || err.message });
  }
});

// Webhook: PhonePe will POST here. Use raw body for signature verification
// IMPORTANT: ensure CALLBACK_API_PATH exactly matches the string PhonePe uses to sign the webhook
const CALLBACK_API_PATH = "/pg/v1/payment/callback"; // <-- adjust if PhonePe docs/dashboard specify different
app.post("/phonepe-webhook", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    const incomingXVerify = req.header("X-VERIFY") || req.header("x-verify");
    const incomingMerchantId = req.header("X-MERCHANT-ID") || req.header("x-merchant-id");
    const rawString = req.body.toString("utf8");
    const parsed = JSON.parse(rawString);

    // compute expected signature
    const base64Payload = Buffer.from(rawString).toString("base64");
    const stringToSign = base64Payload + CALLBACK_API_PATH + SALT_KEY;
    const expectedDigest = crypto.createHash("sha256").update(stringToSign).digest("hex");
    const expectedXVerify = `${expectedDigest}###1`;

    if (expectedXVerify !== incomingXVerify) {
      console.warn("Webhook signature mismatch", { expectedXVerify, incomingXVerify });
      return res.status(400).send("signature_mismatch");
    }

    // extract merchantTransactionId & status (payload shape may differ; handle common keys)
    const merchantTransactionId = parsed?.merchantTransactionId || parsed?.data?.merchantTransactionId || parsed?.data?.merchant_tx || parsed?.data?.merchant_txn;
    const statusRaw = parsed?.status || parsed?.data?.status || parsed?.data?.paymentStatus || parsed?.data?.payment_status;
    // normalize status
    let status = "PENDING";
    if (typeof statusRaw === "string") {
      const s = statusRaw.toUpperCase();
      if (s.includes("SUCCESS")) status = "SUCCESS";
      else if (s.includes("FAIL") || s.includes("CANCEL") || s.includes("FAILED")) status = "FAILED";
      else status = s;
    }

    if (!merchantTransactionId) {
      console.warn("Webhook missing merchantTransactionId", parsed);
      return res.status(400).send("missing_tx");
    }

    // idempotent update
    const order = await Order.findOne({ merchantTransactionId });
    if (!order) {
      // create a fallback order record (optional)
      await Order.create({
        merchantTransactionId,
        amount: parsed?.amount || parsed?.data?.amount || 0,
        jobId: parsed?.data?.merchantMetaData?.jobId || parsed?.merchantMetaData?.jobId || null,
        userId: null,
        status,
        raw: parsed,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("Webhook created fallback order", merchantTransactionId, status);
      return res.status(200).send("OK");
    }

    if (order.status === "SUCCESS") {
      // already processed
      return res.status(200).send("OK");
    }

    order.status = status;
    order.raw = parsed;
    order.updatedAt = new Date();
    await order.save();

    console.log("Webhook processed:", merchantTransactionId, status);
    return res.status(200).send("OK");
  } catch (err) {
    console.error("webhook handling error:", err);
    return res.status(500).send("server_error");
  }
});

// Order-status endpoint: read DB (preferred)
app.get("/api/payments/order-status", async (req, res) => {
  try {
    const merchantTransactionId = req.query.merchantTransactionId;
    if (!merchantTransactionId) return res.status(400).json({ message: "merchantTransactionId required" });

    const order = await Order.findOne({ merchantTransactionId });
    if (order) {
      return res.json({ status: order.status, data: order.raw || {} });
    }

    // Optional fallback: call PhonePe status API (if you prefer)
    // const apiPath = "/pg/v1/status/single"; // confirm with PhonePe docs
    // const payload = { merchantId: MERCHANT_ID, merchantTransactionId };
    // const { base64Payload, xVerify } = makeXVerify(apiPath, payload);
    // const resp = await axios.post(`${BASE_URL}${apiPath}`, { request: base64Payload }, { headers: { "Content-Type": "application/json", "X-VERIFY": xVerify, "X-MERCHANT-ID": MERCHANT_ID } });
    // return res.json({ status: resp.data?.data?.status || "UNKNOWN", raw: resp.data });

    return res.status(404).json({ message: "Order not found" });
  } catch (err) {
    console.error("order-status error:", err);
    return res.status(500).json({ message: "Failed to fetch status", error: err.message });
  }
});

// ----------------- SERVE FRONTEND BUILD -----------------
const frontendPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendPath));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ----------------- DATABASE & SERVER -----------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");
    await createAdmin();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.log("❌ MongoDB Error:", err));
