// src/routes/paymentRoutes.js

import auth from "../middlewares/auth.js";
import express from "express";
import dotenv from "dotenv";
import {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
} from "pg-sdk-node";

import Order from "../models/Order.js";
import { generateJobID } from "../utils/generateJobId.js";

dotenv.config();
const router = express.Router();

/* -----------------------------------------------------
   PHONEPE CLIENT INIT
----------------------------------------------------- */

const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const clientVersion = 1;

const SDK_ENV =
  process.env.NODE_ENV === "production" ? Env.PRODUCTION : Env.SANDBOX;

let client = null;
if (clientID && clientSecret) {
  client = StandardCheckoutClient.getInstance(
    clientID,
    clientSecret,
    clientVersion,
    SDK_ENV
  );
} else {
  console.warn("⚠️ PhonePe client not initialized — missing keys");
}

/* -----------------------------------------------------
   HELPERS
----------------------------------------------------- */

function toPaise(amount) {
  const n = Number(amount);
  if (!n || n <= 0) return null;
  return Math.round(n * 100);
}

/* -----------------------------------------------------
   CREATE ORDER (SAFE)
----------------------------------------------------- */

router.post("/create-order", auth, async (req, res) => {
  try {
    const { amount, amountPaise, title } = req.body || {};

    const paise = amountPaise ? Number(amountPaise) : toPaise(amount);
    if (!paise) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const merchantOrderId = await generateJobID("KBTS");

    const frontBase =
      process.env.FRONTEND_BASE || "http://localhost:5173";

    const redirectUrl =
      `${frontBase}/payment-result?merchantOrderId=${merchantOrderId}`;

    // 1️⃣ Create order FIRST
    await Order.create({
      merchantOrderId,
      userId: req.user._id,
      amountPaise: paise,
      status: "CREATED",
      paymentProvider: "PHONEPE",
      paymentProviderData: {
        title,
        createdAt: new Date(),
      },
    });

    // 2️⃣ Create PhonePe request
    const builder = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(paise)
      .redirectUrl(redirectUrl);

    if (title && builder.orderNote) {
      builder.orderNote(title);
    }

    const request = builder.build();
    const response = await client.pay(request);

    const paymentUrl =
      response?.redirectUrl ||
      response?.redirect_url ||
      response?.checkoutPageUrl;

    if (!paymentUrl) {
      return res.status(502).json({ error: "Invalid PhonePe response" });
    }

    // 3️⃣ Mark order as pending
    await Order.updateOne(
      { merchantOrderId },
      {
        status: "PENDING",
        "paymentProviderData.createResponse": response,
      }
    );

    return res.status(201).json({
      merchantOrderId,
      paymentUrl,
    });

  } catch (err) {
    console.error("❌ CREATE ORDER ERROR:", err);
    return res.status(500).json({ error: "Failed to create order" });
  }
});

/* -----------------------------------------------------
   PHONEPE REDIRECT CALLBACK (NO DB LOGIC)
   ⚠️ NOT TRUSTED
----------------------------------------------------- */

router.post("/phonepe-callback", (req, res) => {
  // Redirect / fallback only
  // Webhook will decide actual payment status
  return res.json({ ok: true });
});

/* -----------------------------------------------------
   STATUS CHECK (DB FIRST, API SECOND)
----------------------------------------------------- */

router.get("/status/:merchantOrderId", async (req, res) => {
  try {
    const { merchantOrderId } = req.params;

    const order = await Order.findOne({ merchantOrderId });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // 1️⃣ If webhook already decided → RETURN
    if (["SUCCESS", "FAILED"].includes(order.status)) {
      return res.json({
        merchantOrderId,
        status: order.status,
        source: "DATABASE",
      });
    }

    // 2️⃣ Only if still pending → check PhonePe
    const providerResponse = await client.getOrderStatus(merchantOrderId);

    const rawStatus =
      providerResponse?.state ||
      providerResponse?.status ||
      providerResponse?.data?.state ||
      providerResponse?.data?.status ||
      "PENDING";

    const providerStatus = rawStatus.toUpperCase();

    // ⚠️ IMPORTANT:
    // Do NOT mark SUCCESS here
    // Let webhook handle final success

    order.paymentProviderData =
      order.paymentProviderData || {};
    order.paymentProviderData.lastStatusCheck = providerResponse;
    await order.save();

    return res.json({
      merchantOrderId,
      status: order.status,      // still PENDING
      providerStatus,
      source: "PHONEPE_API",
    });

  } catch (err) {
    console.error("❌ STATUS CHECK ERROR:", err);
    return res.status(500).json({ error: "Status check failed" });
  }
});

export default router;



// // src/routes/paymentRoutes.js

// import auth from "../middlewares/auth.js";
// import express from "express";
// import dotenv from "dotenv";
// import {
//   StandardCheckoutClient,
//   Env,
//   StandardCheckoutPayRequest,
// } from "pg-sdk-node";

// import Order from "../models/Order.js";
// import Candidate from "../models/Candidate.js";
// import PaidCandidate from "../models/PaidCandidate.js";
// import { generateJobID } from "../utils/generateJobId.js";

// dotenv.config();
// const router = express.Router();

// // -----------------------------------------------------
// // INIT PHONEPE CLIENT
// // -----------------------------------------------------

// const clientID = process.env.CLIENT_ID;
// const clientSecret = process.env.CLIENT_SECRET;
// const clientVersion = 1;

// const SDK_ENV =
//   process.env.NODE_ENV === "production" ? Env.PRODUCTION : Env.SANDBOX;

// let client = null;
// try {
//   if (clientID && clientSecret) {
//     client = StandardCheckoutClient.getInstance(
//       clientID,
//       clientSecret,
//       clientVersion,
//       SDK_ENV
//     );
//   } else {
//     console.warn("⚠️ PhonePe client not initialized — missing keys.");
//   }
// } catch (err) {
//   console.error("❌ PhonePe SDK init failed:", err);
// }

// // -----------------------------------------------------
// // HELPERS
// // -----------------------------------------------------

// function toPaise(amount) {
//   const n = Number(amount);
//   if (!n || n <= 0) return null;
//   return Math.round(n * 100);
// }

// const verifyPhonePeSignature = () => true;

// const safeName = (c) =>
//   `${c?.firstName || c?.name || ""} ${c?.lastName || ""}`.trim();

// // -----------------------------------------------------
// // CREATE ORDER
// // -----------------------------------------------------

// router.post("/create-order", auth, async (req, res) => {
//   try {
//     const { amount, amountPaise, title } = req.body || {};

//     let paise = amountPaise ? Number(amountPaise) : toPaise(amount);
//     if (!paise) return res.status(400).json({ error: "Invalid amount" });

//     const merchantOrderId = await generateJobID("KBTS");

//     const frontBase =
//       process.env.FRONTEND_BASE || "http://localhost:5173";

//     const redirectUrl = `${frontBase}/payment-result?merchantOrderId=${merchantOrderId}`;

//     await Order.create({
//       merchantOrderId,
//       userId: req.user._id,
//       amountPaise: paise,
//       status: "CREATED",
//       generatedJobId: merchantOrderId,
//       paymentProviderData: { createdAt: new Date(), title },
//     });

//     const builder = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(paise)
//       .redirectUrl(redirectUrl);

//     if (title && builder.orderNote) builder.orderNote(title);

//     const request = builder.build();
//     const response = await client.pay(request);

//     const paymentUrl =
//       response?.redirectUrl ||
//       response?.redirect_url ||
//       response?.checkoutPageUrl;

//     if (!paymentUrl)
//       return res.status(502).json({ error: "Invalid PhonePe response" });

//     await Order.findOneAndUpdate(
//       { merchantOrderId },
//       {
//         status: "PENDING",
//         "paymentProviderData.createResponse": response,
//       }
//     );

//     return res.status(201).json({ paymentUrl, merchantOrderId });
//   } catch (err) {
//     console.error("CREATE ORDER ERROR:", err);
//     return res.status(500).json({ error: err.message });
//   }
// });

// // -----------------------------------------------------
// // PHONEPE CALLBACK (FALLBACK)
// // -----------------------------------------------------

// router.post("/phonepe-callback", async (req, res) => {
//   try {
//     if (!verifyPhonePeSignature(req))
//       return res.status(400).json({ error: "Invalid signature" });

//     const payload = req.body || {};
//     const merchantOrderId =
//       payload.merchantOrderId ||
//       payload.data?.merchantOrderId ||
//       payload.orderId;

//     const order = await Order.findOne({ merchantOrderId });
//     if (!order)
//       return res.status(404).json({ error: "Order not found" });

//     const status = (payload.status || payload.data?.status || "").toUpperCase();

//     if (["SUCCESS", "COMPLETED", "PAID"].includes(status)) {
//       order.status = "SUCCESS";
//       order.jobId = merchantOrderId;
//       await order.save();

