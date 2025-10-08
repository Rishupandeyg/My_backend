import express from "express";
import Gallery from "../models/Gallery.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// 🧾 Get all gallery media (public)
router.get("/", async (req, res) => {
  try {
    const media = await Gallery.find().sort({ createdAt: -1 });
    res.json(media);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch gallery", error });
  }
});

// 🗑️ Delete media (admin only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== "Admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete media", error });
  }
});

export default router;
