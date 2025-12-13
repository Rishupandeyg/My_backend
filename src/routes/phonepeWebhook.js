import express from "express";
import crypto from "crypto";
import Order from "../models/Order.js";
import Candidate from "../models/Candidate.js";
import PaidCandidate from "../models/PaidCandidate.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // 1️⃣ Signature verify
    const signature = req.headers["x-verify"];
    const payload = req.body.toString();

    const expected = crypto
      .createHmac("sha256", process.env.WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (signature !== expected) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // 2️⃣ Parse payload
    const data = JSON.parse(payload);

    const merchantOrderId =
      data?.data?.merchantOrderId || data?.merchantOrderId;

    const state =
      data?.data?.state || data?.data?.status || "PENDING";

    const finalStatus = state.toUpperCase();

    // 3️⃣ Find order
    const order = await Order.findOne({ merchantOrderId });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // 4️⃣ Idempotency
    if (["SUCCESS", "FAILED"].includes(order.status)) {
      return res.json({ ok: true });
    }

    // 5️⃣ Success case
    if (["SUCCESS", "COMPLETED", "PAID"].includes(finalStatus)) {
      order.status = "SUCCESS";
      await order.save();

      await Candidate.findByIdAndUpdate(order.userId, {
        isPaid: true,
        paidAt: new Date(),
        paidOrderId: merchantOrderId,
      });

      await PaidCandidate.create({
        userId: order.userId,
        merchantOrderId,
        jobId: order.jobId,
        amountPaise: order.amountPaise,
        paymentProvider: "PHONEPE",
        status: "SUCCESS",
        paidAt: new Date(),
      });
    }

    // 6️⃣ Failure case
    else if (["FAILED", "CANCELLED"].includes(finalStatus)) {
      order.status = "FAILED";
      await order.save();
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return res.status(500).json({ error: "Webhook failed" });
  }
});

export default router;
