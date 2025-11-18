// routes/newsAdminRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import NewsAdmin from "../models/NewsAdmin.js";

const router = express.Router();

// 🔥 TEMPORARY: Create Default News Admin (run only once)
router.get("/create-default-admin", async (req, res) => {
  try {
    const hashed = await bcrypt.hash("news@123", 10);

    const admin = await NewsAdmin.create({
      username: "newsadmin",
      password: hashed
    });

    res.json({ msg: "News Admin Created Successfully", admin });
  } catch (error) {
    res.status(500).json({ msg: "Error creating admin", error: error.message });
  }
});

// 🔐 Login Route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await NewsAdmin.findOne({ username });
  if (!admin) return res.status(401).json({ msg: "Invalid credentials" });

  const match = await bcrypt.compare(password, admin.password);
  if (!match) return res.status(401).json({ msg: "Invalid credentials" });

  const token = jwt.sign(
    { id: admin._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

export default router;
