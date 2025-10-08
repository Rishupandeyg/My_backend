import express from "express";
import Gallery from "../models/Gallery.js";
import auth, { authorizeRoles } from "../middlewares/auth.js";

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
router.delete("/:id", auth, authorizeRoles("admin"), async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete media", error });
  }
});

export default router;
