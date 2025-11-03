// server/routes/jobcategories.js
import express from "express";
import JobCategory from "../models/JobCategory.js";

const router = express.Router();

/**
 * GET /api/jobcategories
 * Public: fetch all categories with name + fee
 */
router.get("/", async (req, res) => {
  try {
    const categories = await JobCategory.find({}, { name: 1, fee: 1 })
      .sort({ name: 1 })
      .lean();

    res.json(categories);
  } catch (err) {
    console.error("Failed to load categories:", err);
    res.status(500).json({ message: "Could not load job categories" });
  }
});

/**
 * POST /api/jobcategories
 * Admin: create new category with name + fee
 * Body: { name: "Acting", fee: 1000 }
 */
router.post("/", async (req, res) => {
  try {
    const { name, fee } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existing = await JobCategory.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: "Category already exists" });
    }

    const category = new JobCategory({
      name: name.trim(),
      fee: typeof fee === "number" ? fee : 0,
    });

    await category.save();
    res.status(201).json(category);
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ message: "Failed to create category" });
  }
});

/**
 * PATCH /api/jobcategories/:id
 * Admin: update category name and/or fee
 * Body: { name?: string, fee?: number }
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    if (req.body.name) updates.name = req.body.name.trim();
    if (typeof req.body.fee === "number") updates.fee = req.body.fee;

    const updated = await JobCategory.findByIdAndUpdate(id, updates, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ message: "Failed to update category" });
  }
});

export default router;
