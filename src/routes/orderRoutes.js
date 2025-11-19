import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

router.get("/status/:merchantOrderId", async (req, res) => {
  const { merchantOrderId } = req.params;

  const order = await Order.findOne({ merchantOrderId });

  if (!order) {
    return res.status(404).json({ status: "NOT_FOUND" });
  }

  return res.json({
    status: order.status,  
    jobId: order.jobId || null
  });
});

export default router;
