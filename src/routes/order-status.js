// order-status.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { Buffer } from "buffer";
import crypto from "crypto";
dotenv.config();

const router = express.Router();
const MERCHANT_ID = process.env.PHONEPE_CLIENT_ID;
const SALT_KEY = process.env.PHONEPE_SECRET;
const BASE = process.env.PHONEPE_BASE_URL.replace(/\/$/, "");

function makeXVerify(apiPath, payloadObj) {
  const payloadString = JSON.stringify(payloadObj);
  const base64Payload = Buffer.from(payloadString).toString("base64");
  const stringToSign = base64Payload + apiPath + SALT_KEY;
  const digest = crypto.createHash("sha256").update(stringToSign).digest("hex");
  return { base64Payload, xVerify: `${digest}###1` };
}

router.get("/api/payments/order-status", async (req, res) => {
  const merchantTransactionId = req.query.merchantTransactionId;
  if (!merchantTransactionId) return res.status(400).json({ message: "merchantTransactionId required" });
  try {
    const apiPath = "/pg/v1/status/single"; // example — check PhonePe docs for status endpoint
    const payload = { merchantId: MERCHANT_ID, merchantTransactionId };
    const { base64Payload, xVerify } = makeXVerify(apiPath, payload);
    const resp = await axios.post(`${BASE}${apiPath}`, { request: base64Payload }, {
      headers: { "Content-Type": "application/json", "X-VERIFY": xVerify, "X-MERCHANT-ID": MERCHANT_ID }
    });
    // parse resp.data and return friendly status
    return res.json({ status: resp.data?.data?.status || resp.data?.status || "UNKNOWN", raw: resp.data });
  } catch (err) {
    console.error("order-status error:", err?.response?.data || err.message);
    return res.status(500).json({ message: "Failed to fetch status", error: err?.response?.data || err.message });
  }
});

export default router;
