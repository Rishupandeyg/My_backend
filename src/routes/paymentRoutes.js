// backend/routes/paymentRoutes.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// In-memory token cache (simple)
let cachedToken = null;
let tokenExpiry = 0;

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

async function getAccessToken() {
  // reuse cached token if valid for >30s
  if (cachedToken && tokenExpiry - 30 > nowSeconds()) return cachedToken;

  const url = process.env.PHONEPE_BASE_URL;
  const body = {
    client_id: process.env.PHONEPE_CLIENT_ID,
    client_secret: process.env.PHONEPE_SECRET,
    grant_type: "client_credentials",
  };

  const res = await axios.post(url, body, { headers: { "Content-Type": "application/json" }, timeout: 15000 });
  const data = res.data;
  if (!data?.access_token) throw new Error("No access_token from PhonePe");
  cachedToken = data.access_token;
  tokenExpiry = nowSeconds() + (data.expires_in || 3600);
  return cachedToken;
}

router.post("/create-order", async (req, res) => {
  try {
    console.log("🔔 /create-order called with body:", req.body);

    // Validate envs
    const required = ["PHONEPE_CLIENT_ID","PHONEPE_SECRET","PHONEPE_BASE_URL","MERCHANT_ID","BASE_URL","PAYMENT_REDIRECT_URL"];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length) {
      console.error("❗ Missing env vars:", missing);
      return res.status(500).json({ message: "Server misconfigured - missing env vars", missing });
    }

    const { amount, jobId, title } = req.body;
    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ message: "amount (in paise) required" });
    }

    // 1) Get access token (cached)
    let accessToken;
    try {
      accessToken = await getAccessToken();
      console.log("✅ Obtained access token (len):", accessToken.length);
    } catch (err) {
      console.error("🚨 Token error:", err.response?.data || err.message);
      return res.status(500).json({ step: "token", error: err.response?.data || err.message });
    }

    // 2) Create payment (v3/pay)
    const merchantTransactionId = `TXN${Date.now()}`;
    const payload = {
      merchantTransactionId,
      merchantId: process.env.MERCHANT_ID,
      amount: Number(amount), // paise
      redirectUrl: process.env.PAYMENT_REDIRECT_URL, // frontend page that handles success
      callbackUrl: `${process.env.BASE_URL}/api/payments/status`, // webhook (must be HTTPS and public)
      paymentInstrument: { type: "PAY_PAGE" },
      merchantUserInfo: { jobId, title },
      purpose: title || "Job Application"
    };

    let payRes;
    try {
      payRes = await axios.post(
        "https://api-preprod.phonepe.com/apis/pg-sandbox/v3/pay",
        payload,
        {
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          timeout: 15000,
        }
      );
      console.log("✅ payRes:", payRes.data?.code || "no-code", payRes.data?.message || "");
    } catch (err) {
      console.error("🚨 Pay API error:", err.response?.data || err.message);
      return res.status(500).json({ step: "pay", error: err.response?.data || err.message });
    }

    const redirectUrl = payRes.data?.data?.instrumentResponse?.redirectInfo?.url;
    if (!redirectUrl) {
      console.error("❌ No redirect URL in payRes:", payRes.data);
      return res.status(500).json({ step: "pay", error: "no redirect url", payRes: payRes.data });
    }

    // return payment url to frontend
    return res.json({ paymentUrl: redirectUrl, merchantTransactionId });
  } catch (err) {
    console.error("🔥 Unexpected error:", err);
    return res.status(500).json({ message: "Unexpected server error", details: err.message });
  }
});

// optional webhook receiver (PhonePe will call this with status)
router.post("/status", (req, res) => {
  console.log("📬 /status webhook body:", req.body);
  // TODO: verify X-VERIFY signature per PhonePe docs before trusting
  // Update order in DB etc.
  return res.json({ status: "ok" });
});

export default router;
