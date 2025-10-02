import express from "express";
import Candidate from "../models/Candidate.js";
import Payment from "../models/Payment.js";
const router = express.Router();

// Example: POST /api/payment
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "candidate") return res.status(403).json({ message: "Only candidates can pay" });

    const { amount, paymentMethod } = req.body;

    // Create payment record
    const payment = new Payment({
      candidate: req.user.id,
      amount,
      status: "success", // For testing, later integrate with actual gateway
      paymentMethod,
      transactionId: `TXN-${Date.now()}`,
    });
    await payment.save();

    // Update candidate
    await Candidate.findByIdAndUpdate(req.user.id, { isPaid: true });

    res.json({ message: "Payment successful", payment });
  } catch (err) {
    res.status(500).json({ message: "Payment failed", err });
  }
});

export default router;