//       // ✅ MARK USER AS PAID (SAFE)
//       await Candidate.findByIdAndUpdate(order.userId, {
//         isPaid: true,
//         paidAt: new Date(),
//         paidOrderId: merchantOrderId
//       });

//       const exists = await PaidCandidate.findOne({ merchantOrderId });
//       if (!exists) {
//         const c = await Candidate.findById(order.userId);

//         await PaidCandidate.create({
//           userId: order.userId,
//           name: safeName(c),
//           email: c?.email || "",
//           contact: c?.mobile || "",
//           merchantOrderId,
//           jobId: merchantOrderId,
//           amountPaise: order.amountPaise,
//           status: "SUCCESS",
//           paidAt: new Date(),
//         });
//       }

//       return res.json({ ok: true });
//     }

//     if (["FAILED", "CANCELLED", "DECLINED"].includes(status)) {
//       order.status = "FAILED";
//       await order.save();
//       return res.json({ ok: true });
//     }

//     order.status = "PENDING";
//     await order.save();
//     return res.json({ ok: true });

//   } catch (err) {
//     console.error("CALLBACK ERROR:", err);
//     return res.status(500).json({ error: err.message });
//   }
// });

// // -----------------------------------------------------
// // REAL-TIME STATUS CHECK (MAIN SYSTEM)
// // -----------------------------------------------------
// router.get("/status/:merchantOrderId", async (req, res) => {
//   try {
//     const { merchantOrderId } = req.params;

//     const order = await Order.findOne({ merchantOrderId });
//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     const providerResponse = await client.getOrderStatus(merchantOrderId);

//     console.log("✅ RAW PHONEPE RESPONSE:", JSON.stringify(providerResponse, null, 2));

//     // ✅ SAFELY EXTRACT STATUS FROM ANY FORMAT
//     const rawStatus =
//       providerResponse?.state ||
//       providerResponse?.status ||
//       providerResponse?.data?.state ||
//       providerResponse?.data?.status ||
//       "PENDING";

//     const finalStatus = rawStatus.toUpperCase();

//     if (["COMPLETED", "SUCCESS", "PAID"].includes(finalStatus)) {
//       order.status = "SUCCESS";
//       order.jobId = merchantOrderId;

//       // ✅ MARK USER AS PAID
//       await Candidate.findByIdAndUpdate(order.userId, {
//         isPaid: true,
//         paidAt: new Date(),
//         paidOrderId: merchantOrderId,
//       });

//       const exists = await PaidCandidate.findOne({ merchantOrderId });
//       if (!exists) {
//         const c = await Candidate.findById(order.userId);

//         await PaidCandidate.create({
//           userId: order.userId,
//           name: safeName(c),
//           email: c?.email || "",
//           contact: c?.mobile || "",
//           merchantOrderId,
//           jobId: merchantOrderId,
//           amountPaise: order.amountPaise,
//           status: "SUCCESS",
//           paidAt: new Date(),
//         });

//         console.log("✅ PAID CANDIDATE CREATED");
//       }
//     }
//     else if (["FAILED", "CANCELLED", "DECLINED"].includes(finalStatus)) {
//       order.status = "FAILED";
//     }
//     else {
//       order.status = "PENDING";
//     }

//     order.paymentProviderData = order.paymentProviderData || {};
//     order.paymentProviderData.lastStatusCheck = providerResponse;
//     await order.save();

//     return res.json({
//       merchantOrderId,
//       status: order.status,
//       providerStatus: finalStatus,
//     });

//   } catch (err) {
//     console.error("❌ STATUS API ERROR:", err);
//     return res.status(500).json({ error: err.message });
//   }
// });


// export default router;




// // src/routes/paymentRoutes.js
// import auth from "../middlewares/auth.js";

// import express from "express";
// import dotenv from "dotenv";
// import {
//   StandardCheckoutClient,
//   Env,
//   StandardCheckoutPayRequest,
// } from "pg-sdk-node";

// import Order from "../models/Order.js";
// import Candidate from "../models/Candidate.js";
// import PaidCandidate from "../models/PaidCandidate.js";
// import { generateJobID } from "../utils/generateJobId.js";

// dotenv.config();

// const router = express.Router();


// // -----------------------------------------------------
// //  INIT PHONEPE CLIENT
// // -----------------------------------------------------

// const clientID = process.env.CLIENT_ID;
// const clientSecret = process.env.CLIENT_SECRET;
// const clientVersion = 1;

// const SDK_ENV =
//   process.env.NODE_ENV === "production" ? Env.PRODUCTION : Env.SANDBOX;

// let client = null;
// try {
//   if (clientID && clientSecret) {
//     client = StandardCheckoutClient.getInstance(
//       clientID,
//       clientSecret,
//       clientVersion,
//       SDK_ENV
//     );
//   } else {
//     console.warn("⚠️ PhonePe client not initialized — missing keys.");
//   }
// } catch (err) {
//   console.error("❌ PhonePe SDK init failed:", err);
// }


// // Helpers
// function toPaise(amount) {
//   const n = Number(amount);
//   if (!n || n <= 0) return null;
//   return Math.round(n * 100);
// }

// const verifyPhonePeSignature = () => true;

// const safeName = (c) =>
//   `${c?.firstName || c?.name || ""} ${c?.lastName || ""}`.trim();



// // -----------------------------------------------------
// //  CREATE ORDER
// // -----------------------------------------------------

// router.post("/create-order", async (req, res) => {
//   try {
//     const { amount, amountPaise, title } = req.body || {};

//     let paise = amountPaise ? Number(amountPaise) : toPaise(amount);
//     if (!paise) return res.status(400).json({ error: "Invalid amount" });

//     const merchantOrderId = await generateJobID("KBTS");

//     const frontBase =
//       process.env.FRONTEND_BASE || "http://localhost:5173";

//     const redirectUrl = `${frontBase}/payment-result?merchantOrderId=${merchantOrderId}`;

//     await Order.create({
//       merchantOrderId,
//       userId: req.user?._id || null,
//       amountPaise: paise,
//       status: "CREATED",
//       generatedJobId: merchantOrderId,
//       paymentProviderData: { createdAt: new Date(), title },
//     });

//     const builder = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(paise)
//       .redirectUrl(redirectUrl);

//     if (title && builder.orderNote) builder.orderNote(title);

//     const request = builder.build();
//     const response = await client.pay(request);

//     const paymentUrl =
//       response?.redirectUrl ||
//       response?.redirect_url ||
//       response?.checkoutPageUrl;

//     if (!paymentUrl)
//       return res.status(502).json({ error: "Invalid PhonePe response" });

//     await Order.findOneAndUpdate(
//       { merchantOrderId },
//       {
//         status: "PENDING",
//         "paymentProviderData.createResponse": response,
//       }
//     );

//     return res.status(201).json({ paymentUrl, merchantOrderId });
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// });



// // -----------------------------------------------------
// //  CALLBACK (FALLBACK ONLY)
// // -----------------------------------------------------

// router.post("/phonepe-callback", async (req, res) => {
//   try {
//     if (!verifyPhonePeSignature(req))
//       return res.status(400).json({ error: "Invalid signature" });

//     const payload = req.body || {};
//     const merchantOrderId =
//       payload.merchantOrderId ||
//       payload.data?.merchantOrderId ||
//       payload.orderId;

//     const order = await Order.findOne({ merchantOrderId });
//     if (!order)
//       return res.status(404).json({ error: "Order not found" });

//     const status = (payload.status || payload.data?.status)?.toUpperCase();

//     if (["SUCCESS", "COMPLETED", "PAID"].includes(status)) {
//       order.status = "SUCCESS";
//       order.jobId = merchantOrderId;
//       await order.save();
//       // ✅ MARK USER AS PAID
// await Candidate.findByIdAndUpdate(order.userId, {
//   isPaid: true,
//   paidAt: new Date(),
//   paidOrderId: merchantOrderId
// });


//       const exists = await PaidCandidate.findOne({ merchantOrderId });
//       if (!exists) {
//         const c = await Candidate.findById(order.userId);
//         await PaidCandidate.create({
//           userId: order.userId,
//           name: safeName(c),
//           email: c?.email || "",
//           contact: c?.mobile || "",
//           merchantOrderId,
//           jobId: merchantOrderId,
//           amountPaise: order.amountPaise,
//           status: "SUCCESS",
//           paidAt: new Date(),
//         });
//       }

//       return res.json({ ok: true });
//     }

//     if (["FAILED", "CANCELLED", "DECLINED"].includes(status)) {
//       order.status = "FAILED";
//       await order.save();
//       return res.json({ ok: true });
//     }

//     order.status = "PENDING";
//     await order.save();
//     return res.json({ ok: true });
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// });



// // -----------------------------------------------------
// //  **REAL-TIME STATUS CHECK** (DOCS-CORRECT VERSION)
// // -----------------------------------------------------

