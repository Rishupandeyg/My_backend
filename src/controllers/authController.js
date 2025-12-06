// // src/controllers/authController.js
// const User = require("../models/User");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// // const { generateOTP } = require("../utils/otp");
// // const { sendEmailOTP } = require("../utils/sendOTP");

// const generateToken = (user) => {
//   const payload = { user: { id: user.id, role: user.role } };
//   return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
// };

// // Register
// exports.register = async (req, res, next) => {
//   try {
//     const { name, email, mobile, password, role } = req.body;
//     let user = await User.findOne({ email });
//     if (user) return res.status(400).json({ msg: "User already exists" });

//     const hash = await bcrypt.hash(password, 10);
//     const otp = generateOTP();

//     user = new User({
//       name,
//       email,
//       mobile,
//       password: hash,
//       role: role || "candidate",
//       otp,
//       otpExpiry: Date.now() + 10 * 60 * 1000,
//     });

//     await user.save();
//     await sendEmailOTP(email, otp);

//     res.status(201).json({ msg: "OTP sent to email" });
//   } catch (err) {
//     next(err);
//   }
// };

// // Verify OTP
// // exports.verifyOTP = async (req, res, next) => {
// //   try {
// //     const { email, otp } = req.body;
// //     const user = await User.findOne({ email });
// //     if (!user) return res.status(400).json({ msg: "User not found" });

// //     if (user.otp !== otp || user.otpExpiry < Date.now()) {
// //       return res.status(400).json({ msg: "Invalid or expired OTP" });
// //     }

// //     user.isVerified = true;
// //     user.otp = undefined;
// //     user.otpExpiry = undefined;
// //     await user.save();

// //     res.json({ msg: "Account verified" });
// //   } catch (err) {
// //     next(err);
// //   }
// // };

// // Normal Login
// exports.login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ msg: "User not found" });
//     if (!user.isVerified) return res.status(403).json({ msg: "Verify account first" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

//     const token = generateToken(user);
//     res.json({ token, role: user.role });
//   } catch (err) {
//     next(err);
//   }
// };

// // Request Login OTP
// // exports.requestLoginOTP = async (req, res, next) => {
// //   try {
// //     const { email } = req.body;
// //     const user = await User.findOne({ email });
// //     if (!user) return res.status(400).json({ msg: "User not found" });

// //     const otp = generateOTP();
// //     user.otp = otp;
// //     user.otpExpiry = Date.now() + 10 * 60 * 1000;
// //     await user.save();

// //     await sendEmailOTP(email, otp);
// //     res.json({ msg: "OTP sent for login" });
// //   } catch (err) {
// //     next(err);
// //   }
// // };

// // Login with OTP
// // exports.loginWithOTP = async (req, res, next) => {
// //   try {
// //     const { email, otp } = req.body;
// //     const user = await User.findOne({ email });
// //     if (!user) return res.status(400).json({ msg: "User not found" });

// //     if (user.otp !== otp || user.otpExpiry < Date.now()) {
// //       return res.status(400).json({ msg: "Invalid or expired OTP" });
// //     }

// //     user.otp = undefined;
// //     user.otpExpiry = undefined;
// //     await user.save();

// //     const token = generateToken(user);
// //     res.json({ token, role: user.role });
// //   } catch (err) {
// //     next(err);
// //   }
// //};

// // Admin login (fixed creds)
// exports.adminLogin = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;
//     if (email !== process.env.ADMIN_EMAIL) {
//       return res.status(403).json({ msg: "Not an admin" });
//     }

//     const admin = await User.findOne({ email });
//     if (!admin) return res.status(400).json({ msg: "Admin not found" });

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

//     const token = generateToken(admin);
//     res.json({ token, role: admin.role });
//   } catch (err) {
//     next(err);
//   }
// };


// // src/controllers/authController.js
// const User = require("../models/User");
// //const Verification = require("../models/Verification");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const { v4: uuidv4 } = require("uuid");

// //const { generateOTP } = require("../utils/otp");
// //const { sendEmailOTP } = require("../utils/sendOTP");

// const generateToken = (user) => {
//   const payload = { user: { id: user.id, role: user.role } };
//   return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });
// };

// // ------------ Register (email-only OTP) ------------
// exports.register = async (req, res, next) => {
//   try {
//     const { name, email, mobile, password, role } = req.body;

