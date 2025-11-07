// backend/routes/paymentRoutes.js  (DIAGNOSTIC - paste exactly)
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post("/create-order", async (req, res) => {
  try {
    console.log("🔔 /create-order called - body:", req.body);

    // 1) Quick env check
    const needed = ["PHONEPE_CLIENT_ID","PHONEPE_SECRET","PHONEPE_BASE_URL","MERCHANT_ID","BASE_URL","PAYMENT_REDIRECT_URL"];
    const missing = needed.filter(k => !process.env[k]);
    if (missing.length) {
      console.error("❗ Missing env vars:", missing);
      return res.status(500).json({ error: "missing_env", missing });
    }

    // 2) Try token request (catch and return error details)
    let tokenRes;
    try {
      tokenRes = await axios.post(process.env.PHONEPE_BASE_URL, {
        client_id: process.env.PHONEPE_CLIENT_ID,
        client_secret: process.env.PHONEPE_SECRET,
        grant_type: "client_credentials"
      }, { headers: { "Content-Type": "application/json" }, timeout: 15000 });
      // mask token in logs/response
      console.log("✅ tokenRes: has_access_token=", !!tokenRes.data?.access_token, "expires_in=", tokenRes.data?.expires_in);
    } catch (err) {
      console.error("🚨 Token request failed:", err.response?.status, err.response?.data || err.message);
      return res.status(500).json({ step: "token", status: err.response?.status || null, error: err.response?.data || err.message });
    }

    const accessToken = tokenRes.data?.access_token;
    if (!accessToken) {
      console.error("❌ token response missing access_token:", tokenRes.data);
      return res.status(500).json({ step: "token", error: "no_access_token", tokenRes: tokenRes.data });
    }

    // 3) Try v3/pay (PhonePe) to get redirect URL
    const { amount = 10000, jobId = "unknown", title = "Job" } = req.body;
    const payload = {
      merchantTransactionId: `TXN${Date.now()}`,
      merchantId: process.env.MERCHANT_ID,
      amount: Number(amount),
      redirectUrl: process.env.PAYMENT_REDIRECT_URL,
      callbackUrl: `${process.env.BASE_URL}/api/payments/status`,
      paymentInstrument: { type: "PAY_PAGE" },
      merchantUserInfo: { jobId, title }
    };

    let payRes;
    try {
      payRes = await axios.post("https://api-preprod.phonepe.com/apis/pg-sandbox/v3/pay", payload, {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, timeout: 15000
      });
      console.log("✅ payRes.status:", payRes.status, "code:", payRes.data?.code || null);
    } catch (err) {
      console.error("🚨 Pay API failed:", err.response?.status, err.response?.data || err.message);
      return res.status(500).json({ step: "pay", status: err.response?.status || null, error: err.response?.data || err.message });
    }

    const redirectUrl = payRes.data?.data?.instrumentResponse?.redirectInfo?.url;
    if (!redirectUrl) {
      console.error("❌ No redirect url in payRes:", payRes.data);
      return res.status(500).json({ step: "pay", error: "no_redirect_url", payRes: payRes.data });
    }

    // success
    return res.json({ paymentUrl: redirectUrl, merchantTransactionId: payload.merchantTransactionId });
  } catch (err) {
    console.error("🔥 Unexpected error:", err);
    return res.status(500).json({ error: "unexpected", message: err.message });
  }
});

export default router;
