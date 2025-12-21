import express from "express";
import PaidCandidate from "../models/PaidCandidate.js";

const router = express.Router();

/**
 * GET paid candidates
 * Optional query:
 *  - jobId
 */
router.get("/candidates", async (req, res) => {
  try {
    const { jobId } = req.query;

    const filter = { status: "SUCCESS" };
    if (jobId) filter.jobId = jobId;

    const paid = await PaidCandidate.find(filter)
      .populate("userId", "firstName lastName email")
      .populate("jobId", "category location")
      .sort({ paidAt: -1 });

    res.json(
      paid.map((c) => ({
        _id: c._id,
        user: c.userId,
        job: c.jobId,
        orderId: c.merchantOrderId,
        amount: c.amountPaise / 100,
        status: c.status,
        createdAt: c.paidAt,
      }))
    );
  } catch (err) {
    console.error("❌ paidRoutes error:", err);
    res.status(500).json({ error: "Failed to fetch paid candidates" });
  }
});

export default router;
