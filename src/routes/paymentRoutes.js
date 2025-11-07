// backend/routes/paymentRoutes.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

/**
 * Create PhonePe order
 */
router.post("/create-order", async (req, res) => {
  try {
    const { amount, jobId, title } = req.body;

    // 1️⃣ Step: Generate Access Token
    const tokenRes = await axios.post(process.env.PHONEPE_BASE_URL, {
      client_id: process.env.PHONEPE_CLIENT_ID,
      client_secret: process.env.PHONEPE_SECRET,
      grant_type: "client_credentials",
    });

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) return res.status(401).json({ message: "Failed to get access token" });

    // 2️⃣ Step: Create Payment
    const payRes = await axios.post(
      "https://api-preprod.phonepe.com/apis/pg-sandbox/v3/pay",
      {
        merchantTransactionId: "TXN" + Date.now(),
        merchantId: "M23B6R5TD3JZN", // extract from your client id (after TEST-)
        amount: amount,
        redirectUrl: "http://localhost:5173/payment-success", // your frontend page
        callbackUrl: "http://localhost:4000/api/payments/status", // backend webhook
        paymentInstrument: { type: "PAY_PAGE" },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const redirectUrl = payRes.data?.data?.instrumentResponse?.redirectInfo?.url;
    if (redirectUrl) {
      return res.json({ paymentUrl: redirectUrl });
    } else {
      return res.status(400).json({ message: "Payment link not found", data: payRes.data });
    }
  } catch (err) {
    console.error("PhonePe error:", err.response?.data || err.message);
    res.status(500).json({
      message: "PhonePe order creation failed",
      details: err.response?.data || err.message,
    });
  }
});

export default router;