// router.get("/status/:merchantOrderId", async (req, res) => {
//   try {
//     const { merchantOrderId } = req.params;

//     const order = await Order.findOne({ merchantOrderId });
//     if (!order)
//       return res.status(404).json({ error: "Order not found" });

//     // OFFICIAL PHONEPE API — from docs
//     const providerResponse = await client.getOrderStatus(merchantOrderId);

//     console.log("PhonePe Order Status:", providerResponse);

//     const finalStatus = providerResponse?.state?.toUpperCase() || "PENDING";

//     if (finalStatus === "COMPLETED") {
//       order.status = "SUCCESS";
//       order.jobId = merchantOrderId;
//       // ✅ MARK USER AS PAID
// await Candidate.findByIdAndUpdate(order.userId, {
//   isPaid: true,
//   paidAt: new Date(),
//   paidOrderId: merchantOrderId
// });



//       const exists = await PaidCandidate.findOne({ merchantOrderId });
//       if (!exists) {
//         const c = await Candidate.findById(order.userId);

//         await PaidCandidate.create({
//           userId: order.userId,
//           name: safeName(c),
//           email: c?.email || "",
//           contact: c?.mobile || "",
//           merchantOrderId,
//           jobId: merchantOrderId,
//           amountPaise: order.amountPaise,
//           status: "SUCCESS",
//           paidAt: new Date(),
//         });
//       }
//     }

//     else if (finalStatus === "FAILED") {
//       order.status = "FAILED";
//     }

//     else {
//       order.status = "PENDING";
//     }

//     order.paymentProviderData.lastStatusCheck = providerResponse;
//     await order.save();

//     return res.json({
//       merchantOrderId,
//       status: order.status,
//       providerStatus: finalStatus,
//     });

//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// });


// export default router;



// import express from "express";
// import dotenv from "dotenv";
// import {
//   StandardCheckoutClient,
//   Env,
//   StandardCheckoutPayRequest,
// } from "pg-sdk-node";
// import Order from "../models/Order.js";
// import Candidate from "../models/Candidate.js";
// import PaidCandidate from "../models/PaidCandidate.js";
// import { generateJobID } from "../utils/generateJobId.js";

// dotenv.config();

// const router = express.Router();

// // Required envs
// const clientID = process.env.CLIENT_ID;
// const clientSecret = process.env.CLIENT_SECRET;
// const clientVersion = 1;
// const SDK_ENV =
//   process.env.NODE_ENV === "production" ? Env.PRODUCTION : Env.SANDBOX;

// // Initialize SDK client safely
// let client = null;
// try {
//   if (clientID && clientSecret) {
//     client = StandardCheckoutClient.getInstance(
//       clientID,
//       clientSecret,
//       clientVersion,
//       SDK_ENV
//     );
//   } else {
//     console.warn("PhonePe SDK client not initialized.");
//   }
// } catch (e) {
//   console.error("Failed to initialize PhonePe SDK:", e);
//   client = null;
// }

// // Convert rupees → paise
// function toPaise(amountOrPaise) {
//   if (amountOrPaise === undefined || amountOrPaise === null) return null;
//   const n = Number(amountOrPaise);
//   if (!Number.isFinite(n) || n <= 0) return null;
//   return Math.round(n * 100);
// }

// // Dummy signature verify (temp)
// function verifyPhonePeSignature(req) {
//   return true;
// }

// /* -----------------------------------------
//    CREATE ORDER (UNCHANGED)
// ------------------------------------------ */
// router.post("/create-order", async (req, res) => {
//   try {
//     const { amount, amountPaise, title } = req.body ?? {};

//     if (!client) {
//       return res.status(500).json({ error: "Payment provider not configured" });
//     }

//     let paise =
//       amountPaise !== undefined && amountPaise !== null
//         ? Number(amountPaise)
//         : toPaise(amount);

//     if (!paise) {
//       return res.status(400).json({
//         error: "Invalid amount (send rupees or paise)",
//       });
//     }

//     const merchantOrderId = await generateJobID("KBTS");

//     const frontBase = (process.env.FRONTEND_BASE || "http://localhost:5173").replace(/\/$/, "");
//     const serverBase = (
//       process.env.SERVER_BASE ||
//       `http://localhost:${process.env.PORT || 5000}`
//     ).replace(/\/$/, "");

//     const redirectUrl = `${frontBase}/payment-result?merchantOrderId=${merchantOrderId}`;

//     await Order.create({
//       merchantOrderId,
//       generatedJobId: merchantOrderId,
//       jobId: null,
//       userId: req.user?._id || null,
//       amountPaise: paise,
//       status: "CREATED",
//       paymentProviderData: { requestedAt: new Date(), title },
//     });

//     const builder = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(paise)
//       .redirectUrl(redirectUrl);

//     if (title && typeof builder.orderNote === "function") {
//       try { builder.orderNote(title); } catch {}
//     }

//     const request = builder.build();

//     let response;
//     try {
//       response = await client.pay(request);
//     } catch (sdkErr) {
//       await Order.findOneAndUpdate(
//         { merchantOrderId },
//         {
//           status: "FAILED",
//           "paymentProviderData.createError": sdkErr?.message,
//         }
//       );
//       return res.status(502).json({
//         error: "Payment provider error",
//         details: sdkErr?.message,
//       });
//     }

//     const paymentUrl =
//       response?.redirectUrl ||
//       response?.redirect_url ||
//       response?.checkoutPageUrl;

//     if (!paymentUrl) {
//       await Order.findOneAndUpdate(
//         { merchantOrderId },
//         {
//           status: "FAILED",
//           "paymentProviderData.createResponse": response,
//         }
//       );

//       return res.status(502).json({
//         error: "Invalid SDK response",
//       });
//     }

//     await Order.findOneAndUpdate(
//       { merchantOrderId },
//       {
//         status: "PENDING",
//         "paymentProviderData.createResponse": response,
//       }
//     );

//     res.status(201).json({ paymentUrl, merchantOrderId });
//   } catch (err) {
//     res.status(500).json({
//       error: "Error creating order",
//       details: err?.message,
//     });
//   }
// });

// /* -----------------------------------------
//     PHONEPE CALLBACK HANDLER (WEBHOOK)
//     (KEPT AS FALLBACK)
// ------------------------------------------ */
// router.post("/phonepe-callback", async (req, res) => {
//   try {
//     if (!verifyPhonePeSignature(req)) {
//       return res.status(400).json({ error: "invalid signature" });
//     }

//     const payload = req.body ?? {};
//     const merchantOrderId =
//       payload.merchantOrderId ||
//       payload.data?.merchantOrderId ||
//       payload.orderId;

//     const status = (payload.status || payload.data?.status || "")
//       .toString()
//       .toUpperCase();

//     if (!merchantOrderId) {
//       return res.status(400).json({ error: "missing merchantOrderId" });
//     }

//     const order = await Order.findOne({ merchantOrderId });

//     if (!order) {
//       return res.status(404).json({ error: "order not found" });
//     }

//     order.paymentProviderData.lastCallback = payload;

//     if (["SUCCESS", "COMPLETED", "PAID"].includes(status)) {
//       order.status = "SUCCESS";
//       order.jobId = merchantOrderId;
//       order.generatedJobId = merchantOrderId;
//       await order.save();

//       const candidate = order.userId
//         ? await Candidate.findById(order.userId)
//         : null;

//       await PaidCandidate.create({
//         candidateId: order.userId,
//         name: candidate?.name,
//         email: candidate?.email,
//         contact: candidate?.contact,
//         merchantOrderId,
//         jobId: merchantOrderId,
//         amountPaise: order.amountPaise,
//         status: "SUCCESS",
//         paidAt: new Date(),
//       });

//       return res.status(200).json({ ok: true });
//     }

//     if (["FAILED", "DECLINED", "CANCELLED"].includes(status)) {
//       order.status = "FAILED";
//       await order.save();
//       return res.status(200).json({ ok: true });
//     }

//     order.status = "PENDING";
//     await order.save();
//     return res.status(200).json({ ok: true });

//   } catch (err) {
//     res.status(500).json({
//       error: "callback processing error",
//       details: err?.message,
//     });
//   }
// });

// /* -----------------------------------------
//     🔥 REAL TIME STATUS CHECK API
//     (THIS IS WHAT YOUR FRONTEND SHOULD CALL)
// ------------------------------------------ */
// router.get("/status/:merchantOrderId", async (req, res) => {
//   try {
//     const { merchantOrderId } = req.params;

//     if (!client) {
//       return res.status(500).json({ error: "Payment provider not configured" });
//     }

//     const order = await Order.findOne({ merchantOrderId });
//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     // Fetch real-time status from PhonePe
//     const providerResponse = await client.checkStatus(merchantOrderId);

//     const providerStatus =
//       providerResponse?.status ||
//       providerResponse?.data?.status ||
//       "PENDING";

//     const finalStatus = providerStatus.toUpperCase();

