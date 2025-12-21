// import express from "express";
// import crypto from "crypto";
// import Order from "../models/Order.js";
// import Candidate from "../models/Candidate.js";
// import PaidCandidate from "../models/PaidCandidate.js";

// const router = express.Router();

// router.post("/", async (req, res) => {
//   try {
//     /* ---------------- AUTH ---------------- */

//     const receivedAuth = req.headers["authorization"];
//     if (!receivedAuth) {
//       return res.status(400).json({ error: "Missing Authorization header" });
//     }

//     const expectedAuth = crypto
//       .createHash("sha256")
//       .update(
//         `${process.env.PHONEPE_WEBHOOK_USERNAME}:${process.env.PHONEPE_WEBHOOK_PASSWORD}`
//       )
//       .digest("hex");

//     const normalizedReceived = receivedAuth.trim().toLowerCase();
//     const normalizedExpected = expectedAuth.toLowerCase();

//     if (normalizedReceived !== normalizedExpected) {
//       console.error("❌ Webhook auth mismatch");
//       return res.status(401).json({ error: "Unauthorized webhook" });
//     }

//     /* ---------------- PAYLOAD ---------------- */

//     const body = typeof req.body === "string"
//       ? JSON.parse(req.body)
//       : req.body;

//     const { event, payload } = body || {};

//     if (!event || !payload) {
//       return res.status(400).json({ error: "Invalid webhook payload" });
//     }

//     const merchantOrderId = payload.merchantOrderId;
//     const state = payload.state;

//     if (!merchantOrderId || !state) {
//       return res.status(400).json({ error: "Missing order data" });
//     }

//     /* ---------------- ORDER ---------------- */

//     const order = await Order.findOne({ merchantOrderId });
//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     // Idempotency
//     if (["SUCCESS", "FAILED"].includes(order.status)) {
//       return res.json({ ok: true });
//     }

//     /* ---------------- EVENTS ---------------- */

//     if (
//       event === "checkout.order.completed" &&
//       state === "COMPLETED"
//     ) {
//       order.status = "SUCCESS";
//       order.paymentProvider = "PHONEPE";
//       order.paidAt = new Date();
//       await order.save();

//       await Candidate.findByIdAndUpdate(order.userId, {
//         isPaid: true,
//         paidAt: new Date(),
//         paidOrderId: merchantOrderId,
//       });

//       await PaidCandidate.updateOne(
//         { merchantOrderId },
//         {
//           $setOnInsert: {
//             userId: order.userId,
//             merchantOrderId,
//             jobId: order.jobId,
//             amountPaise: order.amountPaise,
//             paymentProvider: "PHONEPE",
//             status: "SUCCESS",
//             paidAt: new Date(),
//           },
//         },
//         { upsert: true }
//       );
//     }

//     else if (
//       event === "checkout.order.failed" &&
//       state === "FAILED"
//     ) {
//       order.status = "FAILED";
//       await order.save();
//     }

//     // Refund events can be handled later
//     // pg.refund.completed
//     // pg.refund.failed

//     return res.json({ ok: true });

//   } catch (err) {
//     console.error("❌ PHONEPE WEBHOOK ERROR:", err);
//     return res.status(500).json({ error: "Webhook processing failed" });
//   }
// });

// export default router;

import express from "express";
import Order from "../models/Order.js";
import Candidate from "../models/Candidate.js";
import PaidCandidate from "../models/PaidCandidate.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    /* ================= BASIC AUTH ================= */

    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      console.error("❌ Missing Basic Auth");
      return res.status(401).send("Unauthorized");
    }

    const base64 = authHeader.split(" ")[1];
    const decoded = Buffer.from(base64, "base64").toString("utf8");
    const [username, password] = decoded.split(":");

    if (
      username !== process.env.PHONEPE_WEBHOOK_USERNAME ||
      password !== process.env.PHONEPE_WEBHOOK_PASSWORD
    ) {
      console.error("❌ Invalid webhook credentials");
      return res.status(401).send("Unauthorized");
    }

    /* ================= PAYLOAD ================= */

    const body = JSON.parse(req.body.toString());

    const { event, payload } = body || {};
    if (!event || !payload) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const merchantOrderId = payload.merchantOrderId;
    const state = payload.state;

    if (!merchantOrderId || !state) {
      return res.status(400).json({ error: "Missing order data" });
    }

    /* ================= ORDER ================= */

    const order = await Order.findOne({ merchantOrderId });
    if (!order) {
      console.warn("⚠️ Order not found:", merchantOrderId);
      return res.json({ ok: true }); // do NOT retry
    }

    // Idempotency
    if (["SUCCESS", "FAILED"].includes(order.status)) {
      return res.json({ ok: true });
    }

    /* ================= EVENTS ================= */

    if (event === "checkout.order.completed" && state === "COMPLETED") {
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

    else if (event === "checkout.order.failed" && state === "FAILED") {
      order.status = "FAILED";
      await order.save();
    }

    return res.json({ ok: true });

  } catch (err) {
    console.error("❌ PHONEPE WEBHOOK ERROR:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
