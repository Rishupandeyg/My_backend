// src/routes/devMockRoutes.js
import express from "express";
const router = express.Router();

router.get("/jobs", (req, res) => {
  return res.json({ jobs: [{ _id:"job_1", title:"Frontend Dev", finalPrice:499 }] });
});

router.get("/candidate/me", (req, res) => {
  const auth = req.headers.authorization || "";
  if (!auth) return res.status(404).json({ message: "Not authenticated" });
  return res.json({ candidate: { name: "Test Candidate", email: "candidate@example.com", contact: "9999999999" } });
});

router.post("/payments/create-order", (req, res) => {
  try {
    const amount = req.body.amount || 10000;
    const jobId = req.body.jobId || "unknown";
    const base = process.env.PAYMENT_REDIRECT_URL || "http://localhost:5173/payment-success";
    const url = `${base}?txn=MOCK${Date.now()}&amt=${amount}&job=${jobId}`;
    console.log("Mock create-order ->", url);
    return res.json({ paymentUrl: url });
  } catch (err) {
    console.error("Mock create-order error:", err);
    return res.status(500).json({ message: "Mock create-order failed", details: err.message });
  }
});

export default router;