//     // Update DB based on response
//     if (["SUCCESS", "PAID", "COMPLETED"].includes(finalStatus)) {
//       order.status = "SUCCESS";
//     } else if (["FAILED", "CANCELLED", "DECLINED"].includes(finalStatus)) {
//       order.status = "FAILED";
//     } else {
//       order.status = "PENDING";
//     }

//     order.paymentProviderData.lastStatusCheck = providerResponse;
//     await order.save();

//     res.status(200).json({
//       merchantOrderId,
//       status: order.status,
//       providerStatus,
//     });

//   } catch (err) {
//     res.status(500).json({
//       error: "Status check failed",
//       details: err.message,
//     });
//   }
// });

// export default router;



// import express from "express";
// import dotenv from "dotenv";
// import {
//   StandardCheckoutClient,
//   Env,
//   StandardCheckoutPayRequest,
// } from "pg-sdk-node";
// import Order from "../models/Order.js";
// import Candidate from "../models/Candidate.js";
// import PaidCandidate from "../models/PaidCandidate.js";
// import { generateJobID } from "../utils/generateJobId.js";

// dotenv.config();

// const router = express.Router();

// // Required envs
// const clientID = process.env.CLIENT_ID;
// const clientSecret = process.env.CLIENT_SECRET;
// const clientVersion = 1;
// const SDK_ENV =
//   process.env.NODE_ENV === "production" ? Env.PRODUCTION : Env.SANDBOX;

// // Initialize SDK client safely
// let client = null;
// try {
//   if (clientID && clientSecret) {
//     client = StandardCheckoutClient.getInstance(
//       clientID,
//       clientSecret,
//       clientVersion,
//       SDK_ENV
//     );
//   } else {
//     console.warn("PhonePe SDK client not initialized.");
//   }
// } catch (e) {
//   console.error("Failed to initialize PhonePe SDK:", e);
//   client = null;
// }

// // Convert rupees → paise
// function toPaise(amountOrPaise) {
//   if (amountOrPaise === undefined || amountOrPaise === null) return null;
//   const n = Number(amountOrPaise);
//   if (!Number.isFinite(n) || n <= 0) return null;
//   return Math.round(n * 100);
// }

// // Dummy signature verify (temp)
// function verifyPhonePeSignature(req) {
//   return true;
// }

// /* -----------------------------------------
//    CREATE ORDER
// ------------------------------------------ */
// router.post("/create-order", async (req, res) => {
//   try {
//     const { amount, amountPaise, title } = req.body ?? {};

//     if (!client) {
//       return res.status(500).json({ error: "Payment provider not configured" });
//     }

//     let paise =
//       amountPaise !== undefined && amountPaise !== null
//         ? Number(amountPaise)
//         : toPaise(amount);

//     if (!paise) {
//       return res.status(400).json({
//         error: "Invalid amount (send rupees or paise)",
//       });
//     }

//     const merchantOrderId = await generateJobID("KBTS");

//     const frontBase = (process.env.FRONTEND_BASE || "http://localhost:5173").replace(/\/$/, "");
//     const serverBase = (
//       process.env.SERVER_BASE ||
//       `http://localhost:${process.env.PORT || 5000}`
//     ).replace(/\/$/, "");

//     const redirectUrl = `${frontBase}/payment-result?merchantOrderId=${merchantOrderId}`;

//     // Save order
//     await Order.create({
//       merchantOrderId,
//       generatedJobId: merchantOrderId,
//       jobId: null,
//       userId: req.user?._id || null,
//       amountPaise: paise,
//       status: "CREATED",
//       paymentProviderData: { requestedAt: new Date(), title },
//     });

//     // Build request (NO callbackUrl)
//     const builder = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(paise)
//       .redirectUrl(redirectUrl);  // ONLY this supported

//     if (title && typeof builder.orderNote === "function") {
//       try { builder.orderNote(title); } catch {}
//     }

//     const request = builder.build();

//     let response;
//     try {
//       response = await client.pay(request);
//     } catch (sdkErr) {
//       await Order.findOneAndUpdate(
//         { merchantOrderId },
//         {
//           status: "FAILED",
//           "paymentProviderData.createError": sdkErr?.message,
//         }
//       );
//       return res.status(502).json({
//         error: "Payment provider error",
//         details: sdkErr?.message,
//       });
//     }

//     const paymentUrl =
//       response?.redirectUrl ||
//       response?.redirect_url ||
//       response?.checkoutPageUrl;

//     if (!paymentUrl) {
//       await Order.findOneAndUpdate(
//         { merchantOrderId },
//         {
//           status: "FAILED",
//           "paymentProviderData.createResponse": response,
//         }
//       );

//       return res.status(502).json({
//         error: "Invalid SDK response",
//       });
//     }

//     await Order.findOneAndUpdate(
//       { merchantOrderId },
//       {
//         status: "PENDING",
//         "paymentProviderData.createResponse": response,
//       }
//     );

//     res.status(201).json({ paymentUrl, merchantOrderId });
//   } catch (err) {
//     res.status(500).json({
//       error: "Error creating order",
//       details: err?.message,
//     });
//   }
// });

// /* -----------------------------------------
//     PHONEPE CALLBACK HANDLER (WEBHOOK)
// ------------------------------------------ */
// router.post("/phonepe-callback", async (req, res) => {
//   try {
//     if (!verifyPhonePeSignature(req)) {
//       return res.status(400).json({ error: "invalid signature" });
//     }

//     const payload = req.body ?? {};

//     const merchantOrderId =
//       payload.merchantOrderId ||
//       payload.data?.merchantOrderId ||
//       payload.orderId;

//     const status = (payload.status || payload.data?.status || "")
//       .toString()
//       .toUpperCase();

//     if (!merchantOrderId) {
//       return res.status(400).json({ error: "missing merchantOrderId" });
//     }

//     const order = await Order.findOne({ merchantOrderId });

//     if (!order) {
//       return res.status(404).json({ error: "order not found" });
//     }

//     order.paymentProviderData.lastCallback = payload;

//     // SUCCESS CASE
//     if (["SUCCESS", "COMPLETED", "PAID"].includes(status)) {
//       if (order.status !== "SUCCESS") {
//         order.status = "SUCCESS";
//         order.jobId = merchantOrderId;
//         order.generatedJobId = merchantOrderId;
//         await order.save();
//       }

//       const candidate = order.userId
//         ? await Candidate.findById(order.userId)
//         : null;

//       await PaidCandidate.create({
//         candidateId: order.userId,
//         name: candidate?.name,
//         email: candidate?.email,
//         contact: candidate?.contact,
//         merchantOrderId,
//         jobId: merchantOrderId,
//         amountPaise: order.amountPaise,
//         status: "SUCCESS",
//         paidAt: new Date(),
//       });

//       return res.status(200).json({ ok: true });
//     }

//     // FAILED CASE
//     if (["FAILED", "DECLINED", "CANCELLED"].includes(status)) {
//       order.status = "FAILED";
//       await order.save();
//       return res.status(200).json({ ok: true });
//     }

//     // UNKNOWN → Keep pending
//     order.status = "PENDING";
//     await order.save();
//     return res.status(200).json({ ok: true });

//   } catch (err) {
//     res.status(500).json({
//       error: "callback processing error",
//       details: err?.message,
//     });
//   }
// });

// export default router;




// import express from "express";
// import dotenv from "dotenv";
// import {
//   StandardCheckoutClient,
//   Env,
//   StandardCheckoutPayRequest,
// } from "pg-sdk-node";
// import Order from "../models/Order.js";
// import Candidate from "../models/Candidate.js";
// import PaidCandidate from "../models/PaidCandidate.js";   // ⭐ NEW
// import { generateJobID } from "../utils/generateJobId.js";

// dotenv.config();

// const router = express.Router();

// // Required envs
// const clientID = process.env.CLIENT_ID;
// const clientSecret = process.env.CLIENT_SECRET;
// const clientVersion = 1;
// const SDK_ENV =
//   process.env.NODE_ENV === "production" ? Env.PRODUCTION : Env.SANDBOX;

// // Initialize SDK client safely
// let client = null;
// try {
//   if (clientID && clientSecret) {
//     client = StandardCheckoutClient.getInstance(
//       clientID,
//       clientSecret,
//       clientVersion,
//       SDK_ENV
//     );
//   } else {
//     console.warn(
//       "PhonePe SDK client not initialized because CLIENT_ID or CLIENT_SECRET missing."
//     );
//   }
// } catch (e) {
//   console.error("Failed to initialize PhonePe SDK client:", e);
//   client = null;
// }

// // Helper: convert rupees → paise
// function toPaise(amountOrPaise) {
//   if (amountOrPaise === undefined || amountOrPaise === null) return null;
//   const n = Number(amountOrPaise);
//   if (!Number.isFinite(n) || n <= 0) return null;
//   return Math.round(n * 100);
// }

