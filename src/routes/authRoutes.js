// routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Candidate from "../models/Candidate.js";
import Employer from "../models/Employer.js";
import Admin from "../models/Admin.js";

const router = express.Router();

// Generate JWT
const generateToken = (user, role) => {
  return jwt.sign({ user: { id: user._id, role } }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// ==========================
// Candidate Registration
// ==========================
router.post("/register/candidate", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      category,
      address,
      mobile,
      city,
      state,
      email,
      password,
    } = req.body;

    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ message: "Required fields missing" });

    const existingCandidate = await Candidate.findOne({ email });
    const existingEmployer = await Employer.findOne({ email });
    if (existingCandidate || existingEmployer)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const candidate = new Candidate({
      firstName,
      lastName,
      dateOfBirth,
      category,
      address,
      mobile,
      city,
      state,
      email,
      password: hashedPassword,
    });

    await candidate.save();
    res.status(201).json({ message: "Candidate registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

// ==========================
// Employer Registration
// ==========================
router.post("/register/employer", async (req, res) => {
  try {
    const {
      companyName,
      mobile,
      email,
      yearOfEstablishment,
      password,
      gstNumber,
      websiteLink,
      address,
      city,
      state,
      district,
      vacancy,
    } = req.body;

    if (!companyName || !email || !password)
      return res.status(400).json({ message: "Required fields missing" });

    const existingEmployer = await Employer.findOne({ email });
    const existingCandidate = await Candidate.findOne({ email });
    if (existingEmployer || existingCandidate)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const employer = new Employer({
      companyName,
      mobile,
      email,
      yearOfEstablishment,
      password: hashedPassword,
      gstNumber,
      websiteLink,
      address,
      city,
      state,
      district,
      vacancy,
    });

    await employer.save();
    res.status(201).json({ message: "Employer registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

// ==========================
// Universal Login (Candidate / Employer)
// ==========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    let user = await Candidate.findOne({ email });
    let role = "candidate";

    if (!user) {
      user = await Employer.findOne({ email });
      role = "employer";
    }

    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user, role);

    res.status(200).json({
      message: `${role} logged in successfully`,
      token,
      role,
      user:
        role === "candidate"
          ? {
              id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              category: user.category,
            }
          : {
              id: user._id,
              companyName: user.companyName,
              email: user.email,
            },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

// ==========================
// Admin Login
// ==========================
router.post("/login/admin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ user: { id: admin._id, role: "admin" } }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "Admin logged in successfully",
      token,
      role: "admin",
      user: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
