import express from "express";
import crypto from "crypto";
import Order from "../models/Order.js";
import Candidate from "../models/Candidate.js";
import PaidCandidate from "../models/PaidCandidate.js";

const router = express.Router();

/**
 * PHONEPE WEBHOOK
 * POST /api/webhooks/phonepe
 */
router.post("/", async (req, res) => {
  try {
    /* --------------------------------------------------
       1️⃣ AUTHORIZATION VERIFY (PHONEPE WAY)
    -------------------------------------------------- */

    const receivedAuth = req.headers["authorization"];
    if (!receivedAuth) {
      return res.status(400).json({ error: "Missing Authorization header" });
    }

    const username = process.env.PHONEPE_WEBHOOK_USERNAME;
    const password = process.env.PHONEPE_WEBHOOK_PASSWORD;

    const expectedAuth = crypto
      .createHash("sha256")
      .update(`${username}:${password}`)
      .digest("hex");

    if (receivedAuth !== expectedAuth) {
      console.error("❌ PhonePe webhook auth failed");
      return res.status(401).json({ error: "Unauthorized webhook" });
    }

    /* --------------------------------------------------
       2️⃣ PARSE BODY (NO SIGNATURE ON BODY)
    -------------------------------------------------- */

    const payload =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const merchantOrderId =
      payload?.data?.merchantOrderId ||
      payload?.merchantOrderId;

    if (!merchantOrderId) {
      return res.status(400).json({ error: "merchantOrderId missing" });
    }

    const status =
      payload?.data?.state ||
      payload?.state ||
      "PENDING";

    const finalStatus = status.toUpperCase();

    /* --------------------------------------------------
       3️⃣ FETCH ORDER
    -------------------------------------------------- */

    const order = await Order.findOne({ merchantOrderId });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    /* --------------------------------------------------
       4️⃣ IDEMPOTENCY
    -------------------------------------------------- */

    if (["SUCCESS", "FAILED"].includes(order.status)) {
      return res.json({ ok: true });
    }

    /* --------------------------------------------------
       5️⃣ SUCCESS
    -------------------------------------------------- */

    if (finalStatus === "COMPLETED") {
      order.status = "SUCCESS";
      order.paymentProvider = "PHONEPE";
      order.paidAt = new Date();
      await order.save();

      await Candidate.findByIdAndUpdate(order.userId, {
        isPaid: true,
        paidAt: new Date(),
        paidOrderId: merchantOrderId,
      });

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
       6️⃣ FAILURE
    -------------------------------------------------- */

    else if (["FAILED", "CANCELLED"].includes(finalStatus)) {
      order.status = "FAILED";
      await order.save();
    }

    /* --------------------------------------------------
       7️⃣ ACK
    -------------------------------------------------- */

    return res.json({ ok: true });

  } catch (err) {
    console.error("❌ PHONEPE WEBHOOK ERROR:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
