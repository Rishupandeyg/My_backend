// server/routes/jobcategories.js
import express from "express";
import JobCategory from "../models/JobCategory.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const categories = await JobCategory.find({}, { name: 1 })
      .sort({ name: 1 })
      .lean();

    res.json(categories);
  } catch (err) {
    console.error("Failed to load categories:", err);
    res.status(500).json({ message: "Could not load job categories" });
  }
});

export default router;
