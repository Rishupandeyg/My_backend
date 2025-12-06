// // routes/authRoutes.js
// import express from "express";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import Admin from "../models/Admin.js";

// const router = express.Router();

// // Generate JWT
// const generateToken = (user, role) => {
//   return jwt.sign({ user: { id: user._id, role } }, process.env.JWT_SECRET, {
//     expiresIn: "1d",
//   });
// };

// // ==========================
// // Candidate Registration
// // ==========================
// router.post("/register/candidate", async (req, res) => {
//   try {
//     const {
//       firstName,
//       lastName,
//       dateOfBirth,
//       category,
//       address,
//       mobile,
//       city,
//       state,
//       email,
//       password,
//     } = req.body;

//     if (!firstName || !lastName || !email || !password)
//       return res.status(400).json({ message: "Required fields missing" });

//     const existingCandidate = await Candidate.findOne({ email });
//     const existingEmployer = await Employer.findOne({ email });
//     if (existingCandidate || existingEmployer)
//       return res.status(400).json({ message: "Email already registered" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const candidate = new Candidate({
//       firstName,
//       lastName,
//       dateOfBirth,
//       category,
//       address,
//       mobile,
//       city,
//       state,
//       email,
//       password: hashedPassword,
//     });

//     await candidate.save();
//     res.status(201).json({ message: "Candidate registered successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error", error });
//   }
// });

// // ==========================
// // Employer Registration
// // ==========================
// router.post("/register/employer", async (req, res) => {
//   try {
//     const {
//       companyName,
//       mobile,
//       email,
//       yearOfEstablishment,
//       password,
//       gstNumber,
//       websiteLink,
//       address,
//       city,
//       state,
//       district,
//       vacancy,
//     } = req.body;

//     if (!companyName || !email || !password)
//       return res.status(400).json({ message: "Required fields missing" });

//     const existingEmployer = await Employer.findOne({ email });
//     const existingCandidate = await Candidate.findOne({ email });
//     if (existingEmployer || existingCandidate)
//       return res.status(400).json({ message: "Email already registered" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const employer = new Employer({
//       companyName,
//       mobile,
//       email,
//       yearOfEstablishment,
//       password: hashedPassword,
//       gstNumber,
//       websiteLink,
//       address,
//       city,
//       state,
//       district,
//       vacancy,
//     });

//     await employer.save();
//     res.status(201).json({ message: "Employer registered successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error", error });
//   }
// });

// // ==========================
// // Universal Login (Candidate / Employer)
// // ==========================
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password)
//       return res.status(400).json({ message: "Email and password required" });

//     let user = await Candidate.findOne({ email });
//     let role = "candidate";

//     if (!user) {
//       user = await Employer.findOne({ email });
//       role = "employer";
//     }

//     if (!user) return res.status(400).json({ message: "User not found" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

//     const token = generateToken(user, role);

//     res.status(200).json({
//       message: `${role} logged in successfully`,
//       token,
//       role,
//       user:
//         role === "candidate"
//           ? {
//               id: user._id,
//               firstName: user.firstName,
//               lastName: user.lastName,
//               email: user.email,
//               category: user.category,
//             }
//           : {
//               id: user._id,
//               companyName: user.companyName,
//               email: user.email,
//             },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error", error });
//   }
// });

// // ==========================
// // Admin Login
// // ==========================
// router.post("/login/admin", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const admin = await Admin.findOne({ email });
//     if (!admin) return res.status(400).json({ message: "Admin not found" });

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

//     const token = jwt.sign({ user: { id: admin._id, role: "admin" } }, process.env.JWT_SECRET, {
//       expiresIn: "1d",
//     });

//     res.status(200).json({
//       message: "Admin logged in successfully",
//       token,
//       role: "admin",
//       user: { id: admin._id, name: admin.name, email: admin.email },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// export default router;



// // src/routes/authRoutes.js
// import express from "express";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { v4 as uuidv4 } from "uuid";

// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import Admin from "../models/Admin.js";
// import Verification from "../models/Verification.js";
// import { generateOTP } from "../utils/otp.js";
// import { sendEmailOTP } from "../utils/sendOTP.js"; // email-only

// const router = express.Router();

// // Generate JWT
// const generateToken = (user, role) => {
//   return jwt.sign({ user: { id: user._id, role } }, process.env.JWT_SECRET, {
//     expiresIn: "1d",
//   });
// };