// // Dummy signature verify
// function verifyPhonePeSignature(req) {
//   return true; // testing
// }

// /* -----------------------------------------
//    CREATE ORDER (MerchantOrderId = KBTS-101)
// ------------------------------------------ */
// router.post("/create-order", async (req, res) => {
//   try {
//     const { amount, amountPaise, title } = req.body ?? {};

//     if (!client) {
//       return res.status(500).json({ error: "Payment provider not configured" });
//     }

//     let paise =
//       amountPaise !== undefined && amountPaise !== null
//         ? Number(amountPaise)
//         : toPaise(amount);

//     if (!paise) {
//       return res.status(400).json({
//         error: "Invalid amount. Send 'amount' (rupees) or 'amountPaise' (integer).",
//       });
//     }

//     // 👉 Generate SAME ID for merchantOrderId + jobId
//     const merchantOrderId = await generateJobID("KBTS");

//     const frontBase = (process.env.FRONTEND_BASE || "http://localhost:5173").replace(/\/$/, "");
//     const serverBase = (
//       process.env.SERVER_BASE ||
//       `http://localhost:${process.env.PORT || 5000}`
//     ).replace(/\/$/, "");

//     const redirectUrl = `${frontBase}/payment-result?merchantOrderId=${merchantOrderId}`;
//     const callbackUrl = `${serverBase}/phonepe-callback`;

//     // Create order in DB
//     const order = new Order({
//       merchantOrderId,
//       generatedJobId: merchantOrderId,
//       jobId: null,
//       userId: req.user?._id || null, // candidate user ID
//       amountPaise: paise,
//       status: "CREATED",
//       paymentProviderData: { requestedAt: new Date(), title },
//     });

//     await order.save();

//     // Build PhonePe request
//     const builder = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(paise)
//       .redirectUrl(redirectUrl);

//     if (title && typeof builder.orderNote === "function") {
//       try {
//         builder.orderNote(title);
//       } catch {}
//     }

//     const request = builder.build();

//     let response;
//     try {
//       response = await client.pay(request);
//     } catch (sdkErr) {
//       await Order.findOneAndUpdate(
//         { merchantOrderId },
//         {
//           status: "FAILED",
//           "paymentProviderData.createError": sdkErr?.message || String(sdkErr),
//         }
//       );
//       return res.status(502).json({
//         error: "Payment provider error",
//         details: sdkErr?.message,
//       });
//     }

//     const paymentUrl =
//       response?.redirectUrl ||
//       response?.redirect_url ||
//       response?.checkoutPageUrl;

//     if (!paymentUrl) {
//       await Order.findOneAndUpdate(
//         { merchantOrderId },
//         {
//           status: "FAILED",
//           "paymentProviderData.createResponse": response,
//         }
//       );
//       return res.status(502).json({
//         error: "Failed to create checkout session",
//         details: "unexpected SDK response",
//       });
//     }

//     await Order.findOneAndUpdate(
//       { merchantOrderId },
//       {
//         status: "PENDING",
//         "paymentProviderData.createResponse": response,
//       }
//     );

//     return res.status(201).json({ paymentUrl, merchantOrderId });
//   } catch (err) {
//     return res.status(500).json({
//       error: "Error creating order",
//       details: err?.message,
//     });
//   }
// });

// /* -----------------------------------------
//     PAYMENT CALLBACK — JobId = MerchantOrderId
// ------------------------------------------ */
// router.post("/phonepe-callback", async (req, res) => {
//   try {
//     if (!verifyPhonePeSignature(req)) {
//       return res.status(400).json({ error: "invalid signature" });
//     }

//     const payload = req.body ?? {};
//     const merchantOrderId =
//       payload.merchantOrderId ||
//       payload.data?.merchantOrderId ||
//       payload.orderId;

//     const status = (payload.status || payload.data?.status || "")
//       .toString()
//       .toUpperCase();

//     if (!merchantOrderId) {
//       return res.status(400).json({ error: "missing merchantOrderId" });
//     }

//     const order = await Order.findOne({ merchantOrderId });

//     if (!order) {
//       return res.status(404).json({ error: "order not found" });
//     }

//     order.paymentProviderData.lastCallback = payload;

//     // SUCCESS CASE
//     if (["SUCCESS", "COMPLETED", "PAID"].includes(status)) {

//       // 🟢 Update order
//       if (order.status !== "SUCCESS") {
//         order.status = "SUCCESS";
//         order.jobId = merchantOrderId;
//         order.generatedJobId = merchantOrderId;
//         await order.save();
//       }

//       // 🟢 Fetch candidate info
//       const candidate = order.userId
//         ? await Candidate.findById(order.userId)
//         : null;

//       // 🟢 Insert into PaidCandidate collection
//       await PaidCandidate.create({
//         candidateId: order.userId,
//         name: candidate?.name,
//         email: candidate?.email,
//         contact: candidate?.contact,

//         merchantOrderId,
//         jobId: merchantOrderId,
//         amountPaise: order.amountPaise,

//         status: "SUCCESS",
//         paidAt: new Date(),
//       });

//       return res.status(200).json({ ok: true, jobId: merchantOrderId });
//     }

//     // FAILED CASE
//     if (["FAILED", "DECLINED", "CANCELLED"].includes(status)) {
//       order.status = "FAILED";
//       await order.save();
//       return res.status(200).json({ ok: true });
//     }

//     // UNKNOWN STATUS
//     order.status = "PENDING";
//     await order.save();
//     return res.status(200).json({ ok: true });

//   } catch (err) {
//     return res.status(500).json({
//       error: "callback processing error",
//       details: err?.message,
//     });
//   }
// });

// export default router;




// import express from "express";
// import dotenv from "dotenv";
// import {
//   StandardCheckoutClient,
//   Env,
//   StandardCheckoutPayRequest,
// } from "pg-sdk-node";
// import Order from "../models/Order.js";
// import { generateJobID } from "../utils/generateJobId.js";

// dotenv.config();

// const router = express.Router();

// // Required envs
// const clientID = process.env.CLIENT_ID;
// const clientSecret = process.env.CLIENT_SECRET;
// const clientVersion = 1;
// const SDK_ENV =
//   process.env.NODE_ENV === "production" ? Env.PRODUCTION : Env.SANDBOX;

// // Initialize SDK client safely
// let client = null;
// try {
//   if (clientID && clientSecret) {
//     client = StandardCheckoutClient.getInstance(
//       clientID,
//       clientSecret,
//       clientVersion,
//       SDK_ENV
//     );
//   } else {
//     console.warn(
//       "PhonePe SDK client not initialized because CLIENT_ID or CLIENT_SECRET missing."
//     );
//   }
// } catch (e) {
//   console.error("Failed to initialize PhonePe SDK client:", e);
//   client = null;
// }

// // Helper: convert rupees → paise
// function toPaise(amountOrPaise) {
//   if (amountOrPaise === undefined || amountOrPaise === null) return null;
//   const n = Number(amountOrPaise);
//   if (!Number.isFinite(n) || n <= 0) return null;
//   return Math.round(n * 100);
// }

// // Dummy signature verify
// function verifyPhonePeSignature(req) {
//   return true; // testing
// }

// /* -----------------------------------------
//    CREATE ORDER (MerchantOrderId = KBTS-101)
// ------------------------------------------ */
// router.post("/create-order", async (req, res) => {
//   try {
//     const { amount, amountPaise, title } = req.body ?? {};

//     if (!client) {
//       return res
//         .status(500)
//         .json({ error: "Payment provider not configured" });
//     }

//     let paise =
//       amountPaise !== undefined && amountPaise !== null
//         ? Number(amountPaise)
//         : toPaise(amount);

//     if (!paise) {
//       return res.status(400).json({
//         error:
//           "Invalid amount. Send 'amount' (rupees) or 'amountPaise' (integer).",
//       });
//     }

//     // 👉 Generate SAME ID for merchantOrderId + jobId
//     const merchantOrderId = await generateJobID("KBTS");

//     const frontBase = (process.env.FRONTEND_BASE || "http://localhost:5173").replace(
//       /\/$/,
//       ""
//     );
//     const serverBase = (
//       process.env.SERVER_BASE ||
//       `http://localhost:${process.env.PORT || 5000}`
//     ).replace(/\/$/, "");

//     const redirectUrl = `${frontBase}/payment-result?merchantOrderId=${merchantOrderId}`;
//     const callbackUrl = `${serverBase}/phonepe-callback`;

//     // Create order in DB
//     const order = new Order({
//       merchantOrderId,
//       generatedJobId: merchantOrderId,
//       jobId: null,
//        userId: req.user?._id || null,   // <=== IMPORTANT NEW LINE
//       amountPaise: paise,
//       status: "CREATED",
//       paymentProviderData: { requestedAt: new Date(), title },
//     });

//     await order.save();

//     // Build PhonePe request
//     const builder = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(paise)
//       .redirectUrl(redirectUrl);