//     if (!email) return res.status(400).json({ msg: "Provide email" });
//     if (!password) return res.status(400).json({ msg: "Password is required" });

//     let user = await User.findOne({ email });
//     if (user) return res.status(400).json({ msg: "User already exists" });

//     const hash = await bcrypt.hash(password, 10);
//     const otp = generateOTP();

//     // create user but mark not verified
//     user = new User({
//       name,
//       email,
//       mobile,
//       password: hash,
//       role: role || "candidate",
//       isVerified: false,
//     });

//     await user.save();

//     // create verification record (so frontend can verify via verificationId)
//     const verificationId = uuidv4();
//     const hashedOtp = await bcrypt.hash(String(otp), 10);
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes (Date)

//     await Verification.create({
//       verificationId,
//       type: "email",
//       value: email,
//       otp: hashedOtp,
//       expiresAt,
//       attempts: 0,
//       used: false,
//     });

//     // send OTP via email
//     await sendEmailOTP(email, otp);

//     return res.status(201).json({ msg: "User registered. OTP sent to email.", verificationId });
//   } catch (err) {
//     next(err);
//   }
// };

// // ------------ Send OTP (email-only) ------------
// // POST /auth/send-otp
// // body: { type: 'email', value: '...', role?: 'candidate'|'employer' }
// // returns: { msg, verificationId }
// exports.sendOtp = async (req, res, next) => {
//   try {
//     const { type, value } = req.body;
//     if (!type || !value) return res.status(400).json({ msg: "Missing type or value" });
//     if (type !== "email") return res.status(400).json({ msg: "Only 'email' OTP is supported" });

//     // generate fresh OTP and hashed version
//     const otp = generateOTP();
//     const hashedOtp = await bcrypt.hash(String(otp), 10);
//     const verificationId = uuidv4();
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes (Date)

//     // Save verification record (one per verificationId)
//     await Verification.create({
//       verificationId,
//       type: "email",
//       value,
//       otp: hashedOtp,
//       expiresAt,
//       attempts: 0,
//       used: false,
//     });

//     // send via email
//     await sendEmailOTP(value, otp);

//     return res.json({ msg: "OTP sent to email", verificationId });
//   } catch (err) {
//     next(err);
//   }
// };

// // ------------ Verify OTP (email-only) ------------
// // POST /auth/verify-otp
// // body: { type?: 'email', value?: '<email>', otp: '123456', verificationId?: '<id>' }
// // returns 200 if valid
// exports.verifyOtp = async (req, res, next) => {
//   try {
//     const { type, value, otp, verificationId } = req.body;
//     if (!otp) return res.status(400).json({ msg: "OTP required" });

//     // If verificationId provided, lookup by it; otherwise require email
//     let query = {};
//     if (verificationId) {
//       query = { verificationId };
//     } else {
//       if (type !== "email" || !value) return res.status(400).json({ msg: "Provide type:'email' and value:'<email>' or verificationId" });
//       query = { type: "email", value };
//     }

//     // find the most recent matching verification (if multiple, pick newest)
//     const ver = await Verification.findOne(query).sort({ createdAt: -1 });

//     if (!ver) return res.status(400).json({ msg: "Verification record not found" });
//     if (ver.used) return res.status(400).json({ msg: "OTP already used" });
//     if (ver.expiresAt < new Date()) return res.status(400).json({ msg: "OTP expired" });

//     // throttle attempts
//     const MAX_ATTEMPTS = 5;
//     if ((ver.attempts || 0) >= MAX_ATTEMPTS) return res.status(429).json({ msg: "Too many attempts" });

//     const match = await bcrypt.compare(String(otp), ver.otp);
//     if (!match) {
//       ver.attempts = (ver.attempts || 0) + 1;
//       await ver.save();
//       return res.status(400).json({ msg: "Invalid OTP" });
//     }

//     // mark as used
//     ver.used = true;
//     await ver.save();

//     // if there's an existing user with this email, mark user verified
//     const user = await User.findOne({ email: ver.value });
//     if (user) {
//       user.isVerified = true;
//       // clear any otp fields in user doc if you were using them
//       user.otp = undefined;
//       user.otpExpiry = undefined;
//       await user.save();
//     }

//     return res.json({ msg: "Verified" });
//   } catch (err) {
//     next(err);
//   }
// };

