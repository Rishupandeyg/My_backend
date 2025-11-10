// backend/routes/paymentRoutes.js
import express from "express";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from "pg-sdk-node";

dotenv.config();

const router = express.Router();

// Validate required env early (will throw if missing)
const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const clientVersion = 1;
const SDK_ENV = (process.env.NODE_ENV === "production") ? Env.PRODUCTION : Env.SANDBOX;

if (!clientID || !clientSecret) {
  console.error("Missing CLIENT_ID or CLIENT_SECRET in env. Payment routes will fail until these are provided.");
}

// Init PhonePe SDK client
const client = StandardCheckoutClient.getInstance(clientID, clientSecret, clientVersion, SDK_ENV);

// Helper: convert rupees -> paise (canonical server-side)
function toPaiseFromInput(amountOrPaise) {
  // Accept either:
  //  - { amount: 99.50 }  -> rupees (float)  OR
  //  - { amountPaise: 9950 } -> paise (int)
  if (amountOrPaise === undefined || amountOrPaise === null) return null;
  const n = Number(amountOrPaise);
  if (!Number.isFinite(n) || n <= 0) return null;
  // Heuristic: If value is integer and small (< 1000000), treat as rupees (e.g., 1100 => ₹1100).
  // But we will assume caller sends rupees normally. Always convert rupees -> paise by multiplying by 100.
  // If you want to support raw paise field, use 'amountPaise' in body and handle explicitly.
  return Math.round(n * 100);
}

// Create order route
router.post("/create-order", async (req, res) => {
  try {
    // Expect body: { amount: 99.50, currency: "INR", jobId?, title? }
    const { amount, amountPaise, jobId, title } = req.body;

    // Accept either explicit amountPaise OR amount (rupees). Prefer explicit paise if provided.
    let paise;
    if (amountPaise !== undefined && amountPaise !== null) {
      const n = Number(amountPaise);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
        return res.status(400).json({ error: "Invalid amountPaise" });
      }
      paise = n;
    } else {
      paise = toPaiseFromInput(amount);
      if (!paise) return res.status(400).json({ error: "Invalid amount. Send 'amount' in rupees (e.g. 99.50) or 'amountPaise' as integer." });
    }

    // Create unique merchantOrderId and build redirect/callback URLs from env (use HTTPS in prod)
    const merchantOrderId = randomUUID();
    const frontBase = process.env.FRONTEND_BASE || "http://localhost:5173";
    const serverBase = process.env.REACT_APP_API_URL || `http://localhost:${process.env.PORT || 5000}`;

    const redirectUrl = `${frontBase.replace(/\/$/, "")}/payment-result?merchantOrderId=${merchantOrderId}`;
    const callbackUrl = `${serverBase.replace(/\/$/, "")}/phonepe-callback`;

    // TODO: Persist order to DB with status CREATED before calling PhonePe (important for reconciliation)
    // await db.insertOrder({ merchantOrderId, jobId, amountPaise: paise, status: 'CREATED', createdAt: new Date() });

    // Build PhonePe SDK request (amount must be in paise)
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(paise)
      .redirectUrl(redirectUrl)
      // .callbackUrl(callbackUrl) // uncomment if SDK supports callbackUrl property and you want PhonePe to POST callbacks
      .build();

    // Call PhonePe
    const response = await client.pay(request);

    // SDK may return redirectUrl or redirect_url depending on version
    const paymentUrl = response?.redirectUrl || response?.redirect_url || response?.checkoutPageUrl || null;
    if (!paymentUrl) {
      console.error("PhonePe SDK returned unexpected response while creating order:", response);
      return res.status(500).json({ error: "Failed to create checkout session" });
    }

    // Return consistent shape to frontend
    return res.json({ paymentUrl, merchantOrderId });
  } catch (err) {
    // Log verbose details to diagnose 400 responses from PhonePe
    console.error("Error creating order:", err);
    // If SDK throws an axios-like error with response body, print it
    if (err?.response) {
      console.error("PhonePe status:", err.response.status);
      console.error("PhonePe headers:", err.response.headers);
      console.error("PhonePe body:", JSON.stringify(err.response.data, null, 2));
    } else if (err?.message) {
      console.error("Error message:", err.message);
    }
    return res.status(500).json({ error: "Error creating order", details: err?.message || String(err) });
  }
});

export default router;


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