//     if (title && typeof builder.orderNote === "function") {
//       try {
//         builder.orderNote(title);
//       } catch {}
//     }

//     const request = builder.build();

//     let response;
//     try {
//       response = await client.pay(request);
//     } catch (sdkErr) {
//       await Order.findOneAndUpdate(
//         { merchantOrderId },
//         {
//           status: "FAILED",
//           "paymentProviderData.createError":
//             sdkErr?.message || String(sdkErr),
//         }
//       );
//       return res
//         .status(502)
//         .json({ error: "Payment provider error", details: sdkErr?.message });
//     }

//     const paymentUrl =
//       response?.redirectUrl ||
//       response?.redirect_url ||
//       response?.checkoutPageUrl;

//     if (!paymentUrl) {
//       await Order.findOneAndUpdate(
//         { merchantOrderId },
//         {
//           status: "FAILED",
//           "paymentProviderData.createResponse": response,
//         }
//       );
//       return res.status(502).json({
//         error: "Failed to create checkout session",
//         details: "unexpected SDK response",
//       });
//     }

//     await Order.findOneAndUpdate(
//       { merchantOrderId },
//       {
//         status: "PENDING",
//         "paymentProviderData.createResponse": response,
//       }
//     );

//     return res.status(201).json({ paymentUrl, merchantOrderId });
//   } catch (err) {
//     return res.status(500).json({
//       error: "Error creating order",
//       details: err?.message,
//     });
//   }
// });

// /* -----------------------------------------
//     PAYMENT CALLBACK — JobId = MerchantOrderId
// ------------------------------------------ */
// router.post("/phonepe-callback", async (req, res) => {
//   try {
//     if (!verifyPhonePeSignature(req)) {
//       return res.status(400).json({ error: "invalid signature" });
//     }

//     const payload = req.body ?? {};
//     const merchantOrderId =
//       payload.merchantOrderId ||
//       payload.data?.merchantOrderId ||
//       payload.orderId;

//     const status = (payload.status || payload.data?.status || "")
//       .toString()
//       .toUpperCase();

//     if (!merchantOrderId) {
//       return res.status(400).json({ error: "missing merchantOrderId" });
//     }

//     const order = await Order.findOne({ merchantOrderId });

//     if (!order) {
//       return res.status(404).json({ error: "order not found" });
//     }

//     order.paymentProviderData.lastCallback = payload;

//     // SUCCESS CASE
//     if (["SUCCESS", "COMPLETED", "PAID"].includes(status)) {
//       if (order.status !== "SUCCESS") {
//         order.status = "SUCCESS";

//         // 👉 JOB ID = MERCHANT ORDER ID
//         order.jobId = merchantOrderId;
//         order.generatedJobId = merchantOrderId;
//       }

//       await order.save();
//       return res.status(200).json({ ok: true, jobId: merchantOrderId });
//     }

//     // FAILED CASE
//     if (["FAILED", "DECLINED", "CANCELLED"].includes(status)) {
//       order.status = "FAILED";
//       await order.save();
//       return res.status(200).json({ ok: true });
//     }

//     // UNKNOWN STATUS
//     order.status = "PENDING";
//     await order.save();
//     return res.status(200).json({ ok: true });
//   } catch (err) {
//     return res.status(500).json({
//       error: "callback processing error",
//       details: err?.message,
//     });
//   }
// });

// export default router;








// // backend/routes/paymentRoutes.js
// import express from "express";
// import { randomUUID } from "crypto";
// import dotenv from "dotenv";
// import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from "pg-sdk-node";
// import Order from "../models/Order.js";
// import Job from "../models/UserJob.js";
// import { generateJobID } from "../utils/generateJobId.js";

// dotenv.config();

// const router = express.Router();

// // Required envs
// const clientID = process.env.CLIENT_ID;
// const clientSecret = process.env.CLIENT_SECRET;
// const clientVersion = 1;
// const SDK_ENV = (process.env.NODE_ENV === "production") ? Env.PRODUCTION : Env.SANDBOX;

// // Basic env check
// if (!clientID || !clientSecret) {
//   console.error("Missing CLIENT_ID or CLIENT_SECRET in env. Payment routes will fail until these are provided.");
// }

// // Initialize SDK client safely
// let client = null;
// try {
//   if (clientID && clientSecret) {
//     client = StandardCheckoutClient.getInstance(clientID, clientSecret, clientVersion, SDK_ENV);
//   } else {
//     console.warn("PhonePe SDK client not initialized because credentials are missing.");
//   }
// } catch (e) {
//   console.error("Failed to initialize PhonePe SDK client:", e);
//   client = null;
// }

// // Helper: convert rupees -> paise
// function toPaiseFromInput(amountOrPaise) {
//   if (amountOrPaise === undefined || amountOrPaise === null) return null;
//   const n = Number(amountOrPaise);
//   if (!Number.isFinite(n) || n <= 0) return null;
//   return Math.round(n * 100);
// }

// /**
//  * NOTE: Replace/implement this with actual provider signature verification.
//  * Example: verify HMAC header vs. payload using a secret.
//  */
// function verifyPhonePeSignature(req) {
//   // TODO: implement real verification using provider docs
//   // For now return true to allow local testing
//   return true;
// }

// router.post("/create-order", async (req, res) => {
//   try {
//     const { amount, amountPaise, jobId: clientProvidedJobId, title } = req.body ?? {};

//     if (!client) {
//       console.error("PhonePe SDK client not available (missing credentials).");
//       return res.status(500).json({ error: "Payment provider not configured" });
//     }

//     // Validate amounts
//     let paise;
//     if (amountPaise !== undefined && amountPaise !== null) {
//       const n = Number(amountPaise);
//       if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
//         return res.status(400).json({ error: "Invalid amountPaise" });
//       }
//       paise = n;
//     } else {
//       paise = toPaiseFromInput(amount);
//       if (!paise) {
//         return res.status(400).json({ error: "Invalid amount. Send 'amount' in rupees (e.g. 99.50) or 'amountPaise' as integer." });
//       }
//     }

//     const merchantOrderId = randomUUID();
//     const frontBase = (process.env.FRONTEND_BASE || "http://localhost:5173").replace(/\/$/, "");
//     const serverBase = (process.env.SERVER_BASE || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, "");

//     const redirectUrl = `${frontBase}/payment-result?merchantOrderId=${merchantOrderId}`;
//     const callbackUrl = `${serverBase}/phonepe-callback`;

//     // Persist order with status CREATED
//     const order = new Order({
//       merchantOrderId,
//       amountPaise: paise,
//       status: "CREATED",
//       paymentProviderData: { requestedAt: new Date(), title }
//     });
//     await order.save();

//     // Build request
//     const builder = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(paise)
//       .redirectUrl(redirectUrl);
//     if (title && typeof builder.orderNote === "function") {
//       try { builder.orderNote(title); } catch (e) { /* ignore */ }
//     }
//     // builder.callbackUrl(callbackUrl) // if SDK supports it

//     const request = builder.build();

//     let response;
//     try {
//       response = await client.pay(request);
//     } catch (sdkErr) {
//       console.error("PhonePe SDK call failed:", sdkErr?.message || sdkErr);
//       // Mark order as FAILED (optional)
//       await Order.findOneAndUpdate({ merchantOrderId }, { status: "FAILED", "paymentProviderData.createError": sdkErr?.message || String(sdkErr) });
//       if (sdkErr?.response) {
//         console.error("PhonePe response status:", sdkErr.response.status);
//         try {
//           console.error("PhonePe response body:", JSON.stringify(sdkErr.response.data, null, 2));
//         } catch (e) {
//           console.error("PhonePe response body (raw):", sdkErr.response.data);
//         }
//       }
//       return res.status(502).json({ error: "Payment provider error", details: sdkErr?.message || null });
//     }

//     const paymentUrl = response?.redirectUrl || response?.redirect_url || response?.checkoutPageUrl || null;
//     if (!paymentUrl) {
//       console.error("PhonePe SDK returned unexpected response while creating order:", response);
//       // update order
//       await Order.findOneAndUpdate({ merchantOrderId }, { status: "FAILED", "paymentProviderData.createResponse": response });
//       return res.status(502).json({ error: "Failed to create checkout session", details: "unexpected SDK response" });
//     }

//     // Save provider response into order
//     await Order.findOneAndUpdate({ merchantOrderId }, { status: "PENDING", $set: { "paymentProviderData.createResponse": response } });

//     return res.status(201).json({ paymentUrl, merchantOrderId });
//   } catch (err) {
//     console.error("Unhandled create-order error:", err?.message || err);
//     if (err?.stack) console.error(err.stack);
//     return res.status(500).json({ error: "Error creating order", details: err?.message || null });
//   }
// });

