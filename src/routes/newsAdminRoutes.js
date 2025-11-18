// routes/newsAdminRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import NewsAdmin from "../models/NewsAdmin.js";

const router = express.Router();

/* Create Default News Admin (Runs Only Once) */

router.get("/create-default-admin", async (req, res) => {
  try {
    const exists = await NewsAdmin.findOne({ username: "newsadmin" });

    if (exists) {
      return res.json({
        msg: "Admin already exists",
        admin: exists
      });
    }

    const hashedPassword = await bcrypt.hash("news@123", 10);

    const admin = await NewsAdmin.create({
      name: "News Admin",
      username: "newsadmin",
      email: "newsadmin@example.com",
      mobile: "9999999999",
      password: hashedPassword,
      role: "news-admin",
      isVerified: true
    });

    return res.json({
      msg: "News Admin Created Successfully",
      admin
    });

  } catch (error) {
    res.status(500).json({
      msg: "Error creating admin",
      error: error.message
    });
  }
});

/* Admin Login */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await NewsAdmin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token });

  } catch (error) {
    res.status(500).json({
      msg: "Login failed",
      error: error.message
    });
  }
});

export default router;