// // helper: create verification record and send otp (EMAIL only)
// // NOTE: will throw if sendEmailOTP fails — caller should handle rollback if needed
// async function createVerificationRecord({ value }) {
//   if (!value) throw new Error("Email value required for verification");

//   const otp = generateOTP();
//   const hashedOtp = await bcrypt.hash(String(otp), 10);
//   const verificationId = uuidv4();
//   const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

//   const ver = await Verification.create({
//     verificationId,
//     type: "email",
//     value,
//     otp: hashedOtp,
//     expiresAt,
//     attempts: 0,
//     used: false,
//   });

//   // attempt to send email
//   await sendEmailOTP(value, otp); // may throw

//   return verificationId;
// }

// // ==========================
// // Candidate Registration
// // ==========================
// router.post("/register/candidate", async (req, res) => {
//   try {
//     const {
//       firstName,
//       lastName,
//       dateOfBirth,
//       category,
//       address,
//       mobile,
//       city,
//       state,
//       email,
//       password,
//     } = req.body;

//     if (!firstName || !lastName || !email || !password) {
//       return res.status(400).json({ message: "Required fields missing: firstName, lastName, email, password" });
//     }

//     // duplicate check
//     const existingCandidate = await Candidate.findOne({ email }).lean();
//     const existingEmployer = await Employer.findOne({ email }).lean();
//     if (existingCandidate || existingEmployer) {
//       return res.status(400).json({ message: "Email already registered" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const candidate = new Candidate({
//       firstName,
//       lastName,
//       dateOfBirth,
//       category,
//       address,
//       mobile,
//       city,
//       state,
//       email,
//       password: hashedPassword,
//       isVerified: false,
//     });

//     await candidate.save();

//     // Create verification record and send OTP to email
//     try {
//       const verificationId = await createVerificationRecord({ value: email });
//       return res.status(201).json({ message: "Candidate registered. OTP sent to email.", verificationId });
//     } catch (sendErr) {
//       // rollback created candidate to avoid orphan unverified accounts
//       try {
//         await Candidate.deleteOne({ _id: candidate._id });
//         console.error("[register/candidate] Rolled back candidate due to OTP send failure");
//       } catch (delErr) {
//         console.error("[register/candidate] Failed to rollback candidate:", delErr);
//       }

//       console.error("[register/candidate] sendEmailOTP error:", sendErr);
//       // Distinguish send errors if possible
//       const errMsg = sendErr?.response?.body ? JSON.stringify(sendErr.response.body) : sendErr.message || String(sendErr);
//       return res.status(502).json({ message: "Failed to send OTP email. Registration aborted.", error: errMsg });
//     }
//   } catch (error) {
//     console.error("register/candidate error:", error);
//     if (error.name === "ValidationError") {
//       return res.status(400).json({ message: "Validation error", details: error.message });
//     }
//     if (error.code === 11000) {
//       return res.status(400).json({ message: "Duplicate key error", details: error.keyValue });
//     }
//     return res.status(500).json({ message: "Server error", error: error.message || String(error) });
//   }
// });

// // ==========================
// // Employer Registration
// // ==========================
// router.post("/register/employer", async (req, res) => {
//   try {
//     const {
//       companyName,
//       mobile,
//       email,
//       yearOfEstablishment,
//       password,
//       gstNumber,
//       websiteLink,
//       address,
//       city,
//       state,
//       district,
//       vacancy,
//     } = req.body;

//     if (!companyName || !email || !password) {
//       return res.status(400).json({ message: "Required fields missing: companyName, email, password" });
//     }

//     const existingEmployer = await Employer.findOne({ email }).lean();
//     const existingCandidate = await Candidate.findOne({ email }).lean();
//     if (existingEmployer || existingCandidate) {
//       return res.status(400).json({ message: "Email already registered" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const employer = new Employer({
//       companyName,
//       mobile,
//       email,
//       yearOfEstablishment,
//       password: hashedPassword,
//       gstNumber,
//       websiteLink,
//       address,
//       city,
//       state,
//       district,
//       vacancy,
//       isVerified: false,
//     });

//     await employer.save();

//     try {
//       const verificationId = await createVerificationRecord({ value: email });
//       return res.status(201).json({ message: "Employer registered. OTP sent to email.", verificationId });
//     } catch (sendErr) {
//       // rollback employer
//       try {
//         await Employer.deleteOne({ _id: employer._id });
//         console.error("[register/employer] Rolled back employer due to OTP send failure");
//       } catch (delErr) {
//         console.error("[register/employer] Failed to rollback employer:", delErr);
//       }

