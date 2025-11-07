// backend/routes/paymentRoutes.js  (MOCK -> redirect to your frontend)
import express from "express";
const router = express.Router();

router.post("/create-order", (req, res) => {
  try {
    console.log("🟡 mock /create-order called, body:", req.body);
    const amount = req.body.amount || 10000; // paise
    const jobId = req.body.jobId || "unknown";

    // use env var PAYMENT_REDIRECT_URL if set, otherwise local dev URL
    const baseRedirect = process.env.PAYMENT_REDIRECT_URL || "http://localhost:5173/payment-success";
    const fakeUrl = `${baseRedirect}?txn=MOCK${Date.now()}&amt=${amount}&job=${jobId}`;

    return res.json({ paymentUrl: fakeUrl });
  } catch (err) {
    console.error("Mock create-order error:", err);
    return res.status(500).json({ message: "Mock create-order failed", details: err.message });
  }
});

export default router;
