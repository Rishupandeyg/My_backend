import express from "express";
import fs from "fs";
import path from "path";
import Gallery from "../models/Gallery.js";
import auth, { authorizeRoles } from "../middlewares/auth.js";
import fileUpload from "express-fileupload";
import { cloudinary } from "../config/cloudinary.js"; // named import

const router = express.Router();

// Enable file upload middleware
router.use(fileUpload());

// 🖼 Upload media (admin only)
router.post("/upload", auth, authorizeRoles("admin"), async (req, res) => {
  if (!req.files || !req.files.file)
    return res.status(400).json({ message: "No file uploaded" });

  const file = req.files.file;

  try {
    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "gallery",
    });

    // Save in MongoDB
    const newMedia = await Gallery.create({
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      fileType: req.body.fileType || "photo",
      uploadedBy: req.user.id,
    });

    res.status(201).json(newMedia);
  } catch (err) {
    console.error("❌ Upload failed:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

// 🧾 Get all gallery media
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
    console.log("🗑️ Delete route hit for:", req.params.id);

    const media = await Gallery.findById(req.params.id);
    if (!media) {
      console.log("❌ Media not found in DB");
      return res.status(404).json({ message: "Media not found" });
    }

    // Delete from Cloudinary if public_id exists
    if (media.public_id) {
      const result = await cloudinary.uploader.destroy(media.public_id);
      console.log("🧹 Cloudinary delete result:", result);
    }

    // Delete local file if exists (optional fallback)
    const filePath = path.resolve(media.filepath || `./uploads/gallery/${media.filename}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("✅ File deleted from local server");
    } else {
      console.log("⚠️ Local file not found, skipping unlink");
    }

    // Delete MongoDB record
    await media.deleteOne();
    console.log("✅ MongoDB record deleted");

    res.json({ message: "Media deleted successfully" });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ message: "Failed to delete media", error: error.message });
  }
});

export default router;






// router.delete("/:id", auth, authorizeRoles("admin"), async (req, res) => {
//   try {
//     console.log("🗑️ Delete route hit for:", req.params.id);

//     const media = await Gallery.findById(req.params.id);
//     if (!media) {
//       console.log("❌ Media not found in DB");
//       return res.status(404).json({ message: "Media not found" });
//     }

//     const filePath = path.resolve(media.filepath || `./uploads/gallery/${media.filename}`);
//     console.log("🧾 File path to delete:", filePath);

//     if (fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//       console.log("✅ File deleted from server");
//     } else {
//       console.log("⚠️ File not found on disk, skipping unlink");
//     }

//     await media.deleteOne();
//     console.log("✅ MongoDB record deleted");

//     res.json({ message: "Deleted successfully" });
//   } catch (error) {
//     console.error("❌ Delete error:", error);
//     res.status(500).json({ message: "Failed to delete media", error: error.message });
//   }
// });

// // src/routes/galleryRoutes.js
// import express from "express";
// import path from "path";
// import fs from "fs";
// import Gallery from "../models/Gallery.js";
// import auth, { authorizeRoles } from "../middlewares/auth.js";

// const router = express.Router();

// // 🖼 Upload media (admin only)
// // Using express-fileupload, file is available in req.files.file
// router.post("/upload", auth, authorizeRoles("admin"), async (req, res) => {
//   if (!req.files || !req.files.file)
//     return res.status(400).json({ message: "No file uploaded" });

//   try {
//     const file = req.files.file;
//     const uploadDir = path.join("uploads", "gallery");
//     if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

//     const filename = Date.now() + path.extname(file.name);
//     const filepath = path.join(uploadDir, filename);

//     // Move file to uploads folder
//     await file.mv(filepath);

//     const newMedia = await Gallery.create({
//       filename,
//       filepath,
//       uploadedBy: req.user.id,
//       fileType: file.mimetype.startsWith("image")
//         ? "photo"
//         : file.mimetype.startsWith("video")
//         ? "video"
//         : "audio",
//     });

//     res.status(201).json(newMedia);
//   } catch (err) {
//     res.status(500).json({ message: "Upload failed", error: err.message });
//   }
// });

// // 🧾 Get all gallery media (public)
// router.get("/", async (req, res) => {
//   try {
//     const media = await Gallery.find().sort({ createdAt: -1 });
//     res.json(media);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch gallery", error });
//   }
// });

// // 🗑️ Delete media (admin only)
// router.delete("/:id", auth, authorizeRoles("admin"), async (req, res) => {
//   try {
//     const media = await Gallery.findById(req.params.id);
//     if (!media) return res.status(404).json({ message: "Media not found" });

//     // Delete file from server
//     if (fs.existsSync(media.filepath)) {
//       fs.unlinkSync(media.filepath);
//     }

//     // Delete from database
//     await media.remove();

//     res.json({ message: "Deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to delete media", error });
//   }
// });

// export default router;





// src/routes/galleryRoutes.js
// import express from "express";
// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import Gallery from "../models/Gallery.js";
// import auth, { authorizeRoles } from "../middlewares/auth.js";

// const router = express.Router();

// // ✅ Multer setup for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const dir = "./uploads/gallery";
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
//     cb(null, dir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage });

// // 🖼 Upload media (admin only)
// router.post("/upload", auth, authorizeRoles("admin"), upload.single("file"), async (req, res) => {
//   if (!req.file) return res.status(400).json({ message: "No file uploaded" });

//   try {
//     const newMedia = await Gallery.create({
//       filename: req.file.filename,
//       filepath: req.file.path,
//       uploadedBy: req.user.id,
//     });

//     res.status(201).json(newMedia);
//   } catch (err) {
//     res.status(500).json({ message: "Upload failed", error: err.message });
//   }
// });

// // 🧾 Get all gallery media (public)
// router.get("/", async (req, res) => {
//   try {
//     const media = await Gallery.find().sort({ createdAt: -1 });
//     res.json(media);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch gallery", error });
//   }
// });

// // 🗑️ Delete media (admin only)
// router.delete("/:id", auth, authorizeRoles("admin"), async (req, res) => {
//   try {
//     const media = await Gallery.findById(req.params.id);
//     if (!media) return res.status(404).json({ message: "Media not found" });

//     // Remove file from disk
//     if (fs.existsSync(media.filepath)) fs.unlinkSync(media.filepath);

//     await media.remove();
//     res.json({ message: "Deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to delete media", error });
//   }
// });

// export default router;
// src/routes/galleryRoutes.js



// import express from "express";
// import fs from "fs";
// import path from "path";
// import Gallery from "../models/Gallery.js";
// import auth, { authorizeRoles } from "../middlewares/auth.js";

// const router = express.Router();

// // 🖼 Upload media (admin only) using express-fileupload
// router.post("/upload", auth, authorizeRoles("admin"), async (req, res) => {
//   if (!req.files || !req.files.file) {
//     return res.status(400).json({ message: "No file uploaded" });
//   }

//   try {
//     const file = req.files.file;

//     // Ensure upload directory exists
//     const dir = "./uploads/gallery";
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

//     // Save file to disk
//     const filename = Date.now() + path.extname(file.name);
//     const filepath = path.join(dir, filename);
//     await file.mv(filepath);

//     // Save record in DB
//     const newMedia = await Gallery.create({
//       filename,
//       filepath,
//       uploadedBy: req.user.id,
//       fileType: file.mimetype.startsWith("image/")
//         ? "photo"
//         : file.mimetype.startsWith("video/")
//         ? "video"
//         : "audio",
//     });

//     res.status(201).json(newMedia);
//   } catch (err) {
//     console.error("Gallery upload error:", err);
//     res.status(500).json({ message: "Upload failed", error: err.message });
//   }
// });

// // 🧾 Get all gallery media (public)
// router.get("/", async (req, res) => {
//   try {
//     const media = await Gallery.find().sort({ createdAt: -1 });
//     res.json(media);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch gallery", error });
//   }
// });

// // 🗑️ Delete media (admin only)
// router.delete("/:id", auth, authorizeRoles("admin"), async (req, res) => {
//   try {
//     const media = await Gallery.findById(req.params.id);
//     if (!media) return res.status(404).json({ message: "Media not found" });

//     // Remove file from disk
//     if (fs.existsSync(media.filepath)) fs.unlinkSync(media.filepath);

//     await media.remove();
//     res.json({ message: "Deleted successfully" });
//   } catch (error) {
//     console.error("Gallery delete error:", error);
//     res.status(500).json({ message: "Failed to delete media", error });
//   }
// });

// export default router;