//       console.error("[register/employer] sendEmailOTP error:", sendErr);
//       const errMsg = sendErr?.response?.body ? JSON.stringify(sendErr.response.body) : sendErr.message || String(sendErr);
//       return res.status(502).json({ message: "Failed to send OTP email. Registration aborted.", error: errMsg });
//     }
//   } catch (error) {
//     console.error("register/employer error:", error);
//     if (error.name === "ValidationError") {
//       return res.status(400).json({ message: "Validation error", details: error.message });
//     }
//     if (error.code === 11000) {
//       return res.status(400).json({ message: "Duplicate key error", details: error.keyValue });
//     }
//     return res.status(500).json({ message: "Server error", error: error.message || String(error) });
//   }
// });

// // ==========================
// // Send OTP (email only)
// // POST /send-otp
// // body: { type: 'email', value: '<email>' }
// router.post("/send-otp", async (req, res) => {
//   try {
//     const { type, value } = req.body;
//     if (type !== "email" || !value)
//       return res.status(400).json({ message: "Only email OTP supported. Provide type: 'email' and value: '<email>'" });

//     const verificationId = await createVerificationRecord({ value });
//     return res.json({ message: "OTP sent to email", verificationId });
//   } catch (err) {
//     console.error("send-otp error:", err);
//     const errMsg = err?.response?.body ? JSON.stringify(err.response.body) : err.message || String(err);
//     return res.status(502).json({ message: "Failed to send OTP", error: errMsg });
//   }
// });

// // ==========================
// // Verify OTP
// // POST /verify-otp
// // body: { type?: 'email', value?: '<email>', otp: '123456', verificationId?: '<id>' }
// router.post("/verify-otp", async (req, res) => {
//   try {
//     const { type, value, otp, verificationId } = req.body;
//     if (!otp) return res.status(400).json({ message: "OTP required" });

//     let query = {};
//     if (verificationId) {
//       query = { verificationId };
//     } else {
//       if (type !== "email" || !value) {
//         return res.status(400).json({ message: "Provide type:'email' and value:'<email>' or verificationId" });
//       }
//       query = { type: "email", value };
//     }

//     const ver = await Verification.findOne(query).sort({ createdAt: -1 });
//     if (!ver) return res.status(400).json({ message: "Verification record not found" });
//     if (ver.used) return res.status(400).json({ message: "OTP already used" });
//     if (ver.expiresAt < new Date()) return res.status(400).json({ message: "OTP expired" });

//     const MAX_ATTEMPTS = 5;
//     if ((ver.attempts || 0) >= MAX_ATTEMPTS) return res.status(429).json({ message: "Too many attempts" });

//     const match = await bcrypt.compare(String(otp), ver.otp);
//     if (!match) {
//       ver.attempts = (ver.attempts || 0) + 1;
//       await ver.save();
//       const attemptsLeft = Math.max(0, MAX_ATTEMPTS - ver.attempts);
//       return res.status(400).json({ message: "Invalid OTP", attemptsLeft });
//     }

//     ver.used = true;
//     await ver.save();

//     // Mark the corresponding user (Candidate or Employer) as verified if present
//     const emailValue = ver.value;
//     let user = await Candidate.findOne({ email: emailValue });
//     if (user) {
//       user.isVerified = true;
//       await user.save();
//     } else {
//       user = await Employer.findOne({ email: emailValue });
//       if (user) {
//         user.isVerified = true;
//         await user.save();
//       }
//     }

//     return res.json({ message: "Verified" });
//   } catch (err) {
//     console.error("verify-otp error:", err);
//     return res.status(500).json({ message: "Server error", error: err.message || err });
//   }
// });

// // ==========================
// // Universal Login (Candidate / Employer)
// // ==========================
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password)
//       return res.status(400).json({ message: "Email and password required" });

//     let user = await Candidate.findOne({ email });
//     let role = "candidate";

//     if (!user) {
//       user = await Employer.findOne({ email });
//       role = "employer";
//     }

//     if (!user) return res.status(400).json({ message: "User not found" });

//     if (!user.isVerified) return res.status(403).json({ message: "Verify account first (check your email for OTP)" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

//     const token = generateToken(user, role);