// /**
//  * Provider callback / webhook endpoint
//  * PhonePe will POST payment result / webhook here.
//  * Make sure provider is configured to call this endpoint (callbackUrl)
//  */
// router.post("/phonepe-callback", async (req, res) => {
//   try {
//     // Verify signature / authenticity
//     if (!verifyPhonePeSignature(req)) {
//       console.warn("PhonePe callback signature verification failed");
//       return res.status(400).json({ error: "invalid signature" });
//     }

//     const payload = req.body ?? {};
//     // Inspect payload shape from PhonePe docs; example fields:
//     // { merchantOrderId, status, transactionId, amount, ... }
//     const merchantOrderId = payload.merchantOrderId || payload.data?.merchantOrderId || payload.orderId || null;
//     const status = (payload.status || payload.data?.status || "").toString().toUpperCase();

//     if (!merchantOrderId) {
//       console.warn("Callback missing merchantOrderId:", payload);
//       return res.status(400).json({ error: "missing merchantOrderId" });
//     }

//     const order = await Order.findOne({ merchantOrderId });
//     if (!order) {
//       console.warn("Order not found for merchantOrderId:", merchantOrderId);
//       // still respond 200 to avoid retries, or 400? Many providers expect 200.
//       return res.status(404).json({ error: "order not found" });
//     }

//     // Save raw provider payload (for audit)
//     order.paymentProviderData = order.paymentProviderData || {};
//     order.paymentProviderData.lastCallback = payload;

//     // Example mapping: provider might use "SUCCESS", "FAILED", "CANCELLED", etc.
//     if (status === "SUCCESS" || status === "COMPLETED" || status === "PAID") {
//       // If already succeeded skip duplicate processing
//       if (order.status === "SUCCESS") {
//         console.info("Callback received for already-successful order:", merchantOrderId);
//         await order.save();
//         return res.status(200).json({ ok: true });
//       }

//       // Generate job ID (atomic via counter)
//       const jobId = await generateJobID("KBTS");

//       // Create the job
//       const job = new Job({
//         jobId,
//         orderId: order._id,
//         amountPaise: order.amountPaise,
//         meta: { providerTransaction: payload }
//       });
//       await job.save();

//       // Update order
//       order.status = "SUCCESS";
//       order.jobId = jobId;
//       await order.save();

//       // TODO: notify user, send email, push notification, etc.

//       return res.status(200).json({ ok: true, jobId });
//     } else if (status === "FAILED" || status === "DECLINED" || status === "CANCELLED") {
//       order.status = "FAILED";
//       await order.save();
//       return res.status(200).json({ ok: true });
//     } else {
//       // Unknown/other statuses: mark PENDING and store raw
//       order.status = "PENDING";
//       await order.save();
//       return res.status(200).json({ ok: true });
//     }
//   } catch (err) {
//     console.error("Error handling phonepe-callback:", err);
//     return res.status(500).json({ error: "callback processing error", details: err?.message || null });
//   }
// });

// export default router;



// // backend/routes/paymentRoutes.js
// import express from "express";
// import { randomUUID } from "crypto";
// import dotenv from "dotenv";
// import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from "pg-sdk-node";

// dotenv.config();

// const router = express.Router();

// // Required envs
// const clientID = process.env.CLIENT_ID;
// const clientSecret = process.env.CLIENT_SECRET;
// const clientVersion = 1;
// const SDK_ENV = (process.env.NODE_ENV === "production") ? Env.PRODUCTION : Env.SANDBOX;

// // Basic env check
// if (!clientID || !clientSecret) {
//   console.error("Missing CLIENT_ID or CLIENT_SECRET in env. Payment routes will fail until these are provided.");
// }

// // Initialize SDK client safely
// let client = null;
// try {
//   if (clientID && clientSecret) {
//     client = StandardCheckoutClient.getInstance(clientID, clientSecret, clientVersion, SDK_ENV);
//   } else {
//     console.warn("PhonePe SDK client not initialized because credentials are missing.");
//   }
// } catch (e) {
//   console.error("Failed to initialize PhonePe SDK client:", e);
//   client = null;
// }

// // Helper: convert rupees -> paise
// function toPaiseFromInput(amountOrPaise) {
//   if (amountOrPaise === undefined || amountOrPaise === null) return null;
//   const n = Number(amountOrPaise);
//   if (!Number.isFinite(n) || n <= 0) return null;
//   return Math.round(n * 100);
// }

// router.post("/create-order", async (req, res) => {
//   try {
//     // Ensure body parser enabled in main app: app.use(express.json())
//     const { amount, amountPaise, jobId, title } = req.body ?? {};

//     // Validate presence of SDK client
//     if (!client) {
//       console.error("PhonePe SDK client not available (missing credentials).");
//       return res.status(500).json({ error: "Payment provider not configured" });
//     }

//     // Validate amounts
//     let paise;
//     if (amountPaise !== undefined && amountPaise !== null) {
//       const n = Number(amountPaise);
//       if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
//         return res.status(400).json({ error: "Invalid amountPaise" });
//       }
//       paise = n;
//     } else {
//       paise = toPaiseFromInput(amount);
//       if (!paise) {
//         return res.status(400).json({ error: "Invalid amount. Send 'amount' in rupees (e.g. 99.50) or 'amountPaise' as integer." });
//       }
//     }

//     // merchantOrderId and URLs
//     const merchantOrderId = randomUUID();
//     const frontBase = (process.env.FRONTEND_BASE || "http://localhost:5173").replace(/\/$/, "");
//     // Use SERVER_BASE (not REACT_APP...); fallback to current host
//     const serverBase = (process.env.SERVER_BASE || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, "");

//     const redirectUrl = `${frontBase}/payment-result?merchantOrderId=${merchantOrderId}`;
//     const callbackUrl = `${serverBase}/phonepe-callback`;

//     // TODO: Persist order to DB with status CREATED before calling PhonePe
//     // await db.insertOrder({ merchantOrderId, jobId, amountPaise: paise, status: 'CREATED', createdAt: new Date() });

//     // Build request
//     const builder = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(paise)
//       .redirectUrl(redirectUrl);
//     // optionally: builder.callbackUrl(callbackUrl) if SDK supports it

//     // Add optional fields safely if builder supports them
//     if (title && typeof builder.orderNote === "function") {
//       try { builder.orderNote(title); } catch (e) { /* ignore if not supported */ }
//     }

//     const request = builder.build();

//     // Call PhonePe
//     let response;
//     try {
//       response = await client.pay(request);
//     } catch (sdkErr) {
//       console.error("PhonePe SDK call failed:", sdkErr?.message || sdkErr);
//       // If axios-like error, log response details safely
//       if (sdkErr?.response) {
//         console.error("PhonePe response status:", sdkErr.response.status);
//         console.error("PhonePe response headers:", sdkErr.response.headers);
//         try {
//           console.error("PhonePe response body:", JSON.stringify(sdkErr.response.data, null, 2));
//         } catch (e) {
//           console.error("PhonePe response body (raw):", sdkErr.response.data);
//         }
//       }
//       return res.status(502).json({ error: "Payment provider error", details: sdkErr?.message || null });
//     }

//     const paymentUrl = response?.redirectUrl || response?.redirect_url || response?.checkoutPageUrl || null;
//     if (!paymentUrl) {
//       console.error("PhonePe SDK returned unexpected response while creating order:", response);
//       return res.status(502).json({ error: "Failed to create checkout session", details: "unexpected SDK response" });
//     }

//     // success
//     return res.status(201).json({ paymentUrl, merchantOrderId });
//   } catch (err) {
//     // last-resort error logging
//     console.error("Unhandled create-order error:", err?.message || err);
//     if (err?.stack) console.error(err.stack);
//     // avoid leaking secrets to client
//     return res.status(500).json({ error: "Error creating order", details: err?.message || null });
//   }
// });

// export default router;


// // backend/routes/paymentRoutes.js
// import express from "express";
// import { randomUUID } from "crypto";
// import dotenv from "dotenv";
// import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from "pg-sdk-node";

// dotenv.config();

// const router = express.Router();

// // Validate required env early (will throw if missing)
// const clientID = process.env.CLIENT_ID;
// const clientSecret = process.env.CLIENT_SECRET;
// const clientVersion = 1;
// const SDK_ENV = (process.env.NODE_ENV === "production") ? Env.PRODUCTION : Env.SANDBOX;

// if (!clientID || !clientSecret) {
//   console.error("Missing CLIENT_ID or CLIENT_SECRET in env. Payment routes will fail until these are provided.");
// }

// // Init PhonePe SDK client
// const client = StandardCheckoutClient.getInstance(clientID, clientSecret, clientVersion, SDK_ENV);

