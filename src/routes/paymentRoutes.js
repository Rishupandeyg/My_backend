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
    console.log("Incoming create-order:", req.body);

    const tokenRes = await axios.post(process.env.PHONEPE_BASE_URL, {
      client_id: process.env.PHONEPE_CLIENT_ID,
      client_secret: process.env.PHONEPE_SECRET,
      grant_type: "client_credentials",
    });

    console.log("Token Response:", tokenRes.data);
    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error("Access token missing from PhonePe");

    const payRes = await axios.post(
      "https://api-preprod.phonepe.com/apis/pg-sandbox/v3/pay",
      {
        merchantTransactionId: "TXN" + Date.now(),
        merchantId: "M23B6R5TD3JZN", // ✅ extracted from your client ID
        amount: req.body.amount,
        redirectUrl: "https://your-frontend-domain.com/payment-success",
        callbackUrl: "https://my-backend-knk9.onrender.com/api/payments/status",
        paymentInstrument: { type: "PAY_PAGE" },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("PhonePe payRes:", payRes.data);

    const redirectUrl = payRes.data?.data?.instrumentResponse?.redirectInfo?.url;
    if (!redirectUrl) throw new Error("Redirect URL missing");
    res.json({ paymentUrl: redirectUrl });
  } catch (err) {
    console.error("PhonePe error:", err.response?.data || err.message);
    res.status(500).json({
      message: "PhonePe order creation failed",
      details: err.response?.data || err.message,
    });
  }
});


export default router;