//     res.status(200).json({
//       message: `${role} logged in successfully`,
//       token,
//       role,
//       user:
//         role === "candidate"
//           ? {
//               id: user._id,
//               firstName: user.firstName,
//               lastName: user.lastName,
//               email: user.email,
//               category: user.category,
//             }
//           : {
//               id: user._id,
//               companyName: user.companyName,
//               email: user.email,
//             },
//     });
//   } catch (error) {
//     console.error("login error:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// });

// // ==========================
// // Admin Login
// // ==========================
// router.post("/login/admin", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const admin = await Admin.findOne({ email });
//     if (!admin) return res.status(400).json({ message: "Admin not found" });

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

//     const token = jwt.sign({ user: { id: admin._id, role: "admin" } }, process.env.JWT_SECRET, {
//       expiresIn: "1d",
//     });

//     res.status(200).json({
//       message: "Admin logged in successfully",
//       token,
//       role: "admin",
//       user: { id: admin._id, name: admin.name, email: admin.email },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// export default router;

// import express from "express";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { v4 as uuidv4 } from "uuid";

// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import Admin from "../models/Admin.js";
// //import Verification from "../models/Verification.js";
// //import { generateOTP } from "../utils/otp.js";
// //import { sendEmailOTP } from "../utils/sendOTP.js"; // should send an email with OTP

// const router = express.Router();

// // Utility: generate JWT
// const generateToken = (user, role) => {
//   return jwt.sign({ user: { id: user._id, role } }, process.env.JWT_SECRET, {
//     expiresIn: "1d",
//   });
// };

// // Helper: create verification record and send otp (email-only)
// // async function createVerificationRecord({ value }) {
// //   if (!value) throw new Error("Email value required for verification");

// //   const otp = generateOTP(); // e.g. returns 6-digit number string
// //   const hashedOtp = await bcrypt.hash(String(otp), 10);
// //   const verificationId = uuidv4();
// //   const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

// //   const ver = await Verification.create({
// //     verificationId,
// //     type: "email",
// //     value,
// //     otp: hashedOtp,
// //     expiresAt,
// //     attempts: 0,
// //     used: false,
// //   });

//   // Attempt to send email (may throw)
// //   await sendEmailOTP(value, otp);

// //   return verificationId;
// // }

// // -------------------------
// // Candidate Registration
// // -------------------------
// router.post("/register/candidate", async (req, res) => {
//   try {
//     const {
//       firstName,
//       lastName,
//       dateOfBirth,
//       category,
//       address,
//       mobile,
//       city,
//       state,
//       email,
//       password,
//     } = req.body;

//     if (!firstName || !lastName || !email || !password)
//       return res.status(400).json({ message: "Required fields missing" });

//     // duplicate check
//     const existingCandidate = await Candidate.findOne({ email }).lean();
//     const existingEmployer = await Employer.findOne({ email }).lean();
//     if (existingCandidate || existingEmployer)
//       return res.status(400).json({ message: "Email already registered" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const candidate = new Candidate({
//       firstName,
//       lastName,
//       dateOfBirth,
//       category,
//       address,
//       mobile,
//       city,
//       state,
//       email,
//       password: hashedPassword,
//       isVerified: false,
//     });

//     await candidate.save();

//     // Create verification record and send OTP to email
//     try {
//       const verificationId = await createVerificationRecord({ value: email });
//       return res.status(201).json({
//         message: "Candidate registered. OTP sent to email.",
//         verificationId,
//       });
//     } catch (sendErr) {
//       // rollback created candidate to avoid orphan unverified accounts
//       try {
//         await Candidate.deleteOne({ _id: candidate._id });
//         console.error("[register/candidate] Rolled back candidate due to OTP send failure");
//       } catch (delErr) {
//         console.error("[register/candidate] Failed to rollback candidate:", delErr);
//       }

//       console.error("[register/candidate] sendEmailOTP error:", sendErr);
//       const errMsg = sendErr?.response?.body ? JSON.stringify(sendErr.response.body) : sendErr.message || String(sendErr);
//       return res.status(502).json({ message: "Failed to send OTP email. Registration aborted.", error: errMsg });
//     }
//   } catch (error) {
//     console.error("register/candidate error:", error);
//     if (error.name === "ValidationError") {
//       return res.status(400).json({ message: "Validation error", details: error.message });
//     }
//     if (error.code === 11000) {
//       return res.status(400).json({ message: "Duplicate key error", details: error.keyValue });
//     }
//     return res.status(500).json({ message: "Server error", error: error.message || String(error) });
//   }
// });

