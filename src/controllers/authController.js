// src/controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// const { generateOTP } = require("../utils/otp");
// const { sendEmailOTP } = require("../utils/sendOTP");

const generateToken = (user) => {
  const payload = { user: { id: user.id, role: user.role } };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

// Register
exports.register = async (req, res, next) => {
  try {
    const { name, email, mobile, password, role } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    user = new User({
      name,
      email,
      mobile,
      password: hash,
      role: role || "candidate",
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000,
    });

    await user.save();
    await sendEmailOTP(email, otp);

    res.status(201).json({ msg: "OTP sent to email" });
  } catch (err) {
    next(err);
  }
};

// Verify OTP
// exports.verifyOTP = async (req, res, next) => {
//   try {
//     const { email, otp } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ msg: "User not found" });

//     if (user.otp !== otp || user.otpExpiry < Date.now()) {
//       return res.status(400).json({ msg: "Invalid or expired OTP" });
//     }

//     user.isVerified = true;
//     user.otp = undefined;
//     user.otpExpiry = undefined;
//     await user.save();

//     res.json({ msg: "Account verified" });
//   } catch (err) {
//     next(err);
//   }
// };

// Normal Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });
    if (!user.isVerified) return res.status(403).json({ msg: "Verify account first" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = generateToken(user);
    res.json({ token, role: user.role });
  } catch (err) {
    next(err);
  }
};

// Request Login OTP
// exports.requestLoginOTP = async (req, res, next) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ msg: "User not found" });

//     const otp = generateOTP();
//     user.otp = otp;
//     user.otpExpiry = Date.now() + 10 * 60 * 1000;
//     await user.save();

//     await sendEmailOTP(email, otp);
//     res.json({ msg: "OTP sent for login" });
//   } catch (err) {
//     next(err);
//   }
// };

// Login with OTP
// exports.loginWithOTP = async (req, res, next) => {
//   try {
//     const { email, otp } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ msg: "User not found" });

//     if (user.otp !== otp || user.otpExpiry < Date.now()) {
//       return res.status(400).json({ msg: "Invalid or expired OTP" });
//     }

//     user.otp = undefined;
//     user.otpExpiry = undefined;
//     await user.save();

//     const token = generateToken(user);
//     res.json({ token, role: user.role });
//   } catch (err) {
//     next(err);
//   }
//};

// Admin login (fixed creds)
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ msg: "Not an admin" });
    }

    const admin = await User.findOne({ email });
    if (!admin) return res.status(400).json({ msg: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = generateToken(admin);
    res.json({ token, role: admin.role });
  } catch (err) {
    next(err);
  }
};
