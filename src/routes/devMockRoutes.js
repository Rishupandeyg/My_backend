// // backend/src/routes/devMockRoutes.js
// import express from "express";
// const router = express.Router();

// // This router is intended to be mounted at app.use('/api/payments', devMockRoutes)

// // POST /api/payments/create-order
// router.post("/create-order", (req, res) => {
//   try {
//     const amount = Number(req.body.amount) || 10000;
//     const jobId = req.body.jobId || "unknown";
//     const base = process.env.PAYMENT_REDIRECT_URL || "http://localhost:5173/payment-success";
//     const url = `${base}?txn=MOCK${Date.now()}&amt=${amount}&job=${jobId}`;
//     console.log("Mock create-order ->", url);
//     return res.json({ paymentUrl: url });
//   } catch (err) {
//     console.error("Mock create-order error:", err);
//     return res.status(500).json({ message: "Mock create-order failed", details: err.message });
//   }
// });

// export default router;