// // -------------------------
// // Employer Registration
// // -------------------------
// router.post("/register/employer", async (req, res) => {
//   try {
//     const {
//       companyName,
//       mobile,
//       email,
//       yearOfEstablishment,
//       password,
//       gstNumber,
//       websiteLink,
//       address,
//       city,
//       state,
//       district,
//       vacancy,
//     } = req.body;

//     if (!companyName || !email || !password)
//       return res.status(400).json({ message: "Required fields missing" });

//     const existingEmployer = await Employer.findOne({ email }).lean();
//     const existingCandidate = await Candidate.findOne({ email }).lean();
//     if (existingEmployer || existingCandidate)
//       return res.status(400).json({ message: "Email already registered" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const employer = new Employer({
//       companyName,
//       mobile,
//       email,
//       yearOfEstablishment,
//       password: hashedPassword,
//       gstNumber,
//       websiteLink,
//       address,
//       city,
//       state,
//       district,
//       vacancy,
//       isVerified: false,
//     });

//     await employer.save();

//     try {
//       const verificationId = await createVerificationRecord({ value: email });
//       return res.status(201).json({
//         message: "Employer registered. OTP sent to email.",
//         verificationId,
//       });
//     } catch (sendErr) {
//       // rollback employer
//       try {
//         await Employer.deleteOne({ _id: employer._id });
//         console.error("[register/employer] Rolled back employer due to OTP send failure");
//       } catch (delErr) {
//         console.error("[register/employer] Failed to rollback employer:", delErr);
//       }

//       console.error("[register/employer] sendEmailOTP error:", sendErr);
//       const errMsg = sendErr?.response?.body ? JSON.stringify(sendErr.response.body) : sendErr.message || String(sendErr);
//       return res.status(502).json({ message: "Failed to send OTP email. Registration aborted.", error: errMsg });
//     }
//   } catch (error) {
//     console.error("register/employer error:", error);
//     if (error.name === "ValidationError") {
//       return res.status(400).json({ message: "Validation error", details: error.message });
//     }
//     if (error.code === 11000) {
//       return res.status(400).json({ message: "Duplicate key error", details: error.keyValue });
//     }
//     return res.status(500).json({ message: "Server error", error: error.message || String(error) });
//   }
// });

// // -------------------------
// // Send OTP (email only)
// // POST /send-otp
// // body: { type: 'email', value: '<email>' }
// router.post("/send-otp", async (req, res) => {
//   try {
//     const { type, value } = req.body;
//     if (type !== "email" || !value)
//       return res.status(400).json({ message: "Only email OTP supported. Provide type: 'email' and value: '<email>'" });

//     const verificationId = await createVerificationRecord({ value });
//     return res.json({ message: "OTP sent to email", verificationId });
//   } catch (err) {
//     console.error("send-otp error:", err);
//     const errMsg = err?.response?.body ? JSON.stringify(err.response.body) : err.message || String(err);
//     return res.status(502).json({ message: "Failed to send OTP", error: errMsg });
//   }
// });

// // -------------------------
// // Verify OTP
// // POST /verify-otp
// // body: { type?: 'email', value?: '<email>', otp: '123456', verificationId?: '<id>' }
// router.post("/verify-otp", async (req, res) => {
//   try {
//     const { type, value, otp, verificationId } = req.body;
//     if (!otp) return res.status(400).json({ message: "OTP required" });

//     let query = {};
//     if (verificationId) {
//       query = { verificationId };
//     } else {
//       if (type !== "email" || !value) {
//         return res.status(400).json({ message: "Provide type:'email' and value:'<email>' or verificationId" });
//       }
//       query = { type: "email", value };
//     }

//     const ver = await Verification.findOne(query).sort({ createdAt: -1 });
//     if (!ver) return res.status(400).json({ message: "Verification record not found" });
//     if (ver.used) return res.status(400).json({ message: "OTP already used" });
//     if (ver.expiresAt < new Date()) return res.status(400).json({ message: "OTP expired" });

//     const MAX_ATTEMPTS = 5;
//     if ((ver.attempts || 0) >= MAX_ATTEMPTS) return res.status(429).json({ message: "Too many attempts" });

