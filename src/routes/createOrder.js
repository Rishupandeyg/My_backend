// create-order handler (ESM)
import express from "express";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import { Buffer } from "buffer";

dotenv.config();
const router = express.Router();

const MERCHANT_ID = process.env.PHONEPE_CLIENT_ID;
const SALT_KEY = process.env. PHONEPE_SECRET;
const BASE = (process.env.PHONEPE_BASE_URL || "").replace(/\/$/, "");

// helper
function makeXVerify(apiPath, payloadObj) {
  const payloadString = JSON.stringify(payloadObj);
  const base64Payload = Buffer.from(payloadString).toString("base64");
  const stringToSign = base64Payload + apiPath + SALT_KEY;
  const digest = crypto.createHash("sha256").update(stringToSign).digest("hex");
  const xVerify = `${digest}###1`;
  return { base64Payload, xVerify };
}

router.post("/api/payments/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", jobId, title, candidate } = req.body;
    // build payload per PhonePe sandbox expected schema
    const merchantTransactionId = `ORDER_${Date.now()}`;
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: req.userId || (candidate && candidate.email) || "user_1",
      amount: amount, // in paise
      redirectUrl: process.env.PHONEPE_REDIRECT_URL || "https://kbtalentbridgestuidios.com/payment-status",
      redirectMode: "REDIRECT",
      callbackUrl: process.env.PHONEPE_WEBHOOK_URL || "https:https://my-backend-knk9.onrender.com///phonepe-webhook",
      paymentInstrument: { type: "PAY_PAGE" },
      // optional meta
      merchantMetaData: { jobId, title }
    };

    const apiPath = "/pg/v1/pay";
    const { base64Payload, xVerify } = makeXVerify(apiPath, payload);
    const url = `${BASE}${apiPath}`;

    const phonepeResp = await axios.post(url, { request: base64Payload }, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": MERCHANT_ID
      },
      timeout: 15000
    });

    const result = phonepeResp.data || {};
    // store order in DB: merchantTransactionId, amount, jobId, userId, status=PENDING
    // await db.orders.insert({ merchantTransactionId, amount, jobId, userId: req.userId, status: 'PENDING', createdAt: new Date() });

    // phonepe returns redirect url usually in result.data or result.paymentUrl depending on SDK
    const paymentUrl = result?.data?.redirectUrl || result?.data?.paymentUrl || result?.paymentUrl || result?.redirectUrl;

    return res.json({ paymentUrl, merchantTransactionId, raw: result });
  } catch (err) {
    console.error("create-order error:", err?.response?.data || err.message);
    return res.status(500).json({ message: "Failed to create order", error: err?.response?.data || err.message });
  }
});

export default router;
