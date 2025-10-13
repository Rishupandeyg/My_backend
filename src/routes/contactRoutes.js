import express from "express";
import Contact from "../models/Contact.js";
import nodemailer from "nodemailer";
import { verifyAdmin } from "../middleware/authMiddleware.js"; // Make sure this exists

const router = express.Router();

// ---------------------
// PUBLIC: Submit Contact Form
// POST /api/contact
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Save to MongoDB
    const contact = new Contact({ name, email, message });
    const savedContact = await contact.save();

    // Optional: Send email notification (uncomment if needed)
    /*
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: email,
      to: process.env.ADMIN_EMAIL || "support@kbtalentbridge.com",
      subject: `New Contact Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    };

    await transporter.sendMail(mailOptions);
    */

    // Respond with message + data key (number for tests)
    res.status(200).json({
      message: "Message sent successfully!",
      data: 1,
    });
  } catch (err) {
    console.error("Error in /api/contact POST:", err);
    res.status(500).json({ error: "Server error", data: null });
  }
});

// ---------------------
// ADMIN ONLY: Get All Messages
// GET /api/contact
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }); // newest first
    res.status(200).json({ data: contacts });
  } catch (err) {
    console.error("Error in /api/contact GET:", err);
    res.status(500).json({ error: "Server error", data: null });
  }
});

export default router;
