// routes/newsRoutes.js
import express from "express";
import { verifyNewsAdmin } from "../middlewares/newsAdminAuth.js";
import News from "../models/News.js";

const router = express.Router();

// Create
router.post("/create", verifyNewsAdmin, async (req, res) => {
  const news = await News.create(req.body);
  res.json(news);
});

// Update
router.put("/update/:id", verifyNewsAdmin, async (req, res) => {
  const updated = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// Delete
router.delete("/delete/:id", verifyNewsAdmin, async (req, res) => {
  await News.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
});

// Public Route (no auth)
router.get("/", async (req, res) => {
  const news = await News.find().sort({ date: -1 });
  res.json(news);
});

export default router;
