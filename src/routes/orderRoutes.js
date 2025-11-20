import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

router.get("/status/:merchantOrderId", async (req, res) => {
  try {
    const { merchantOrderId } = req.params;

    const order = await Order.findOne({ merchantOrderId });

    if (!order) {
      return res.status(404).json({
        status: "NOT_FOUND",
        message: "Order not found"
      });
    }

    return res.json({
      status: order.status,
      jobId: order.jobId || null,
      merchantOrderId
    });

  } catch (err) {
    console.error("Status check error:", err);
    return res.status(500).json({
      status: "ERROR",
      message: "Internal server error"
    });
  }
});

export default router;
