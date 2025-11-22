// // routes/newsRoutes.js
// import express from "express";
// import { verifyNewsAdmin } from "../middlewares/newsAdminAuth.js";
// import News from "../models/News.js";

// const router = express.Router();

// // Create
// router.post("/create", verifyNewsAdmin, async (req, res) => {
//   const news = await News.create(req.body);
//   res.json(news);
// });

// // Update
// router.put("/update/:id", verifyNewsAdmin, async (req, res) => {
//   const updated = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
//   res.json(updated);
// });

// // Delete
// router.delete("/delete/:id", verifyNewsAdmin, async (req, res) => {
//   await News.findByIdAndDelete(req.params.id);
//   res.json({ msg: "Deleted" });
// });

// // Public Route (no auth)
// router.get("/", async (req, res) => {
//   const news = await News.find().sort({ date: -1 });
//   res.json(news);
// });

// export default router;


// // routes/newsRoutes.js
// import express from "express";
// import { verifyNewsAdmin } from "../middlewares/newsAdminAuth.js";
// import News from "../models/News.js";

// const router = express.Router();

// // Create
// router.post("/create", verifyNewsAdmin, async (req, res) => {
//   const news = await News.create(req.body);
//   res.json(news);
// });

// // Update
// router.put("/update/:id", verifyNewsAdmin, async (req, res) => {
//   const updated = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
//   res.json(updated);
// });

// // Delete
// router.delete("/delete/:id", verifyNewsAdmin, async (req, res) => {
//   await News.findByIdAndDelete(req.params.id);
//   res.json({ msg: "Deleted" });
// });

// // Public Route (no auth) - list all
// router.get("/", async (req, res) => {
//   const news = await News.find().sort({ date: -1 });
//   res.json(news);
// });

// // ←------ ADD THIS NEW ROUTE BELOW ------→
// // Public Route: get single news by id (no auth)
// router.get("/:id", async (req, res) => {
//   try {
//     const item = await News.findById(req.params.id);
//     if (!item) return res.status(404).json({ error: "News not found" });
//     res.json(item);
//   } catch (err) {
//     console.error("Error fetching news by id:", err);
//     // if invalid ObjectId or other error
//     return res.status(500).json({ error: "Server error" });
//   }
// });

// export default router;

// routes/newsRoutes.js
import express from "express";
import { verifyNewsAdmin } from "../middlewares/newsAdminAuth.js";
import News from "../models/News.js";

const router = express.Router();

// -----------------------------
// CREATE NEWS (image / video)
// -----------------------------
router.post("/create", verifyNewsAdmin, async (req, res) => {
  try {
    const { title, content, mediaUrl, mediaType, category } = req.body;

    if (!title || !content || !mediaUrl || !mediaType) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    if (!["image", "video"].includes(mediaType)) {
      return res.status(400).json({ error: "Invalid media type." });
    }

    const news = await News.create({
      title,
      content,
      mediaUrl,
      mediaType,
      category,
    });

    res.json(news);

  } catch (err) {
    console.error("Create News Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -----------------------------
// UPDATE NEWS
// -----------------------------
router.put("/update/:id", verifyNewsAdmin, async (req, res) => {
  try {
    const updated = await News.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -----------------------------
// DELETE NEWS
// -----------------------------
router.delete("/delete/:id", verifyNewsAdmin, async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    res.json({ msg: "Deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -----------------------------
// PUBLIC: GET ALL NEWS
// -----------------------------
router.get("/", async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// -----------------------------
// PUBLIC: GET SINGLE NEWS BY ID
// -----------------------------
router.get("/:id", async (req, res) => {
  try {
    const item = await News.findById(req.params.id);

    if (!item)
      return res.status(404).json({ error: "News not found" });

    res.json(item);

  } catch (err) {
    console.error("Error fetching news by id:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
