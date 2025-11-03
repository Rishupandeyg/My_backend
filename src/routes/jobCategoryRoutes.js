// server/routes/jobcategories.js
const express = require("express");
const router = express.Router();
const JobCategory = require("../models/JobCategory"); // see model below

// GET /api/jobcategories
router.get("/", async (req, res) => {
  try {
    const categories = await JobCategory.find({}, { name: 1 }).sort({ name: 1 }).lean();
    // return an array of objects [{ _id, name }, ...]
    res.json(categories);
  } catch (err) {
    console.error("Failed to load categories:", err);
    res.status(500).json({ message: "Could not load job categories" });
  }
});

module.exports = router;
