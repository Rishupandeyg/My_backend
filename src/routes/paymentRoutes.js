// backend/routes/paymentRoutes.js  (MOCK)
import express from "express";
const router = express.Router();

router.post("/create-order", (req, res) => {
  try {
    console.log("🟡 mock /create-order called, body:", req.body);
    const amount = req.body.amount || 10000; // paise
    const jobId = req.body.jobId || "unknown";
    // fake payment url (या अपने frontend पे payment-success route दे दो)
    const fakeUrl = `https://example.com/fake-phonepe-pay?txn=MOCK${Date.now()}&amt=${amount}&job=${jobId}`;
    return res.json({ paymentUrl: fakeUrl });
  } catch (err) {
    console.error("Mock create-order error:", err);
    return res.status(500).json({ message: "Mock create-order failed", details: err.message });
  }
});

export default router;
