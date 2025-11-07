// backend/src/routes/paymentRoutes.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Simple in-memory token cache
let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  // return cached if valid for another 30s
  const now = Date.now();
  if (cachedToken && tokenExpiry - 30000 > now) return cachedToken;

  const url = process.env.PHONEPE_BASE_URL;
  if (!url) throw new Error("PHONEPE_BASE_URL not configured");

  const params = new URLSearchParams();
  params.append("client_id", process.env.PHONEPE_CLIENT_ID);
  params.append("client_secret", process.env.PHONEPE_SECRET);
  params.append("grant_type", "client_credentials");

  const resp = await axios.post(url, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    timeout: 15000,
  });

  const data = resp.data;
  if (!data?.access_token) throw new Error("no_access_token");

  cachedToken = data.access_token;
  // if response has expires_in (seconds), set expiry
  if (data.expires_in) tokenExpiry = Date.now() + Number(data.expires_in) * 1000;
  else tokenExpiry = Date.now() + 5 * 60 * 1000; // default 5m

  return cachedToken;
}

// Input validation helper
function validateCreateOrderBody(body) {
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) return "invalid_amount";
  if (!body.jobId) return "missing_jobId";
  return null;
}

router.post("/create-order", async (req, res) => {
  try {
    console.log("🔔 /create-order called - body:", { ...req.body, amount: req.body?.amount });

    // 1) required envs
    const needed = ["PHONEPE_CLIENT_ID","PHONEPE_SECRET","PHONEPE_BASE_URL","MERCHANT_ID","BASE_URL","PAYMENT_REDIRECT_URL"];
    const missing = needed.filter(k => !process.env[k]);
    if (missing.length) {
      console.error("❗ Missing env vars:", missing);
      return res.status(500).json({ error: "missing_env", missing });
    }

    // 2) validate request body
    const validationError = validateCreateOrderBody(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    // 3) get token (cached)
    let accessToken;
    try {
      accessToken = await getAccessToken();
      console.log("✅ token obtained (masked), merchantId:", process.env.MERCHANT_ID);
    } catch (err) {
      console.error("🚨 Token request failed:", err.message || err);
      return res.status(500).json({ step: "token", error: String(err.message || err) });
    }

    // 4) Build checkout payload (checkout/v2/pay)
    const { amount, jobId, title = "Job Application" } = req.body;
    // amount must be in paise (integer)
    const amountInt = Math.round(Number(amount));

    const merchantTransactionId = `TXN${Date.now()}_${Math.floor(Math.random()*9999)}`;

    const payload = {
      merchantId: process.env.MERCHANT_ID,
      merchantTransactionId,
      amount: amountInt,
      expireAfter: 1200,
      metaInfo: {
        jobId,
        title,
      },
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: `Payment for ${title}`,
        merchantUrls: {
          redirectUrl: process.env.PAYMENT_REDIRECT_URL
        }
      }
    };

    // 5) call checkout endpoint
    let payRes;
    try {
      const url = "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay";
      payRes = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      });
      console.log("✅ payRes.status:", payRes.status);
    } catch (err) {
      console.error("🚨 Pay API failed:", err.response?.status, err.response?.data || err.message);
      return res.status(500).json({ step: "pay", status: err.response?.status || null, error: err.response?.data || err.message });
    }

    // 6) parse redirect URL (checkout v2 returns instrumentResponse.redirectInfo.url)
    const redirectUrl = payRes.data?.data?.instrumentResponse?.redirectInfo?.url;
    if (!redirectUrl) {
      console.error("❌ No redirect url in payRes:", payRes.data);
      return res.status(500).json({ step: "pay", error: "no_redirect_url", payRes: payRes.data });
    }

    // Optionally persist the pending transaction to DB here (recommended)

    return res.json({ paymentUrl: redirectUrl, merchantTransactionId });
  } catch (err) {
    console.error("🔥 Unexpected error:", err);
    return res.status(500).json({ error: "unexpected", message: err?.message || String(err) });
  }
});

export default router;