//     const match = await bcrypt.compare(String(otp), ver.otp);
//     if (!match) {
//       ver.attempts = (ver.attempts || 0) + 1;
//       await ver.save();
//       const attemptsLeft = Math.max(0, MAX_ATTEMPTS - ver.attempts);
//       return res.status(400).json({ message: "Invalid OTP", attemptsLeft });
//     }

//     ver.used = true;
//     await ver.save();

//     // Mark the corresponding user (Candidate or Employer) as verified if present
//     const emailValue = ver.value;
//     let user = await Candidate.findOne({ email: emailValue });
//     if (user) {
//       user.isVerified = true;
//       await user.save();
//     } else {
//       user = await Employer.findOne({ email: emailValue });
//       if (user) {
//         user.isVerified = true;
//         await user.save();
//       }
//     }

//     return res.json({ message: "Verified" });
//   } catch (err) {
//     console.error("verify-otp error:", err);
//     return res.status(500).json({ message: "Server error", error: err.message || err });
//   }
// });

// // -------------------------
// // Universal Login (Candidate / Employer)
// // NOTE: This version does NOT block login when isVerified=false. That was the cause of your problem.
// // If you want to enforce verification before login, uncomment the check below.
// // -------------------------
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password)
//       return res.status(400).json({ message: "Email and password required" });

//     let user = await Candidate.findOne({ email });
//     let role = "candidate";

//     if (!user) {
//       user = await Employer.findOne({ email });
//       role = "employer";
//     }

//     if (!user) return res.status(400).json({ message: "User not found" });

//     // If you want to require verification before login, uncomment the following:
//     // if (!user.isVerified) return res.status(403).json({ message: "Verify account first (check your email for OTP)" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

//     const token = generateToken(user, role);

//     res.status(200).json({
//       message: `${role} logged in successfully`,
//       token,
//       role,
//       user:
//         role === "candidate"
//           ? {
//               id: user._id,
//               firstName: user.firstName,
//               lastName: user.lastName,
//               email: user.email,
//               category: user.category,
//             }
//           : {
//               id: user._id,
//               companyName: user.companyName,
//               email: user.email,
//             },
//     });
//   } catch (error) {
//     console.error("login error:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// });

// // -------------------------
// // Admin Login
// // -------------------------
// router.post("/login/admin", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const admin = await Admin.findOne({ email });
//     if (!admin) return res.status(400).json({ message: "Admin not found" });

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

//     const token = jwt.sign({ user: { id: admin._id, role: "admin" } }, process.env.JWT_SECRET, {
//       expiresIn: "1d",
//     });

//     res.status(200).json({
//       message: "Admin logged in successfully",
//       token,
//       role: "admin",
//       user: { id: admin._id, name: admin.name, email: admin.email },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// export default router;


import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import Candidate from "../models/Candidate.js";
import Employer from "../models/Employer.js";
import Admin from "../models/Admin.js";
// import Verification from "../models/Verification.js";
// import { generateOTP } from "../utils/otp.js";
// import { sendEmailOTP } from "../utils/sendOTP.js";

const router = express.Router();

// Utility: generate JWT
const generateToken = (user, role) => {
  return jwt.sign({ user: { id: user._id, role } }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// 🚫 OTP SYSTEM REMOVED — createVerificationRecord DISABLED
// async function createVerificationRecord() {
//   return null;
// }

// -------------------------
// Candidate Registration (NO OTP)
// -------------------------
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

    const existingCandidate = await Candidate.findOne({ email }).lean();
    const existingEmployer = await Employer.findOne({ email }).lean();
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
      isVerified: true, // DIRECT VERIFY
    });

    await candidate.save();

    return res.status(201).json({
      message: "Candidate registered successfully (OTP disabled)",
    });
  } catch (error) {
    console.error("register/candidate error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
});

// -------------------------
// Employer Registration (NO OTP)
// -------------------------
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

    const existingEmployer = await Employer.findOne({ email }).lean();
    const existingCandidate = await Candidate.findOne({ email }).lean();
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
      isVerified: true, // DIRECT VERIFY
    });

    await employer.save();

    return res.status(201).json({
      message: "Employer registered successfully (OTP disabled)",
    });
  } catch (error) {
    console.error("register/employer error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
});

// 🚫 REMOVE SEND OTP ROUTE
// router.post("/send-otp", ... );

// 🚫 REMOVE VERIFY OTP ROUTE
// router.post("/verify-otp", ... );

// -------------------------
// Universal Login
// -------------------------
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
    console.error("login error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// -------------------------
// Admin Login
// -------------------------
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