// // ------------ Normal Login ------------
// exports.login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ msg: "User not found" });
//     if (!user.isVerified) return res.status(403).json({ msg: "Verify account first" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

//     const token = generateToken(user);
//     res.json({ token, role: user.role });
//   } catch (err) {
//     next(err);
//   }
// };

// // ------------ Admin login (fixed creds) ------------
// exports.adminLogin = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;
//     if (email !== process.env.ADMIN_EMAIL) {
//       return res.status(403).json({ msg: "Not an admin" });
//     }

//     const admin = await User.findOne({ email });
//     if (!admin) return res.status(400).json({ msg: "Admin not found" });

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

//     const token = generateToken(admin);
//     res.json({ token, role: admin.role });
//   } catch (err) {
//     next(err);
//   }
// };

// src/controllers/authController.js
const User = require("../models/User");

// ❌ OTP system removed
// const Verification = require("../models/Verification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

// ❌ OTP utilities removed
// const { generateOTP } = require("../utils/otp");
// const { sendEmailOTP } = require("../utils/sendOTP");

const generateToken = (user) => {
  const payload = { user: { id: user.id, role: user.role } };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });
};

// -----------------------------------------------------------------------------
// ✔️ REGISTER (NO OTP VERSION)
// -----------------------------------------------------------------------------
exports.register = async (req, res, next) => {
  try {
    const { name, email, mobile, password, role } = req.body;

    if (!email) return res.status(400).json({ msg: "Provide email" });
    if (!password) return res.status(400).json({ msg: "Password is required" });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    // ✔️ Create user and auto-verify (since OTP removed)
    user = new User({
      name,
      email,
      mobile,
      password: hash,
      role: role || "candidate",
      isVerified: true, // IMPORTANT
    });

    await user.save();

    const token = generateToken(user);

    return res.status(201).json({
      msg: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });

  } catch (err) {
    next(err);
  }
};

// -----------------------------------------------------------------------------
// ❌ SEND OTP — COMMENTED OUT (NOT USED ANYMORE)
// -----------------------------------------------------------------------------
// exports.sendOtp = async (req, res, next) => {
//   try {
//     const { type, value } = req.body;
//     if (!type || !value) return res.status(400).json({ msg: "Missing type or value" });

//     const otp = generateOTP();
//     const hashedOtp = await bcrypt.hash(String(otp), 10);
//     const verificationId = uuidv4();
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

//     await Verification.create({
//       verificationId,
//       type: "email",
//       value,
//       otp: hashedOtp,
//       expiresAt,
//       attempts: 0,
//       used: false,
//     });

//     await sendEmailOTP(value, otp);

//     res.json({ msg: "OTP sent", verificationId });
//   } catch (err) {
//     next(err);
//   }
// };

// -----------------------------------------------------------------------------
// ❌ VERIFY OTP — COMMENTED OUT (NOT USED ANYMORE)
// -----------------------------------------------------------------------------
// exports.verifyOtp = async (req, res, next) => {
//   try {
//     const { otp, verificationId } = req.body;
//     if (!otp) return res.status(400).json({ msg: "OTP required" });

//     const ver = await Verification.findOne({ verificationId });

//     if (!ver) return res.status(400).json({ msg: "Verification record not found" });
//     if (ver.used) return res.status(400).json({ msg: "OTP already used" });
//     if (ver.expiresAt < new Date()) return res.status(400).json({ msg: "OTP expired" });

//     const match = await bcrypt.compare(String(otp), ver.otp);
//     if (!match) return res.status(400).json({ msg: "Invalid OTP" });

//     ver.used = true;
//     await ver.save();

//     const user = await User.findOne({ email: ver.value });
//     if (user) {
//       user.isVerified = true;
//       user.otp = undefined;
//       user.otpExpiry = undefined;
//       await user.save();
//     }

//     res.json({ msg: "Verified" });
//   } catch (err) {
//     next(err);
//   }
// };

// -----------------------------------------------------------------------------
// ✔️ NORMAL LOGIN
// -----------------------------------------------------------------------------
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    if (!user.isVerified) {
      return res.status(403).json({ msg: "Verify account first" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = generateToken(user);

    res.json({ token, role: user.role });
  } catch (err) {
    next(err);
  }
};

// -----------------------------------------------------------------------------
// ✔️ ADMIN LOGIN
// -----------------------------------------------------------------------------
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