// // Helper: convert rupees -> paise (canonical server-side)
// function toPaiseFromInput(amountOrPaise) {
//   // Accept either:
//   //  - { amount: 99.50 }  -> rupees (float)  OR
//   //  - { amountPaise: 9950 } -> paise (int)
//   if (amountOrPaise === undefined || amountOrPaise === null) return null;
//   const n = Number(amountOrPaise);
//   if (!Number.isFinite(n) || n <= 0) return null;
//   // Heuristic: If value is integer and small (< 1000000), treat as rupees (e.g., 1100 => ₹1100).
//   // But we will assume caller sends rupees normally. Always convert rupees -> paise by multiplying by 100.
//   // If you want to support raw paise field, use 'amountPaise' in body and handle explicitly.
//   return Math.round(n * 100);
// }

// // Create order route
// router.post("/create-order", async (req, res) => {
//   try {
//     // Expect body: { amount: 99.50, currency: "INR", jobId?, title? }
//     const { amount, amountPaise, jobId, title } = req.body;

//     // Accept either explicit amountPaise OR amount (rupees). Prefer explicit paise if provided.
//     let paise;
//     if (amountPaise !== undefined && amountPaise !== null) {
//       const n = Number(amountPaise);
//       if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
//         return res.status(400).json({ error: "Invalid amountPaise" });
//       }
//       paise = n;
//     } else {
//       paise = toPaiseFromInput(amount);
//       if (!paise) return res.status(400).json({ error: "Invalid amount. Send 'amount' in rupees (e.g. 99.50) or 'amountPaise' as integer." });
//     }

//     // Create unique merchantOrderId and build redirect/callback URLs from env (use HTTPS in prod)
//     const merchantOrderId = randomUUID();
//     const frontBase = process.env.FRONTEND_BASE || "http://localhost:5173";
//     const serverBase = process.env.REACT_APP_API_URL || `http://localhost:${process.env.PORT || 5000}`;

//     const redirectUrl = `${frontBase.replace(/\/$/, "")}/payment-result?merchantOrderId=${merchantOrderId}`;
//     const callbackUrl = `${serverBase.replace(/\/$/, "")}/phonepe-callback`;

//     // TODO: Persist order to DB with status CREATED before calling PhonePe (important for reconciliation)
//     // await db.insertOrder({ merchantOrderId, jobId, amountPaise: paise, status: 'CREATED', createdAt: new Date() });

//     // Build PhonePe SDK request (amount must be in paise)
//     const request = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(paise)
//       .redirectUrl(redirectUrl)
//       // .callbackUrl(callbackUrl) // uncomment if SDK supports callbackUrl property and you want PhonePe to POST callbacks
//       .build();

//     // Call PhonePe
//     const response = await client.pay(request);

//     // SDK may return redirectUrl or redirect_url depending on version
//     const paymentUrl = response?.redirectUrl || response?.redirect_url || response?.checkoutPageUrl || null;
//     if (!paymentUrl) {
//       console.error("PhonePe SDK returned unexpected response while creating order:", response);
//       return res.status(500).json({ error: "Failed to create checkout session" });
//     }

//     // Return consistent shape to frontend
//     return res.json({ paymentUrl, merchantOrderId });
//   } catch (err) {
//     // Log verbose details to diagnose 400 responses from PhonePe
//     console.error("Error creating order:", err);
//     // If SDK throws an axios-like error with response body, print it
//     if (err?.response) {
//       console.error("PhonePe status:", err.response.status);
//       console.error("PhonePe headers:", err.response.headers);
//       console.error("PhonePe body:", JSON.stringify(err.response.data, null, 2));
//     } else if (err?.message) {
//       console.error("Error message:", err.message);
//     }
//     return res.status(500).json({ error: "Error creating order", details: err?.message || String(err) });
//   }
// });

// export default router;


// // backend/routes/paymentRoutes.js
// import express from "express";
// import { randomUUID } from "crypto";
// import dotenv from "dotenv";
// import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from "pg-sdk-node";

// dotenv.config();

// const router = express.Router();

// // Validate required env early (will throw if missing)
// const clientID = process.env.CLIENT_ID;
// const clientSecret = process.env.CLIENT_SECRET;
// const clientVersion = 1;
// const SDK_ENV = (process.env.NODE_ENV === "production") ? Env.PRODUCTION : Env.SANDBOX;

// if (!clientID || !clientSecret) {
//   console.error("Missing CLIENT_ID or CLIENT_SECRET in env. Payment routes will fail until these are provided.");
// }

// // Init PhonePe SDK client
// const client = StandardCheckoutClient.getInstance(clientID, clientSecret, clientVersion, SDK_ENV);

// /**
//  * Convert input to paise (integer) with safe handling:
//  * - Prefer explicit `amountPaise` if provided.
//  * - If `amount` is provided:
//  *    - If it looks like paise (integer, divisible by 100, >= 100), treat it as paise (assume caller sent paise).
//  *    - Otherwise treat it as rupees (decimal allowed) and convert rupees -> paise by multiplying 100.
//  *
//  * This auto-detection avoids the common double-*100 bug while remaining forgiving for callers.
//  */
// function toPaiseFromInput(amountOrPaise) {
//   if (amountOrPaise === undefined || amountOrPaise === null) return null;
//   const n = Number(amountOrPaise);
//   if (!Number.isFinite(n) || n <= 0) return null;

//   // If caller passed an integer that looks exactly like paise (divisible by 100 and reasonably large),
//   // assume they passed paise and return as-is to avoid double-multiplication.
//   if (Number.isInteger(n) && n % 100 === 0 && n >= 100) {
//     // Example: 9950 -> treat as 9950 paise (₹99.50)
//     return n;
//   }

//   // Otherwise treat input as rupees (may be decimal) and convert to paise
//   return Math.round(n * 100);
// }

// // Create order route
// router.post("/create-order", async (req, res) => {
//   try {
//     // Debug log: incoming body to detect rupees vs paise early
//     console.log("CREATE-ORDER body:", JSON.stringify(req.body));

//     // Expect body: { amount: 99.50, currency: "INR", jobId?, title? } OR { amountPaise: 9950, ... }
//     const { amount, amountPaise, jobId, title } = req.body;

//     // Accept either explicit amountPaise OR amount (rupees or paise-like). Prefer explicit paise if provided.
//     let paise;
//     if (amountPaise !== undefined && amountPaise !== null) {
//       const n = Number(amountPaise);
//       if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
//         return res.status(400).json({ error: "Invalid amountPaise. Provide paise as integer (e.g. 9950)." });
//       }
//       paise = n;
//     } else {
//       paise = toPaiseFromInput(amount);
//       if (!paise) {
//         return res.status(400).json({
//           error:
//             "Invalid amount. Send 'amount' in rupees (e.g. 99.50) OR send 'amountPaise' as integer (e.g. 9950).",
//         });
//       }
//     }

//     // At this point `paise` is an integer number of paise (safe to pass to PhonePe)
//     console.log("Computed amountPaise:", paise);

//     // Create unique merchantOrderId and build redirect/callback URLs from env (use HTTPS in prod)
//     const merchantOrderId = randomUUID();
//     const frontBase = process.env.FRONTEND_BASE || "http://localhost:5173";
//     const serverBase = process.env.SERVER_BASE || `http://localhost:${process.env.PORT || 5000}`;

//     const redirectUrl = `${frontBase.replace(/\/$/, "")}/payment-result?merchantOrderId=${merchantOrderId}`;
//     const callbackUrl = `${serverBase.replace(/\/$/, "")}/phonepe-callback`;

//     // TODO: Persist order to DB with status CREATED before calling PhonePe (important for reconciliation)
//     // await db.insertOrder({ merchantOrderId, jobId, amountPaise: paise, status: 'CREATED', createdAt: new Date() });

//     // Build PhonePe SDK request (amount must be in paise)
//     const request = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(merchantOrderId)
//       .amount(paise)
//       .redirectUrl(redirectUrl)
//       // .callbackUrl(callbackUrl) // uncomment if SDK supports callbackUrl property and you want PhonePe to POST callbacks
//       .build();

//     // Call PhonePe
//     const response = await client.pay(request);

//     // SDK may return redirectUrl or redirect_url depending on version
//     const paymentUrl = response?.redirectUrl || response?.redirect_url || response?.checkoutPageUrl || null;
//     if (!paymentUrl) {
//       console.error("PhonePe SDK returned unexpected response while creating order:", response);
//       return res.status(500).json({ error: "Failed to create checkout session" });
//     }

//     // Return consistent shape to frontend
//     return res.json({ paymentUrl, merchantOrderId });
//   } catch (err) {
//     // Log verbose details to diagnose 400 responses from PhonePe
//     console.error("Error creating order:", err);
//     // If SDK throws an axios-like error with response body, print it
//     if (err?.response) {
//       console.error("PhonePe status:", err.response.status);
//       console.error("PhonePe headers:", err.response.headers);
//       console.error("PhonePe body:", JSON.stringify(err.response.data, null, 2));
//     } else if (err?.message) {
//       console.error("Error message:", err.message);
//     }
//     return res.status(500).json({ error: "Error creating order", details: err?.message || String(err) });
//   }
// });

// export default router;
