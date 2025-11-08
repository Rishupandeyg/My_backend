// backend/routes/paymentRoutes.js
import express from "express";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from "pg-sdk-node";

dotenv.config();

const router = express.Router();

// 🧩 Initialize PhonePe SDK Client
const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const clientVersion = 1;
const env = Env.SANDBOX; // Use Env.PRODUCTION in live mode

const client = StandardCheckoutClient.getInstance(clientID, clientSecret, clientVersion, env);

// 🧾 Create Order Route
router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const merchantOrderId = randomUUID();
    const redirectUrl = `http://localhost:5000/check-status?merchantOrderId=${merchantOrderId}`;

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amount)
      .redirectUrl(redirectUrl)
      .build();

    const response = await client.pay(request);

    return res.json({
      checkoutPageUrl: response.redirectUrl,
      merchantOrderId,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Error creating order", details: error.message });
  }
});

export default router;
