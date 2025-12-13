import express from "express";
import crypto from "crypto";
import Order from "../models/Order.js";
import Candidate from "../models/Candidate.js";
import PaidCandidate from "../models/PaidCandidate.js";

const router = express.Router();

/**
 * PHONEPE WEBHOOK
 * URL: /api/webhooks/phonepe
 * Method: POST
 */
router.post("/", async (req, res) => {
  try {
    /* --------------------------------------------------
       1️⃣ RAW BODY & SIGNATURE
    -------------------------------------------------- */

    const signature = req.headers["x-verify"];
    if (!signature) {
      return res.status(400).json({ error: "Missing signature header" });
    }

    // raw body REQUIRED
    const rawBody = req.body.toString("utf8");

    const expectedSignature = crypto
      .createHmac("sha256", process.env.PHONEPE_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("❌ Webhook signature mismatch");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    /* --------------------------------------------------
       2️⃣ PARSE PAYLOAD
    -------------------------------------------------- */

    const payload = JSON.parse(rawBody);

    const merchantOrderId =
      payload?.data?.merchantOrderId ||
      payload?.merchantOrderId ||
      payload?.orderId;

    if (!merchantOrderId) {
      return res.status(400).json({ error: "merchantOrderId missing" });
    }

    const rawStatus =
      payload?.data?.state ||
      payload?.data?.status ||
      payload?.state ||
      payload?.status ||
      "PENDING";

    const finalStatus = rawStatus.toUpperCase();

    /* --------------------------------------------------
       3️⃣ FETCH ORDER
    -------------------------------------------------- */

    const order = await Order.findOne({ merchantOrderId });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    /* --------------------------------------------------
       4️⃣ IDEMPOTENCY (VERY IMPORTANT)
    -------------------------------------------------- */

    if (["SUCCESS", "FAILED"].includes(order.status)) {
      // Already processed → acknowledge silently
      return res.json({ ok: true });
    }

    /* --------------------------------------------------
       5️⃣ SUCCESS CASE
    -------------------------------------------------- */

    if (["SUCCESS", "COMPLETED", "PAID"].includes(finalStatus)) {
      order.status = "SUCCESS";
      order.paymentProvider = "PHONEPE";
      order.paidAt = new Date();
      await order.save();

      // Mark candidate paid
      await Candidate.findByIdAndUpdate(order.userId, {
        isPaid: true,
        paidAt: new Date(),
        paidOrderId: merchantOrderId,
      });

      // Create PaidCandidate ONLY ONCE
      await PaidCandidate.updateOne(
        { merchantOrderId },
        {
          $setOnInsert: {
            userId: order.userId,
            merchantOrderId,
            jobId: order.jobId,
            amountPaise: order.amountPaise,
            paymentProvider: "PHONEPE",
            status: "SUCCESS",
            paidAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    /* --------------------------------------------------
       6️⃣ FAILURE CASE
    -------------------------------------------------- */

    else if (["FAILED", "CANCELLED", "DECLINED"].includes(finalStatus)) {
      order.status = "FAILED";
      await order.save();
    }

    /* --------------------------------------------------
       7️⃣ ACKNOWLEDGE WEBHOOK
    -------------------------------------------------- */

    return res.json({ ok: true });

  } catch (err) {
    console.error("❌ PHONEPE WEBHOOK ERROR:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
