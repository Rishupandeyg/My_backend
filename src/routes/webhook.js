// webhook.js
import express from "express";
import crypto from "crypto";
import dotenv from "dotenv";
import { Buffer } from "buffer";

dotenv.config();
const router = express.Router();
const SALT = process.env.PHONEPE_SALT_KEY;

// Note: adapt apiPath to exact path PhonePe expects in signature (check docs/dashboard)
const CALLBACK_API_PATH = "/pg/v1/payment/callback"; // replace if docs show different

router.post("/phonepe-webhook", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    const incomingXVerify = req.header("X-VERIFY") || req.header("x-verify");
    const rawString = req.body.toString("utf8");
    const base64Payload = Buffer.from(rawString).toString("base64");
    const stringToSign = base64Payload + CALLBACK_API_PATH + SALT;
    const expectedDigest = crypto.createHash("sha256").update(stringToSign).digest("hex");
    const expectedXVerify = `${expectedDigest}###1`;

    if (expectedXVerify !== incomingXVerify) {
      console.warn("signature mismatch", { expectedXVerify, incomingXVerify });
      return res.status(400).send("signature_mismatch");
    }

    const parsed = JSON.parse(rawString);
    const merchantTransactionId = parsed?.merchantTransactionId || parsed?.data?.merchantTransactionId || parsed?.data?.merchant_tx;
    const status = parsed?.status || parsed?.data?.status || parsed?.data?.paymentStatus;

    // idempotent DB update:
    // const order = await db.orders.findOne({ merchantTransactionId });
    // if (order && order.status === 'SUCCESS') return res.status(200).send('ok');
    // await db.orders.update({ merchantTransactionId }, { $set: { status, raw: parsed, updatedAt: new Date() } });

    console.log("webhook processed", merchantTransactionId, status);
    return res.status(200).send("OK");
  } catch (err) {
    console.error("webhook error:", err);
    return res.status(500).send("server_error");
  }
});

export default router;
